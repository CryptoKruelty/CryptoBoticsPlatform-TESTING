import { apiRequest } from "./queryClient";

export interface Guild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

export interface Channel {
  id: string;
  name: string;
  type: number;
}

export const getDiscordGuilds = async (): Promise<Guild[]> => {
  try {
    // In a real implementation, this would fetch guilds from the server
    // For this demo, we'll return mock data
    return [
      {
        id: '1234567890',
        name: 'Crypto Traders Guild',
        icon: null,
        owner: true,
        permissions: '2147483647',
        features: []
      },
      {
        id: '0987654321',
        name: 'DeFi Enthusiasts',
        icon: null,
        owner: true,
        permissions: '2147483647',
        features: []
      }
    ];
  } catch (error) {
    console.error('Discord guilds error:', error);
    throw error;
  }
};

export const getDiscordChannels = async (guildId: string): Promise<Channel[]> => {
  try {
    // In a real implementation, this would fetch channels from the server
    // For this demo, we'll return mock data
    return [
      {
        id: '1111111111',
        name: 'general',
        type: 0
      },
      {
        id: '2222222222',
        name: 'price-updates',
        type: 0
      },
      {
        id: '3333333333',
        name: 'whale-alerts',
        type: 0
      }
    ];
  } catch (error) {
    console.error('Discord channels error:', error);
    throw error;
  }
};

export const getDiscordGuildIcon = (guildId: string, iconHash: string | null): string => {
  if (!iconHash) {
    return `https://ui-avatars.com/api/?name=${encodeURIComponent('DG')}&background=5865F2&color=fff`;
  }
  return `https://cdn.discordapp.com/icons/${guildId}/${iconHash}.png`;
};
