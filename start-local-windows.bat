@echo off
SETLOCAL EnableDelayedExpansion

ECHO ======================================
ECHO CryptoBotics Platform - Local Startup
ECHO ======================================

:: Check if .env file exists
IF NOT EXIST .env (
  ECHO .env file not found. Creating template...
  
  ECHO # Database Configuration > .env
  ECHO DATABASE_URL="postgresql://botics:Ariabay1121!@localhost:5432/cryptobotics" >> .env
  ECHO # Discord Configuration >> .env
  ECHO DISCORD_CLIENT_ID=1345970311979335722 >> .env
  ECHO DISCORD_CLIENT_SECRET=WFBZa2IpFqb3gG9GWR0Mgu4xp6xjGPi4 >> .env
  ECHO # Add other configurations as needed >> .env
  ECHO SERVER_HOST=localhost >> .env
  ECHO # Security >> .env
  ECHO ENCRYPTION_KEY=local-development-encryption-key-!123 >> .env
  
  ECHO Created .env template. Please update with actual values if needed.
)

:: Load .env file
FOR /F "usebackq tokens=* eol=#" %%A IN (".env") DO (
  SET LINE=%%A
  IF NOT "!LINE:~0,1!"=="#" (
    :: Remove quotes if present
    SET LINE=!LINE:"=!
    SET %%A
  )
)

:: Set environment variables for development
SET NODE_ENV=development

ECHO Environment variables loaded.
ECHO ======================================
ECHO Starting CryptoBotics Platform...
ECHO Frontend + Backend will run on http://localhost:5000
ECHO ======================================

npx tsx server/index.ts

PAUSE