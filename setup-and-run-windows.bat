@echo off
SETLOCAL EnableDelayedExpansion
ECHO Setting up environment for CryptoBotics...

REM Set environment variables (replace these with your actual values)
SET DATABASE_URL=postgresql://postgres:password@localhost:5432/cryptobotics
SET SERVER_HOST=localhost
SET PORT=5000

REM Discord and Stripe credentials (replace with your actual values)
SET DISCORD_CLIENT_ID=your_discord_client_id
SET DISCORD_CLIENT_SECRET=your_discord_client_secret
SET STRIPE_SECRET_KEY=your_stripe_secret_key
SET VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
SET STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
SET ENCRYPTION_KEY=your_encryption_key_for_bot_tokens
SET SESSION_SECRET=your_session_secret_key

ECHO Environment variables set.

REM Check if database schema needs to be pushed
ECHO Would you like to push the database schema? (y/n)
SET /P PUSH_DB=
IF /I "%PUSH_DB%" EQU "y" (
    ECHO Pushing database schema...
    npx drizzle-kit push
)

REM Run the application
ECHO Starting CryptoBotics application...
SET NODE_ENV=development
npx tsx server/index.ts