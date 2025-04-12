import { pgTable, text, serial, integer, boolean, jsonb, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const botTypeEnum = pgEnum('bot_type', ['standard', 'alert_whale', 'alert_buy', 'custom_rpc']);
export const botStatusEnum = pgEnum('bot_status', ['active', 'paused', 'configured', 'error']);
export const blockchainNetworkEnum = pgEnum('blockchain_network', ['ethereum', 'bsc', 'polygon', 'arbitrum']);
export const subscriptionStatusEnum = pgEnum('subscription_status', ['active', 'inactive', 'past_due', 'canceled']);
export const updateFrequencyEnum = pgEnum('update_frequency', ['60', '30', '15']);

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  discordId: text("discord_id").notNull().unique(),
  username: text("username").notNull(),
  avatar: text("avatar"),
  email: text("email"),
  stripeCustomerId: text("stripe_customer_id"),
  subscriptionStatus: subscriptionStatusEnum("subscription_status").default('inactive'),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  tokenExpires: timestamp("token_expires"),
  isAdmin: boolean("is_admin").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Bots Table
export const bots = pgTable("bots", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  name: text("name").notNull(),
  type: botTypeEnum("type").notNull(),
  status: botStatusEnum("status").default('configured'),
  botToken: text("bot_token"),
  discordGuildId: text("discord_guild_id").notNull(),
  discordChannelId: text("discord_channel_id"),
  network: blockchainNetworkEnum("network").notNull(),
  tokenAddress: text("token_address"),
  updateFrequency: updateFrequencyEnum("update_frequency").default('60'),
  configuration: jsonb("configuration"), // Stores type-specific configuration
  stripeSubscriptionItemId: text("stripe_subscription_item_id"),
  lastValue: text("last_value"),
  lastUpdated: timestamp("last_updated"),
  createdAt: timestamp("created_at").defaultNow()
});

// Platform Stats Table
export const platformStats = pgTable("platform_stats", {
  id: serial("id").primaryKey(),
  totalUsers: integer("total_users").default(0),
  activeBots: integer("active_bots").default(0),
  totalRpcCalls: integer("total_rpc_calls").default(0),
  dailyRpcCalls: integer("daily_rpc_calls").default(0),
  revenue: integer("revenue").default(0),
  updatedAt: timestamp("updated_at").defaultNow()
});

// Stripe Events Table
export const stripeEvents = pgTable("stripe_events", {
  id: serial("id").primaryKey(),
  stripeEventId: text("stripe_event_id").notNull().unique(),
  type: text("type").notNull(),
  data: jsonb("data").notNull(),
  processed: boolean("processed").default(false),
  createdAt: timestamp("created_at").defaultNow()
});

// Create Insert Schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true
});

export const insertBotSchema = createInsertSchema(bots).omit({
  id: true,
  status: true,
  lastValue: true,
  lastUpdated: true,
  createdAt: true
});

export const insertStripeEventSchema = createInsertSchema(stripeEvents).omit({
  id: true,
  createdAt: true
});

// Type definitions
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Bot = typeof bots.$inferSelect;
export type InsertBot = z.infer<typeof insertBotSchema>;

export type StripeEvent = typeof stripeEvents.$inferSelect;
export type InsertStripeEvent = z.infer<typeof insertStripeEventSchema>;

export type PlatformStats = typeof platformStats.$inferSelect;

// Additional schemas for API validations
export const botConfigurationSchema = z.object({
  name: z.string().min(3).max(50),
  type: z.enum(['standard', 'alert_whale', 'alert_buy', 'custom_rpc']),
  network: z.enum(['ethereum', 'bsc', 'polygon', 'arbitrum']),
  guildId: z.string(),
  channelId: z.string().optional(),
  tokenAddress: z.string().optional(),
  updateFrequency: z.enum(['60', '30', '15']),
  configuration: z.record(z.any()).optional()
});

export const discordAuthSchema = z.object({
  code: z.string()
});
