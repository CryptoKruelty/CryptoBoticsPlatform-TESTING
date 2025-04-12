# CryptoBotics

A SaaS platform that allows users to create and manage Discord bots displaying real-time DeFi metrics with Discord OAuth authentication and Stripe subscription management.

## Features

- Discord bot creation and management for crypto metrics tracking
- Real-time blockchain data monitoring
- Subscription-based service with Stripe integration
- Three main bot types with different capabilities:
  - Standard Bots (Price, Supply, Balance trackers, etc.)
  - Alert Bots (Whale and Buy transaction alerts)
  - Custom RPC Bots (Advanced smart contract interaction)

## Required Environment Variables

The following environment variables are required to run the application:

```
# Server Configuration
SERVER_HOST=localhost
PORT=5000

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/cryptobotics

# Discord API Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
VITE_STRIPE_PUBLIC_KEY=your_stripe_public_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# Security
SESSION_SECRET=your_session_secret_key
ENCRYPTION_KEY=your_encryption_key_for_bot_tokens
```

## Setup and Installation

### Prerequisites

- Node.js 16+ and npm
- PostgreSQL database

### Setup the Database

1. Create a PostgreSQL database:
   ```
   createdb cryptobotics
   ```

2. Push the database schema:
   ```
   npm run db:push
   ```

### Install Dependencies

```
npm install
```

## Running the Application

### Unix/Linux/Mac

1. Create a `.env` file with the required environment variables (see above)
2. Run the development server:
   ```
   npm run dev
   ```

### Windows

We've created several batch files to make running on Windows easier:

1. Set up environment variables:
   ```
   create-env-windows.bat
   ```
   Follow the prompts to set up your environment variables.

2. Run the application:
   ```
   setup-and-run-windows.bat
   ```
   or for a simpler start (after environment variables are set):
   ```
   run-dev-windows.bat
   ```

## Architecture

- Frontend: React, TailwindCSS, shadcn components
- Backend: Express.js, Node.js
- Database: PostgreSQL with Drizzle ORM
- Authentication: Discord OAuth
- Payments: Stripe subscription management
- Blockchain Interaction: Custom RPC services

## Development

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run start` - Start the production server
- `npm run db:push` - Push database schema changes

## Security Notes

- The ENCRYPTION_KEY environment variable is used to encrypt Discord bot tokens
- Never store unencrypted bot tokens in the database
- Stripe webhooks should be configured with proper signature verification

## License

MIT