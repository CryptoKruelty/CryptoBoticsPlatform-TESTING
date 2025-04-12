import { apiRequest } from "./queryClient";

export interface User {
  id: number;
  discordId: string;
  username: string;
  avatar: string;
  isAdmin: boolean;
  subscriptionStatus: string;
}

export interface AuthStatus {
  authenticated: boolean;
  user?: User;
}

export const loginWithDiscord = () => {
  window.location.href = '/auth/discord';
};

export const logout = async () => {
  try {
    await apiRequest('GET', '/auth/logout', undefined);
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
  }
};

export const getAuthStatus = async (): Promise<AuthStatus> => {
  try {
    const res = await fetch('/auth/status', {
      credentials: 'include'
    });
    if (!res.ok) {
      throw new Error('Failed to get auth status');
    }
    return await res.json();
  } catch (error) {
    console.error('Auth status error:', error);
    return { authenticated: false };
  }
};

export const getDiscordAvatarUrl = (userId: string, avatarHash: string) => {
  if (!avatarHash) {
    return `https://cdn.discordapp.com/embed/avatars/${parseInt(userId) % 5}.png`;
  }
  return `https://cdn.discordapp.com/avatars/${userId}/${avatarHash}.png`;
};
