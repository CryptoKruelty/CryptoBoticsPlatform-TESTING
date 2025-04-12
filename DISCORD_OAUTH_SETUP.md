# Discord OAuth2 Integration Guide for CryptoBotics

This guide explains how to set up and configure Discord OAuth2 authentication for the CryptoBotics platform.

## Prerequisites

1. A Discord account
2. Access to the [Discord Developer Portal](https://discord.com/developers/applications)

## Step 1: Create a Discord Application

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" in the top right corner
3. Enter a name for your application (e.g., "CryptoBotics")
4. Agree to Discord's Terms of Service and click "Create"

## Step 2: Configure OAuth2 Settings

1. In your application dashboard, click on the "OAuth2" tab in the left sidebar
2. Under "Redirects", click "Add Redirect" and add the following URL:
   - For local development: `http://localhost:5000/auth/discord/callback`
   - For production: `https://your-domain.com/auth/discord/callback`
3. Save changes

## Step 3: Get OAuth2 Credentials

1. In the OAuth2 settings, note your "Client ID" (a public identifier for your app)
2. Click "Reset Secret" to generate a new "Client Secret" (keep this secure)
3. Copy both values as you'll need them for environment configuration

## Step 4: Set Environment Variables

Add the following variables to your `.env` file:

```
# Discord OAuth2 Credentials
DISCORD_CLIENT_ID=your_client_id_here
DISCORD_CLIENT_SECRET=your_client_secret_here
```

## Step 5: Test the Integration

1. Start your application with `npm run dev` or use `node run-app.js`
2. Navigate to the login page
3. Click "Login with Discord"
4. You should be redirected to Discord's authorization page
5. After approving, you should be redirected back to your application and logged in

## OAuth2 Flow Explanation

CryptoBotics uses the [Authorization Code Grant](https://discord.com/developers/docs/topics/oauth2#authorization-code-grant) flow:

1. User clicks "Login with Discord"
2. CryptoBotics generates a secure random "state" parameter to prevent CSRF attacks
3. User is redirected to Discord's authorization page with required scopes (`identify email guilds`)
4. User approves the authorization
5. Discord redirects back to CryptoBotics with an authorization code
6. CryptoBotics server exchanges the code for an access token
7. CryptoBotics uses the token to fetch the user's Discord profile
8. A session is created and the user is logged in

## Required Scopes

The application requests the following scopes:

- `identify`: Allows access to user's Discord ID, username, avatar, etc.
- `email`: Allows access to user's email address
- `guilds`: Allows access to list of Discord servers the user is in

## Troubleshooting

### Common Issues

1. **Invalid Redirect URI**: Make sure the redirect URI in your Discord application settings exactly matches the one used in your application.

2. **Authentication Failed**: Check if your client ID and secret are correctly set in the environment variables.

3. **CORS Errors**: For development, make sure your frontend and backend are running on the same port (5000).

4. **Token Refresh Failures**: Discord tokens expire after a week. If users experience logout issues, check the token refresh functionality.

### Support

If you encounter issues with Discord OAuth integration, check the [Discord Developer Documentation](https://discord.com/developers/docs/topics/oauth2) or reach out to the CryptoBotics support team.