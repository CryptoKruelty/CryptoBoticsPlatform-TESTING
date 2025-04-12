import { 
  users, bots, stripeEvents, platformStats, 
  type User, type InsertUser, 
  type Bot, type InsertBot,
  type StripeEvent, type InsertStripeEvent,
  type PlatformStats
} from "@shared/schema";

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
  markStripeEventProcessed(id: number): Promise<boolean>;
  
  // Platform stats operations
  getPlatformStats(): Promise<PlatformStats>;
  updatePlatformStats(updates: Partial<PlatformStats>): Promise<PlatformStats>;
}

export class MemStorage implements IStorage {
  private userStore: Map<number, User>;
  private botStore: Map<number, Bot>;
  private stripeEventStore: Map<number, StripeEvent>;
  private platformStatsStore: PlatformStats;
  private currentUserId: number;
  private currentBotId: number;
  private currentStripeEventId: number;

  constructor() {
    this.userStore = new Map();
    this.botStore = new Map();
    this.stripeEventStore = new Map();
    this.platformStatsStore = {
      id: 1,
      totalUsers: 0,
      activeBots: 0,
      totalRpcCalls: 0,
      dailyRpcCalls: 0,
      revenue: 0,
      updatedAt: new Date()
    };
    this.currentUserId = 1;
    this.currentBotId = 1;
    this.currentStripeEventId = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.userStore.get(id);
  }

  async getUserByDiscordId(discordId: string): Promise<User | undefined> {
    return Array.from(this.userStore.values()).find(
      (user) => user.discordId === discordId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { ...insertUser, id, createdAt: now };
    this.userStore.set(id, user);
    
    // Update platform stats
    this.platformStatsStore.totalUsers += 1;
    this.platformStatsStore.updatedAt = now;
    
    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | undefined> {
    const user = this.userStore.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...updates };
    this.userStore.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserStripeInfo(id: number, stripeInfo: { stripeCustomerId: string, subscriptionStatus?: string }): Promise<User | undefined> {
    const user = this.userStore.get(id);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      stripeCustomerId: stripeInfo.stripeCustomerId,
      subscriptionStatus: stripeInfo.subscriptionStatus as any || user.subscriptionStatus
    };
    this.userStore.set(id, updatedUser);
    return updatedUser;
  }

  // Bot operations
  async getBotsByUserId(userId: number): Promise<Bot[]> {
    return Array.from(this.botStore.values()).filter(
      (bot) => bot.userId === userId
    );
  }

  async getBot(id: number): Promise<Bot | undefined> {
    return this.botStore.get(id);
  }

  async createBot(insertBot: InsertBot): Promise<Bot> {
    const id = this.currentBotId++;
    const now = new Date();
    const bot: Bot = { 
      ...insertBot, 
      id, 
      status: 'configured', 
      lastUpdated: null,
      lastValue: null,
      createdAt: now 
    };
    this.botStore.set(id, bot);
    return bot;
  }

  async updateBot(id: number, updates: Partial<Bot>): Promise<Bot | undefined> {
    const bot = this.botStore.get(id);
    if (!bot) return undefined;
    
    const updatedBot = { ...bot, ...updates };
    this.botStore.set(id, updatedBot);
    
    // Update platform stats if status changed to/from active
    if (updates.status === 'active' && bot.status !== 'active') {
      this.platformStatsStore.activeBots += 1;
    } else if (bot.status === 'active' && updates.status && updates.status !== 'active') {
      this.platformStatsStore.activeBots = Math.max(0, this.platformStatsStore.activeBots - 1);
    }
    
    return updatedBot;
  }

  async deleteBot(id: number): Promise<boolean> {
    const bot = this.botStore.get(id);
    if (!bot) return false;
    
    // Update platform stats if the bot was active
    if (bot.status === 'active') {
      this.platformStatsStore.activeBots = Math.max(0, this.platformStatsStore.activeBots - 1);
    }
    
    return this.botStore.delete(id);
  }

  // Stripe operations
  async createStripeEvent(insertEvent: InsertStripeEvent): Promise<StripeEvent> {
    const id = this.currentStripeEventId++;
    const now = new Date();
    const event: StripeEvent = { ...insertEvent, id, processed: false, createdAt: now };
    this.stripeEventStore.set(id, event);
    return event;
  }

  async getUnprocessedStripeEvents(): Promise<StripeEvent[]> {
    return Array.from(this.stripeEventStore.values()).filter(
      (event) => !event.processed
    );
  }

  async markStripeEventProcessed(id: number): Promise<boolean> {
    const event = this.stripeEventStore.get(id);
    if (!event) return false;
    
    this.stripeEventStore.set(id, { ...event, processed: true });
    return true;
  }

  // Platform stats operations
  async getPlatformStats(): Promise<PlatformStats> {
    return this.platformStatsStore;
  }

  async updatePlatformStats(updates: Partial<PlatformStats>): Promise<PlatformStats> {
    this.platformStatsStore = { 
      ...this.platformStatsStore, 
      ...updates,
      updatedAt: new Date()
    };
    return this.platformStatsStore;
  }
}

export const storage = new MemStorage();
