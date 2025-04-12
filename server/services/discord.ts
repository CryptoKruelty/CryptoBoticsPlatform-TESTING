import { storage } from "../storage";

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
}

interface DiscordUser {
  id: string;
  username: string;
  avatar: string;
  email: string;
}

class DiscordAuthService {
  private clientId: string;
  private clientSecret: string;
  
  constructor() {
    this.clientId = process.env.DISCORD_CLIENT_ID || "";
    this.clientSecret = process.env.DISCORD_CLIENT_SECRET || "";
    
    if (!this.clientId || !this.clientSecret) {
      console.warn("Discord OAuth credentials not set. Authentication will not work properly.");
    }
  }
  
  getAuthorizationUrl(redirectUri: string, state: string): string {
    // Ensure redirect URI has protocol
    const fullRedirectUri = redirectUri.startsWith('http') 
      ? redirectUri 
      : `http://${redirectUri}`;

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: fullRedirectUri,
      response_type: "code",
      scope: "identify email guilds",
      state
    });
    
    return `https://discord.com/api/oauth2/authorize?${params.toString()}`;
  }
  
  async exchangeCode(code: string, redirectUri: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri
    });
    
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord token exchange failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken
    });
    
    const response = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded"
      },
      body: params
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord token refresh failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  async getUserInfo(accessToken: string): Promise<DiscordUser> {
    const response = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord user info fetch failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
  async getUserGuilds(accessToken: string): Promise<any[]> {
    const response = await fetch("https://discord.com/api/users/@me/guilds", {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Discord guilds fetch failed: ${response.status} ${errorText}`);
    }
    
    return response.json();
  }
  
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
}

export const discordAuthService = new DiscordAuthService();
