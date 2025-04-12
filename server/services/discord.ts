import { storage } from "../storage";

/**
 * Discord OAuth2 Token Response from authorization grant
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

/**
 * Discord User from the users/@me endpoint
 */
interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  email: string;
  global_name?: string;
  flags?: number;
  banner?: string;
  accent_color?: number;
  locale?: string;
  verified?: boolean;
  mfa_enabled?: boolean;
  premium_type?: number;
}

/**
 * Discord Guild (Server)
 */
interface DiscordGuild {
  id: string;
  name: string;
  icon: string | null;
  owner: boolean;
  permissions: string;
  features: string[];
}

/**
 * Singleton service that handles all Discord OAuth2 authentication flows
 */
class DiscordAuthService {
  private clientId: string;
  private clientSecret: string;
  private apiVersion = 'v10'; // Using v10 as it's current in the docs
  private discordApiUrl = 'https://discord.com/api';
  
  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || "";
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || "";
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("Discord OAuth credentials not set. Authentication will not work properly.");
    }
  }
  
  /**
   * Builds the Discord OAuth2 authorization URL
   * @param redirectUri - Where to redirect after auth
   * @param state - Random string to prevent CSRF attacks
   * @param prompt - Controls how the authorization flow handles existing authorizations
   * @returns The full URL to redirect the user to
   */
  getAuthorizationUrl(redirectUri: string, state: string, prompt: 'consent' | 'none' = 'consent'): string {
    // Ensure redirect URI has protocol
    const fullRedirectUri = redirectUri.startsWith('http') 
      ? redirectUri 
      : `http://${redirectUri}`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: fullRedirectUri,
      response_type: "code",
      scope: "identify email guilds", // Scopes needed for our app
      state,
      prompt
    });
    
    return `https://discord.com/oauth2/authorize?${params.toString()}`;
  }
  
  /**
   * Exchanges an authorization code for an access token
   * @param code - The code from the authorization redirect
   * @param redirectUri - Must match the original redirect URI
   * @returns Token response with access_token, refresh_token, etc.
   */
  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    // Ensure redirect URI has protocol
    const fullRedirectUri = redirectUri.startsWith('http') 
      ? redirectUri 
      : `http://${redirectUri}`;
      
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: fullRedirectUri
    });
    
    try {
      const response = await fetch(`${this.discordApiUrl}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        console.error("Discord code exchange error:", errorData);
        throw new Error(`Discord token exchange failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Discord token exchange error:", error);
      throw new Error(`Discord token exchange failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Refreshes an expired access token
   * @param refreshToken - The refresh token from the original grant
   * @returns New token response
   */
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });
    
    try {
      const response = await fetch(`${this.discordApiUrl}/oauth2/token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        console.error("Discord token refresh error:", errorData);
        throw new Error(`Discord token refresh failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Discord token refresh error:", error);
      throw new Error(`Discord token refresh failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Revokes a token, invalidating the user's session
   * @param token - The access or refresh token
   * @param tokenType - What type of token to revoke
   */
  async revokeToken(token: string, tokenType: 'access_token' | 'refresh_token' = 'access_token'): Promise<void> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      token,
      token_type_hint: tokenType
    });
    
    try {
      const response = await fetch(`${this.discordApiUrl}/oauth2/token/revoke`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: params
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Discord token revocation error:", errorText);
      }
    } catch (error) {
      console.error("Discord token revocation error:", error);
    }
  }
  
  /**
   * Gets the user's profile from Discord
   * @param accessToken - Valid access token
   * @returns User profile data
   */
  async getUserInfo(accessToken: string): Promise<DiscordUser> {
    try {
      const response = await fetch(`${this.discordApiUrl}/${this.apiVersion}/users/@me`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        console.error("Discord user info error:", errorData);
        throw new Error(`Discord user info fetch failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Discord user info error:", error);
      throw new Error(`Discord user info fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Gets the user's Discord servers (guilds)
   * @param accessToken - Valid access token
   * @returns Array of guilds
   */
  async getUserGuilds(accessToken: string): Promise<DiscordGuild[]> {
    try {
      const response = await fetch(`${this.discordApiUrl}/${this.apiVersion}/users/@me/guilds`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        console.error("Discord guilds error:", errorData);
        throw new Error(`Discord guilds fetch failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Discord guilds error:", error);
      throw new Error(`Discord guilds fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Gets the channels in a guild
   * @param accessToken - Valid access token
   * @param guildId - The Discord server ID
   * @returns Array of channels
   */
  async getGuildChannels(accessToken: string, guildId: string): Promise<any[]> {
    try {
      const response = await fetch(`${this.discordApiUrl}/${this.apiVersion}/guilds/${guildId}/channels`, {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null) || await response.text();
        console.error("Discord channels error:", errorData);
        throw new Error(`Discord channels fetch failed: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error("Discord channels error:", error);
      throw new Error(`Discord channels fetch failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  
  /**
   * Ensures the user's token is valid, refreshing if needed
   * @param userId - User ID in our database
   * @returns Valid access token
   */
  async ensureValidToken(userId: number): Promise<string> {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error("User not found");
    }
    
    if (!user.accessToken) {
      throw new Error("No access token found for user");
    }
    
    // Check if token needs refresh
    if (user.tokenExpires && new Date() > user.tokenExpires) {
      if (!user.refreshToken) {
        throw new Error("No refresh token found for user");
      }
      
      try {
        console.log(`Refreshing token for user ${userId}`);
        const tokenData = await this.refreshToken(user.refreshToken);
        await storage.updateUser(userId, {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          tokenExpires: new Date(Date.now() + tokenData.expires_in * 1000)
        });
        
        return tokenData.access_token;
      } catch (error) {
        console.error("Token refresh error:", error);
        throw new Error("Failed to refresh token");
      }
    }
    
    return user.accessToken;
  }
  
  /**
   * Signs the user out from Discord by revoking their tokens
   * @param userId - User ID in our database
   */
  async signOutUser(userId: number): Promise<void> {
    const user = await storage.getUser(userId);
    if (!user || !user.accessToken) {
      return;
    }
    
    try {
      // Revoke access token
      if (user.accessToken) {
        await this.revokeToken(user.accessToken, 'access_token');
      }
      
      // Revoke refresh token
      if (user.refreshToken) {
        await this.revokeToken(user.refreshToken, 'refresh_token');
      }
      
      // Clear tokens from database
      await storage.updateUser(userId, {
        accessToken: null,
        refreshToken: null,
        tokenExpires: null
      });
    } catch (error) {
      console.error("Error signing out user:", error);
    }
  }
}

export const discordAuthService = new DiscordAuthService();
