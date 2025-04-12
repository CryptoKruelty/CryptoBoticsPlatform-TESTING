#!/bin/bash

echo "======================================"
echo "CryptoBotics Platform - Local Startup"
echo "======================================"

# Check if .env file exists
if [ ! -f .env ]; then
  echo ".env file not found. Creating template..."
  
  echo "# Database Configuration" > .env
  echo "DATABASE_URL=\"postgresql://botics:Ariabay1121!@localhost:5432/cryptobotics\"" >> .env
  echo "# Discord Configuration" >> .env
  echo "DISCORD_CLIENT_ID=1345970311979335722" >> .env
  echo "DISCORD_CLIENT_SECRET=WFBZa2IpFqb3gG9GWR0Mgu4xp6xjGPi4" >> .env
  echo "# Add other configurations as needed" >> .env
  echo "SERVER_HOST=localhost" >> .env
  echo "# Security" >> .env
  echo "ENCRYPTION_KEY=local-development-encryption-key-!123" >> .env
  
  echo "Created .env template. Please update with actual values if needed."
fi

# Load .env file
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

# Set environment variables for development
export NODE_ENV=development

echo "Environment variables loaded."
echo "======================================"
echo "Starting CryptoBotics Platform..."
echo "Frontend + Backend will run on http://localhost:5000"
echo "======================================"

npx tsx server/index.ts