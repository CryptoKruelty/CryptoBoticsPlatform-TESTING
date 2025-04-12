# Discord OAuth Setup Instructions

To fix the "Invalid OAuth2 redirect_uri" error, you need to update your Discord application settings:

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Select your CryptoBotics application
3. Navigate to the "OAuth2" section in the left sidebar
4. In the "Redirects" section, add the following URL (or update existing): 
   ```
   http://localhost/auth/discord/callback
   ```
5. Make sure to save your changes

## Troubleshooting Tips

1. The URL must match EXACTLY - including protocol, domain, port, and path
2. If you're using a different domain or port in development, you'll need to add multiple redirect URLs
3. Discord is very strict about URL matching - even a trailing slash or different port number will cause errors
4. You may need to wait a few minutes for Discord to update their systems after changing the URLs
5. For local development, you can add multiple redirect URLs, including http://localhost/auth/discord/callback AND http://localhost:5000/auth/discord/callback to cover different environments

## Discord OAuth Flow

Our application uses the following OAuth flow:
1. User clicks "Login with Discord" 
2. Our app generates a random state parameter and redirects to the Discord authorization page
3. User authorizes our application on Discord
4. Discord redirects back to our callback URL with a code and the state parameter
5. Our app verifies the state parameter and exchanges the code for an access token
6. We use the access token to fetch the user's Discord information and create/login the user

If you need to change the redirect URL in the code, update both occurrences in server/routes.ts.