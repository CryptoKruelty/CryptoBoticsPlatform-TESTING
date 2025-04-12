import Stripe from 'stripe';
import { storage } from "../storage";
import { User, Bot } from "@shared/schema";

class StripeService {
  private stripe: Stripe | null = null;
  private webhookSecret: string;
  private productPrices: Record<string, string> = {}; // Maps product type+frequency to price IDs
  
  constructor() {
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    this.webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';
    
    if (stripeSecretKey) {
      this.stripe = new Stripe(stripeSecretKey, {
        apiVersion: '2023-10-16'
      });
      
      // Default price mappings
      // In a real implementation, these would be stored in the database
      this.productPrices = {
        'standard_60': 'price_standard_60s',
        'standard_30': 'price_standard_30s',
        'standard_15': 'price_standard_15s',
        'alert_whale_60': 'price_alert_60s',
        'alert_whale_30': 'price_alert_30s',
        'alert_whale_15': 'price_alert_15s',
        'alert_buy_60': 'price_alert_60s',
        'alert_buy_30': 'price_alert_30s',
        'alert_buy_15': 'price_alert_15s',
        'custom_rpc_60': 'price_custom_60s',
        'custom_rpc_30': 'price_custom_30s',
        'custom_rpc_15': 'price_custom_15s'
      };
    } else {
      console.warn("Stripe API key not set. Payment functionality will not work.");
    }
  }
  
  async createCustomer(user: User): Promise<string | null> {
    if (!this.stripe || !user.email) {
      return null;
    }
    
    try {
      const customer = await this.stripe.customers.create({
        email: user.email,
        name: user.username,
        metadata: {
          discordId: user.discordId
        }
      });
      
      return customer.id;
    } catch (error) {
      console.error("Stripe customer creation error:", error);
      return null;
    }
  }
  
  async getCustomerSubscription(customerId: string): Promise<any | null> {
    if (!this.stripe) {
      return null;
    }
    
    try {
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        expand: ['data.default_payment_method']
      });
      
      return subscriptions.data[0] || null;
    } catch (error) {
      console.error("Subscription fetch error:", error);
      return null;
    }
  }
  
  async createBillingPortalSession(customerId: string, returnUrl: string): Promise<any> {
    if (!this.stripe) {
      throw new Error("Stripe not initialized");
    }
    
    return this.stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl
    });
  }
  
  async getBotPriceId(botType: string, updateFrequency: string): Promise<string | null> {
    const key = `${botType}_${updateFrequency}`;
    return this.productPrices[key] || null;
  }
  
  async createCheckoutSession(
    customerId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<any> {
    if (!this.stripe) {
      throw new Error("Stripe not initialized");
    }
    
    return this.stripe.checkout.sessions.create({
      customer: customerId,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: successUrl,
      cancel_url: cancelUrl
    });
  }
  
  async addSubscriptionItem(customerId: string, priceId: string, description: string): Promise<any | null> {
    if (!this.stripe) {
      return null;
    }
    
    try {
      // Get active subscription for customer
      const subscriptions = await this.stripe.subscriptions.list({
        customer: customerId,
        status: 'active',
        limit: 1
      });
      
      let subscription;
      
      if (subscriptions.data.length === 0) {
        // Create new subscription
        subscription = await this.stripe.subscriptions.create({
          customer: customerId,
          items: [{ price: priceId }],
          metadata: { description }
        });
        
        return subscription.items.data[0];
      } else {
        // Add item to existing subscription
        subscription = subscriptions.data[0];
        const subscriptionItem = await this.stripe.subscriptionItems.create({
          subscription: subscription.id,
          price: priceId,
          metadata: { description }
        });
        
        return subscriptionItem;
      }
    } catch (error) {
      console.error("Subscription item creation error:", error);
      return null;
    }
  }
  
  async updateSubscriptionItem(subscriptionItemId: string, priceId: string): Promise<any | null> {
    if (!this.stripe) {
      return null;
    }
    
    try {
      return await this.stripe.subscriptionItems.update(subscriptionItemId, {
        price: priceId
      });
    } catch (error) {
      console.error("Subscription item update error:", error);
      return null;
    }
  }
  
  async removeSubscriptionItem(subscriptionItemId: string): Promise<boolean> {
    if (!this.stripe) {
      return false;
    }
    
    try {
      await this.stripe.subscriptionItems.del(subscriptionItemId);
      return true;
    } catch (error) {
      console.error("Subscription item deletion error:", error);
      return false;
    }
  }
  
  constructWebhookEvent(payload: any, signature: string): Stripe.Event {
    if (!this.stripe) {
      throw new Error("Stripe not initialized");
    }
    
    if (!this.webhookSecret) {
      throw new Error("Webhook secret not configured");
    }
    
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.webhookSecret
    );
  }
  
  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    if (!this.stripe) {
      return;
    }
    
    try {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by customer ID
          let user: User | undefined;
          // In a real implementation, this would be a database query
          for (let i = 1; i <= 1000; i++) {
            const u = await storage.getUser(i);
            if (u && u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
          
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionStatus: subscription.status as any
            });
          }
          
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          const customerId = subscription.customer as string;
          
          // Find user by customer ID
          let user: User | undefined;
          for (let i = 1; i <= 1000; i++) {
            const u = await storage.getUser(i);
            if (u && u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
          
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionStatus: 'inactive'
            });
            
            // Pause all user's bots
            const bots = await storage.getBotsByUserId(user.id);
            for (const bot of bots) {
              if (bot.status === 'active') {
                await storage.updateBot(bot.id, { status: 'paused' });
              }
            }
          }
          
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          
          // Find user by customer ID
          let user: User | undefined;
          for (let i = 1; i <= 1000; i++) {
            const u = await storage.getUser(i);
            if (u && u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
          
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionStatus: 'active'
            });
          }
          
          break;
        }
        
        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice;
          const customerId = invoice.customer as string;
          
          // Find user by customer ID
          let user: User | undefined;
          for (let i = 1; i <= 1000; i++) {
            const u = await storage.getUser(i);
            if (u && u.stripeCustomerId === customerId) {
              user = u;
              break;
            }
          }
          
          if (user) {
            await storage.updateUser(user.id, {
              subscriptionStatus: 'past_due'
            });
          }
          
          break;
        }
      }
    } catch (error) {
      console.error("Webhook processing error:", error);
      throw error;
    }
  }
}

export const stripeService = new StripeService();
