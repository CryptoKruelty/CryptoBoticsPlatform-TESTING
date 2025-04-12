import crypto from "crypto";
import { storage } from "../storage";
import { blockchainService } from "./blockchain";
import { Bot } from "@shared/schema";

// In a real implementation, this would use Discord.js
class BotService {
  private activeBots: Map<number, NodeJS.Timeout>;
  private encryptionKey: string;
  
  constructor() {
    this.activeBots = new Map();
    this.encryptionKey = process.env.ENCRYPTION_KEY || "cryptobotics-key";
    
    // Register cleanup on process exit
    process.on('SIGINT', this.cleanup.bind(this));
    process.on('SIGTERM', this.cleanup.bind(this));
  }
  
  private cleanup() {
    for (const [botId, interval] of this.activeBots.entries()) {
      clearInterval(interval);
    }
    this.activeBots.clear();
  }
  
  async generateBotToken(): Promise<string> {
    // In a real implementation, this would register a new bot with Discord
    // and return the actual token
    const mockToken = `Bot.${crypto.randomBytes(16).toString("hex")}`;
    return this.encryptToken(mockToken);
  }
  
  private encryptToken(token: string): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(
      "aes-256-cbc", 
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
      iv
    );
    
    let encrypted = cipher.update(token, "utf8", "hex");
    encrypted += cipher.final("hex");
    return `${iv.toString("hex")}:${encrypted}`;
  }
  
  private decryptToken(encryptedToken: string): string {
    const [ivHex, encrypted] = encryptedToken.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(
      "aes-256-cbc", 
      Buffer.from(this.encryptionKey.padEnd(32).slice(0, 32)),
      iv
    );
    
    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
  }
  
  async startBot(botId: number): Promise<Bot> {
    const bot = await storage.getBot(botId);
    if (!bot) {
      throw new Error(`Bot with ID ${botId} not found`);
    }
    
    if (bot.status === 'active') {
      return bot; // Already running
    }
    
    // In a real implementation, this would authenticate with Discord
    // and start the bot service
    
    // Update bot status
    const updatedBot = await storage.updateBot(botId, { status: 'active' });
    
    if (!updatedBot) {
      throw new Error(`Failed to update bot status for ID ${botId}`);
    }
    
    // Set up update interval
    const updateIntervalMs = parseInt(updatedBot.updateFrequency) * 1000;
    const interval = setInterval(() => this.updateBotData(botId), updateIntervalMs);
    this.activeBots.set(botId, interval);
    
    // Initial update
    setTimeout(() => this.updateBotData(botId), 100);
    
    return updatedBot;
  }
  
  async stopBot(botId: number): Promise<Bot> {
    const interval = this.activeBots.get(botId);
    if (interval) {
      clearInterval(interval);
      this.activeBots.delete(botId);
    }
    
    const updatedBot = await storage.updateBot(botId, { status: 'paused' });
    if (!updatedBot) {
      throw new Error(`Failed to update bot status for ID ${botId}`);
    }
    
    return updatedBot;
  }
  
  async restartBot(botId: number): Promise<Bot> {
    await this.stopBot(botId);
    return this.startBot(botId);
  }
  
  private async updateBotData(botId: number): Promise<void> {
    try {
      const bot = await storage.getBot(botId);
      if (!bot) {
        console.error(`Bot with ID ${botId} not found during update`);
        return;
      }
      
      // Skip if not active
      if (bot.status !== 'active') {
        return;
      }
      
      let newValue: string | null = null;
      
      // Get blockchain data based on bot type
      switch (bot.type) {
        case 'standard': {
          if (bot.tokenAddress) {
            if (bot.configuration?.metricType === 'price' && bot.configuration?.pairAddress) {
              // Get token price from pair
              const price = await blockchainService.getPairPrice(
                bot.network,
                bot.configuration.pairAddress
              );
              newValue = price.toFixed(2);
            } else if (bot.configuration?.metricType === 'supply') {
              // Get token supply
              const supply = await blockchainService.getTokenSupply(
                bot.network,
                bot.tokenAddress
              );
              
              // Format supply
              const decimals = bot.configuration?.decimals || 18;
              const formattedSupply = (
                parseInt(supply) / Math.pow(10, decimals)
              ).toLocaleString();
              
              newValue = formattedSupply;
            } else if (bot.configuration?.metricType === 'balance' && bot.configuration?.walletAddress) {
              // Get wallet balance
              const balance = await blockchainService.getTokenBalance(
                bot.network,
                bot.tokenAddress,
                bot.configuration.walletAddress
              );
              
              // Format balance
              const decimals = bot.configuration?.decimals || 18;
              const formattedBalance = (
                parseInt(balance) / Math.pow(10, decimals)
              ).toLocaleString();
              
              newValue = formattedBalance;
            }
          }
          break;
        }
        
        case 'alert_whale':
        case 'alert_buy': {
          // In a real implementation, would check if there are new transactions
          // If there are, would send a message to the Discord channel
          // For this demo, we'll just update last value with a placeholder
          if (bot.type === 'alert_whale') {
            newValue = "Monitoring for whale transactions";
          } else {
            newValue = "Monitoring for buy transactions";
          }
          break;
        }
        
        case 'custom_rpc': {
          if (bot.tokenAddress && bot.configuration?.functionSignature) {
            // Call custom contract function
            try {
              const result = await blockchainService.callContractFunction(
                bot.network,
                bot.tokenAddress,
                bot.configuration.functionSignature,
                bot.configuration.args || []
              );
              
              // Apply formatting if provided
              if (bot.configuration?.formatter) {
                // Simple formatting by evaluating the formatter with the result
                // In a real implementation, this would use a safer approach
                newValue = bot.configuration.formatter.replace('{result}', result);
              } else {
                newValue = result;
              }
            } catch (error) {
              console.error(`Custom RPC call failed for bot ${botId}:`, error);
              newValue = "Error: RPC call failed";
            }
          }
          break;
        }
      }
      
      if (newValue !== null) {
        // In a real implementation, this would update the Discord bot's nickname or send a message
        // For this demo, we'll just update the last value in the database
        await storage.updateBot(botId, {
          lastValue: newValue,
          lastUpdated: new Date()
        });
        
        console.log(`Updated bot ${botId} (${bot.name}) with value: ${newValue}`);
      }
    } catch (error) {
      console.error(`Bot update error for ID ${botId}:`, error);
      // Update bot status to error
      await storage.updateBot(botId, { status: 'error' });
    }
  }
}

export const botService = new BotService();
