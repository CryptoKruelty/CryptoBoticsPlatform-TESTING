import { 
  users, bots, stripeEvents, platformStats, 
  type User, type InsertUser, 
  type Bot, type InsertBot,
  type StripeEvent, type InsertStripeEvent,
  type PlatformStats
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByDiscordId(discordId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User | undefined>;
  updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, subscriptionStatus?: string }): Promise<User | undefined>;
  
  // Bot operations
  getBotsByUserId(userId: number): Promise<Bot[]>;
  getBot(id: number): Promise<Bot | undefined>;
  createBot(bot: InsertBot): Promise<Bot>;
  updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined>;
  deleteBot(id: number): Promise<boolean>;
  
  // Stripe operations
  createStripeEvent(event: InsertStripeEvent): Promise<StripeEvent>;
  getUnprocessedStripeEvents(): Promise<StripeEvent[]>;
  getStripeEventByStripeId(stripeEventId: string): Promise<StripeEvent[] | null>;
  markStripeEventProcessed(id: number): Promise<boolean>;
  
  // Platform stats operations
  getPlatformStats(): Promise<PlatformStats>;
  updatePlatformStats(updates: Partial<PlatformStats>): Promise<PlatformStats>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.discordId, discordId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    
    // Update platform stats
    const [stats] = await db.select().from(platformStats).limit(1);
    if (stats) {
      await db.update(platformStats)
        .set({ 
          totalUsers: stats.totalUsers + 1,
          updatedAt: new Date()
        })
        .where(eq(platformStats.id, stats.id));
    } else {
      await db.insert(platformStats).values({
        totalUsers: 1,
        activeBots: 0,
        totalRpcCalls: 0,
        dailyRpcCalls: 0,
        revenue: 0
      });
    }
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, subscriptionStatus?: string }): Promise<User | undefined> {
    const updates: Partial<User> = {
      stripeCustomerId: stripeInfo.stripeCustomerId
    };
    
    if (stripeInfo.subscriptionStatus) {
      updates.subscriptionStatus = stripeInfo.subscriptionStatus as any;
    }
    
    const [updatedUser] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    
    return updatedUser;
  }

  // Bot operations
  async getBotsByUserId(userId: number): Promise<Bot[]> {
    return db.select().from(bots).where(eq(bots.userId, userId));
  }

  async getBot(id: number): Promise<Bot | undefined> {
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    return bot;
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const [bot] = await db.insert(bots).values(insertBot).returning();
    return bot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined> {
    // First, check if status is changing to/from active
    if (updates.status) {
      const [currentBot] = await db.select().from(bots).where(eq(bots.id, id));
      
      if (currentBot) {
        const activatingBot = updates.status === 'active' && currentBot.status !== 'active';
        const deactivatingBot = currentBot.status === 'active' && updates.status !== 'active';
        
        // Update platform stats if necessary
        if (activatingBot || deactivatingBot) {
          const [stats] = await db.select().from(platformStats).limit(1);
          
          if (stats) {
            if (activatingBot) {
              await db.update(platformStats)
                .set({ 
                  activeBots: stats.activeBots + 1,
                  updatedAt: new Date()
                })
                .where(eq(platformStats.id, stats.id));
            } else if (deactivatingBot) {
              await db.update(platformStats)
                .set({ 
                  activeBots: Math.max(0, stats.activeBots - 1),
                  updatedAt: new Date()
                })
                .where(eq(platformStats.id, stats.id));
            }
          }
        }
      }
    }
    
    // Update the bot
    const [updatedBot] = await db
      .update(bots)
      .set(updates)
      .where(eq(bots.id, id))
      .returning();
    
    return updatedBot;
  }

  async deleteBot(id: number): Promise<boolean> {
    // Check if bot is active before deleting
    const [bot] = await db.select().from(bots).where(eq(bots.id, id));
    
    if (bot) {
      if (bot.status === 'active') {
        // Update active bots count in platform stats
        const [stats] = await db.select().from(platformStats).limit(1);
        if (stats) {
          await db.update(platformStats)
            .set({ 
              activeBots: Math.max(0, stats.activeBots - 1),
              updatedAt: new Date()
            })
            .where(eq(platformStats.id, stats.id));
        }
      }
      
      // Delete the bot
      await db.delete(bots).where(eq(bots.id, id));
      return true;
    }
    
    return false;
  }

  // Stripe operations
  async createStripeEvent(insertEvent: InsertStripeEvent): Promise<StripeEvent> {
    const [event] = await db.insert(stripeEvents).values(insertEvent).returning();
    return event;
  }

  async getUnprocessedStripeEvents(): Promise<StripeEvent[]> {
    return db.select().from(stripeEvents).where(eq(stripeEvents.processed, false));
  }
  
  async getStripeEventByStripeId(stripeEventId: string): Promise<StripeEvent[] | null> {
    try {
      const events = await db
        .select()
        .from(stripeEvents)
        .where(eq(stripeEvents.stripeEventId, stripeEventId));
      
      return events;
    } catch (error) {
      console.error(`Error fetching stripe event by ID ${stripeEventId}:`, error);
      return null;
    }
  }

  async markStripeEventProcessed(id: number): Promise<boolean> {
    const result = await db
      .update(stripeEvents)
      .set({ processed: true })
      .where(eq(stripeEvents.id, id));
    
    return result.rowCount > 0;
  }

  // Platform stats operations
  async getPlatformStats(): Promise<PlatformStats> {
    const [stats] = await db.select().from(platformStats).limit(1);
    
    if (!stats) {
      // Create initial stats record if none exists
      const [newStats] = await db.insert(platformStats).values({
        totalUsers: 0,
        activeBots: 0,
        totalRpcCalls: 0,
        dailyRpcCalls: 0,
        revenue: 0
      }).returning();
      
      return newStats;
    }
    
    return stats;
  }

  async updatePlatformStats(updates: Partial<PlatformStats>): Promise<PlatformStats> {
    const [stats] = await db.select().from(platformStats).limit(1);
    
    if (!stats) {
      // Create initial stats with updates
      const [newStats] = await db.insert(platformStats).values({
        totalUsers: updates.totalUsers || 0,
        activeBots: updates.activeBots || 0,
        totalRpcCalls: updates.totalRpcCalls || 0,
        dailyRpcCalls: updates.dailyRpcCalls || 0,
        revenue: updates.revenue || 0
      }).returning();
      
      return newStats;
    }
    
    // Update existing stats
    const [updatedStats] = await db
      .update(platformStats)
      .set({
        ...updates,
        updatedAt: new Date()
      })
      .where(eq(platformStats.id, stats.id))
      .returning();
    
    return updatedStats;
  }
}

// Export storage instance
export const storage = new DatabaseStorage();
