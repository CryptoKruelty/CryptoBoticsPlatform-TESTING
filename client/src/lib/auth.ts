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

/**
 * Initiates the Discord OAuth2 login flow
 * Uses state parameter to prevent CSRF attacks
 */
export const loginWithDiscord = () => {
  try {
    // Generate a random state for CSRF protection
    const state = crypto.randomUUID();
    
    // Store in sessionStorage for client-side validation if needed
    sessionStorage.setItem('discord_oauth_state', state);
    
    // Get the base URL based on environment
    const baseUrl = window.location.origin;
    
    // Create complete authorization URL
    const authUrl = `${baseUrl}/auth/discord?state=${state}`;
    
    console.log('Initiating Discord authentication flow');
    
    // Redirect to Discord authorization page
    window.location.href = authUrl;
  } catch (error) {
    console.error('Failed to initiate Discord login:', error);
    alert('Authentication error. Please try again.');
  }
};

/**
 * Logs the user out by calling the logout endpoint
 * Revokes Discord tokens on the server and clears the session
 */
export const logout = async () => {
  try {
    console.log('Logging out user');
    
    // Call logout endpoint to handle token revocation and session clearing
    await apiRequest('GET', '/auth/logout', undefined);
    
    // Clear any client-side state
    sessionStorage.removeItem('discord_oauth_state');
    
    // Redirect to homepage
    window.location.href = '/';
  } catch (error) {
    console.error('Logout error:', error);
    
    // Always redirect to homepage even if the logout failed on server
    window.location.href = '/';
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
