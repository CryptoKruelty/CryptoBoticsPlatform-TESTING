@echo off
SETLOCAL EnableDelayedExpansion
ECHO Creating .env file for CryptoBotics...

REM Get database info
SET /P DB_USER=Enter database user (default: postgres): 
IF "%DB_USER%"=="" SET DB_USER=postgres

SET /P DB_PASS=Enter database password: 
SET /P DB_HOST=Enter database host (default: localhost): 
IF "%DB_HOST%"=="" SET DB_HOST=localhost

SET /P DB_PORT=Enter database port (default: 5432): 
IF "%DB_PORT%"=="" SET DB_PORT=5432

SET /P DB_NAME=Enter database name (default: cryptobotics): 
IF "%DB_NAME%"=="" SET DB_NAME=cryptobotics

REM Get Discord credentials
SET /P DISCORD_ID=Enter Discord Client ID: 
SET /P DISCORD_SECRET=Enter Discord Client Secret: 

REM Get Stripe credentials
SET /P STRIPE_SECRET=Enter Stripe Secret Key: 
SET /P STRIPE_PUBLIC=Enter Stripe Public Key: 
SET /P STRIPE_WEBHOOK=Enter Stripe Webhook Secret (optional): 

REM Get encryption key
SET /P ENCRYPTION=Enter Encryption Key for bot tokens (or leave blank to generate one): 
IF "%ENCRYPTION%"=="" SET ENCRYPTION=cryptobotics-%RANDOM%-%RANDOM%

REM Generate session secret
SET SESSION=session-secret-%RANDOM%-%RANDOM%

REM Create .env file
ECHO # Server Configuration > .env
ECHO SERVER_HOST=localhost >> .env
ECHO PORT=5000 >> .env
ECHO. >> .env
ECHO # Database Configuration >> .env
ECHO DATABASE_URL=postgresql://%DB_USER%:%DB_PASS%@%DB_HOST%:%DB_PORT%/%DB_NAME% >> .env
ECHO. >> .env
ECHO # Discord API Configuration >> .env
ECHO DISCORD_CLIENT_ID=%DISCORD_ID% >> .env
ECHO DISCORD_CLIENT_SECRET=%DISCORD_SECRET% >> .env
ECHO. >> .env
ECHO # Stripe Configuration >> .env
ECHO STRIPE_SECRET_KEY=%STRIPE_SECRET% >> .env
ECHO VITE_STRIPE_PUBLIC_KEY=%STRIPE_PUBLIC% >> .env
ECHO STRIPE_WEBHOOK_SECRET=%STRIPE_WEBHOOK% >> .env
ECHO. >> .env
ECHO # Security >> .env
ECHO SESSION_SECRET=%SESSION% >> .env
ECHO ENCRYPTION_KEY=%ENCRYPTION% >> .env

ECHO .env file created successfully!
ECHO You can now run the application using setup-and-run-windows.bat