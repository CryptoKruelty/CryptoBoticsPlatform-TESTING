import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import crypto from "crypto";
import session from "express-session";
import MemoryStore from "memorystore";
import { discordAuthService } from "./services/discord";
import { blockchainService } from "./services/blockchain";
import { stripeService } from "./services/stripe";
import { botService } from "./services/bot";
import { ensureAuthenticated, ensureAdmin } from "./middleware/auth";
import { botConfigurationSchema, discordAuthSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  const MemoryStoreSession = MemoryStore(session);
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "cryptobotics-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
        secure: process.env.NODE_ENV === "production",
        httpOnly: true
      },
      store: new MemoryStoreSession({
        checkPeriod: 86400000 // prune expired entries every 24h
      })
    })
  );

  // Setup Discord OAuth routes
  app.get("/auth/discord", (req, res) => {
    const state = req.query.state as string;
    if (!state) {
      return res.status(400).json({ message: "Missing state parameter" });
    }
    req.session.oauthState = state;
    
    // In development, always use localhost:5000
    const redirectUri = process.env.NODE_ENV === 'production'
      ? `https://${process.env.SERVER_HOST || 'localhost'}/auth/discord/callback`
      : 'http://localhost:5000/auth/discord/callback';
      
    const authUrl = discordAuthService.getAuthorizationUrl(redirectUri, state);
    res.redirect(authUrl);
  });

  app.get("/auth/discord/callback", async (req, res) => {
    try {
      const { code, state } = req.query as { code: string, state: string };
      
      // Validate state parameter
      if (!req.session.oauthState || req.session.oauthState !== state) {
        return res.status(400).json({ message: "Invalid state parameter" });
      }
      
      // In development, always use localhost:5000
      const redirectUri = process.env.NODE_ENV === 'production'
        ? `https://${process.env.SERVER_HOST || 'localhost'}/auth/discord/callback`
        : 'http://localhost:5000/auth/discord/callback';
      
      const tokenData = await discordAuthService.exchangeCode(code, redirectUri);
      const userData = await discordAuthService.getUserInfo(tokenData.access_token);
      
      // Find or create user
      let user = await storage.getUserByDiscordId(userData.id);
      if (user) {
        user = await storage.updateUser(user.id, {
          username: userData.username,
          avatar: userData.avatar,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
          email: userData.email
        });
      } else {
        user = await storage.createUser({
          discordId: userData.id,
          username: userData.username,
          avatar: userData.avatar,
          email: userData.email,
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpires: new Date(Date.now() + tokenData.expires_in * 1000),
          isAdmin: false,
          subscriptionStatus: 'inactive'
        });
      }
      
      // Set user in session
      req.session.userId = user.id;
      
      // Redirect to dashboard
      res.redirect("/dashboard");
    } catch (error) {
      console.error("Auth callback error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.get("/auth/status", async (req, res) => {
    if (req.session.userId) {
      const user = await storage.getUser(req.session.userId);
      if (user) {
        return res.json({
          authenticated: true,
          user: {
            id: user.id,
            discordId: user.discordId,
            username: user.username,
            avatar: user.avatar,
            isAdmin: user.isAdmin,
            subscriptionStatus: user.subscriptionStatus
          }
        });
      }
    }
    
    res.json({ authenticated: false });
  });

  app.get("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destruction error:", err);
      }
      res.redirect("/");
    });
  });

  // User routes
  app.get("/api/user/profile", ensureAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Omit sensitive data
    const { accessToken, refreshToken, ...safeUser } = user;
    res.json(safeUser);
  });

  app.get("/api/user/subscription", ensureAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    if (!user.stripeCustomerId) {
      return res.json({ 
        status: 'inactive',
        details: null 
      });
    }
    
    try {
      const subscription = await stripeService.getCustomerSubscription(user.stripeCustomerId);
      res.json({
        status: user.subscriptionStatus,
        details: subscription
      });
    } catch (error) {
      console.error("Error fetching subscription:", error);
      res.status(500).json({ message: "Failed to fetch subscription details" });
    }
  });

  app.get("/api/user/billing-portal", ensureAuthenticated, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user || !user.stripeCustomerId) {
      return res.status(400).json({ message: "No customer record found" });
    }
    
    try {
      // Use SERVER_HOST and include port 5000 (development server port)
      const host = process.env.SERVER_HOST || 'localhost';
      const port = process.env.NODE_ENV === 'production' ? '' : ':5000';
      const returnUrl = `http://${host}${port}/dashboard`;
      
      const portalSession = await stripeService.createBillingPortalSession(
        user.stripeCustomerId,
        returnUrl
      );
      
      res.json({ url: portalSession.url });
    } catch (error) {
      console.error("Billing portal error:", error);
      res.status(500).json({ message: "Failed to generate billing portal URL" });
    }
  });

  // Bot routes
  app.get("/api/bots", ensureAuthenticated, async (req, res) => {
    const userId = req.session.userId!;
    const bots = await storage.getBotsByUserId(userId);
    res.json(bots);
  });

  app.post("/api/bots", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const botConfig = botConfigurationSchema.parse(req.body);
      
      // Check if user has an active subscription
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.stripeCustomerId) {
        return res.status(400).json({ message: "Subscription required to create bots" });
      }
      
      // Get all user bots to check subscription limits
      const userBots = await storage.getBotsByUserId(userId);
      if (userBots.length >= 5) { // Assuming a limit of 5 bots
        return res.status(400).json({ message: "Bot limit reached for current subscription" });
      }
      
      // Create Stripe subscription item for the bot
      const priceId = await stripeService.getBotPriceId(botConfig.type, botConfig.updateFrequency);
      if (!priceId) {
        return res.status(400).json({ message: "Invalid bot configuration" });
      }
      
      const subscriptionItem = await stripeService.addSubscriptionItem(
        user.stripeCustomerId,
        priceId,
        `Bot: ${botConfig.name}`
      );
      
      if (!subscriptionItem) {
        return res.status(500).json({ message: "Failed to create subscription" });
      }
      
      // Generate and encrypt bot token
      const botToken = await botService.generateBotToken();
      
      // Create the bot in storage
      const bot = await storage.createBot({
        userId,
        name: botConfig.name,
        type: botConfig.type,
        botToken,
        discordGuildId: botConfig.guildId,
        discordChannelId: botConfig.channelId || null,
        network: botConfig.network,
        tokenAddress: botConfig.tokenAddress || null,
        updateFrequency: botConfig.updateFrequency,
        configuration: botConfig.configuration || {},
        stripeSubscriptionItemId: subscriptionItem.id
      });
      
      // Start the bot
      await botService.startBot(bot.id);
      
      res.status(201).json(bot);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid bot configuration", errors: error.errors });
      } else {
        console.error("Bot creation error:", error);
        res.status(500).json({ message: "Failed to create bot" });
      }
    }
  });

  app.get("/api/bots/:id", ensureAuthenticated, async (req, res) => {
    const botId = parseInt(req.params.id);
    const userId = req.session.userId!;
    
    const bot = await storage.getBot(botId);
    if (!bot) {
      return res.status(404).json({ message: "Bot not found" });
    }
    
    if (bot.userId !== userId && !req.session.isAdmin) {
      return res.status(403).json({ message: "Not authorized to access this bot" });
    }
    
    res.json(bot);
  });

  app.put("/api/bots/:id", ensureAuthenticated, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to update this bot" });
      }
      
      // Validate updates
      const updates = req.body;
      
      // Check for update frequency changes that would affect billing
      if (updates.updateFrequency && updates.updateFrequency !== bot.updateFrequency) {
        const user = await storage.getUser(userId);
        if (!user || !user.stripeCustomerId) {
          return res.status(400).json({ message: "No subscription found" });
        }
        
        // Update the subscription item
        const priceId = await stripeService.getBotPriceId(bot.type, updates.updateFrequency);
        if (!priceId) {
          return res.status(400).json({ message: "Invalid update frequency" });
        }
        
        await stripeService.updateSubscriptionItem(
          bot.stripeSubscriptionItemId!,
          priceId
        );
      }
      
      // Update bot
      const updatedBot = await storage.updateBot(botId, updates);
      
      // Apply changes to running bot if needed
      if (bot.status === 'active') {
        await botService.restartBot(botId);
      }
      
      res.json(updatedBot);
    } catch (error) {
      console.error("Bot update error:", error);
      res.status(500).json({ message: "Failed to update bot" });
    }
  });

  app.delete("/api/bots/:id", ensureAuthenticated, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to delete this bot" });
      }
      
      // Stop the bot if running
      if (bot.status === 'active') {
        await botService.stopBot(botId);
      }
      
      // If there's a subscription item, cancel it
      if (bot.stripeSubscriptionItemId) {
        const user = await storage.getUser(userId);
        if (user && user.stripeCustomerId) {
          await stripeService.removeSubscriptionItem(bot.stripeSubscriptionItemId);
        }
      }
      
      // Delete the bot
      await storage.deleteBot(botId);
      
      res.status(200).json({ message: "Bot deleted successfully" });
    } catch (error) {
      console.error("Bot deletion error:", error);
      res.status(500).json({ message: "Failed to delete bot" });
    }
  });

  app.post("/api/bots/:id/start", ensureAuthenticated, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to start this bot" });
      }
      
      // Check subscription status
      const user = await storage.getUser(userId);
      if (!user || user.subscriptionStatus !== 'active') {
        return res.status(400).json({ message: "Active subscription required to start bot" });
      }
      
      // Start the bot
      const startedBot = await botService.startBot(botId);
      
      res.json(startedBot);
    } catch (error) {
      console.error("Bot start error:", error);
      res.status(500).json({ message: "Failed to start bot" });
    }
  });

  app.post("/api/bots/:id/stop", ensureAuthenticated, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to stop this bot" });
      }
      
      // Stop the bot
      const stoppedBot = await botService.stopBot(botId);
      
      res.json(stoppedBot);
    } catch (error) {
      console.error("Bot stop error:", error);
      res.status(500).json({ message: "Failed to stop bot" });
    }
  });

  app.post("/api/bots/:id/restart", ensureAuthenticated, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const userId = req.session.userId!;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      if (bot.userId !== userId && !req.session.isAdmin) {
        return res.status(403).json({ message: "Not authorized to restart this bot" });
      }
      
      // Restart the bot
      const restartedBot = await botService.restartBot(botId);
      
      res.json(restartedBot);
    } catch (error) {
      console.error("Bot restart error:", error);
      res.status(500).json({ message: "Failed to restart bot" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", ensureAdmin, async (req, res) => {
    try {
      // In a real implementation, this would fetch from database with pagination
      // For this memory implementation, just collecting all users
      const userList: User[] = [];
      for (let i = 1; i <= 1000; i++) {
        const user = await storage.getUser(i);
        if (user) userList.push(user);
      }
      res.json(userList);
    } catch (error) {
      console.error("Admin users error:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/bots", ensureAdmin, async (req, res) => {
    try {
      // In a real implementation, this would fetch from database with pagination
      // For this memory implementation, just collecting all bots
      const botList: Bot[] = [];
      for (let i = 1; i <= 1000; i++) {
        const bot = await storage.getBot(i);
        if (bot) botList.push(bot);
      }
      res.json(botList);
    } catch (error) {
      console.error("Admin bots error:", error);
      res.status(500).json({ message: "Failed to fetch bots" });
    }
  });

  app.get("/api/admin/stats", ensureAdmin, async (req, res) => {
    try {
      const stats = await storage.getPlatformStats();
      res.json(stats);
    } catch (error) {
      console.error("Admin stats error:", error);
      res.status(500).json({ message: "Failed to fetch platform statistics" });
    }
  });

  app.post("/api/admin/bots/:id/manage", ensureAdmin, async (req, res) => {
    try {
      const botId = parseInt(req.params.id);
      const action = req.body.action;
      
      const bot = await storage.getBot(botId);
      if (!bot) {
        return res.status(404).json({ message: "Bot not found" });
      }
      
      let result;
      switch (action) {
        case 'start':
          result = await botService.startBot(botId);
          break;
        case 'stop':
          result = await botService.stopBot(botId);
          break;
        case 'restart':
          result = await botService.restartBot(botId);
          break;
        default:
          return res.status(400).json({ message: "Invalid action" });
      }
      
      res.json(result);
    } catch (error) {
      console.error("Admin bot manage error:", error);
      res.status(500).json({ message: "Failed to manage bot" });
    }
  });

  // Stripe webhook handler
  app.post("/webhooks/stripe", async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!sig) {
      console.error("Missing Stripe signature");
      return res.status(400).json({ message: "Missing Stripe signature" });
    }
    
    // Check if webhook secret is configured
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe webhook secret not configured");
      return res.status(500).json({ message: "Webhook not configured" });
    }
    
    try {
      // For parsing the raw body, express.raw middleware should be used for this route in production
      const event = stripeService.constructWebhookEvent(req.body, sig);
      
      console.log(`Processing Stripe webhook: ${event.type}`);
      
      // Store event in database for audit and retry purposes
      await storage.createStripeEvent({
        stripeEventId: event.id,
        type: event.type,
        data: event.data.object,
        processed: false
      });
      
      // Process the event
      await stripeService.handleWebhookEvent(event);
      
      // Mark as processed
      const events = await storage.getStripeEventByStripeId(event.id);
      if (events && events.length > 0) {
        await storage.markStripeEventProcessed(events[0].id);
      }
      
      res.json({ received: true });
    } catch (error) {
      console.error("Stripe webhook error:", error);
      res.status(400).json({ message: "Webhook error" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
