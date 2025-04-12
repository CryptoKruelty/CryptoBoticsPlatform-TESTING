#!/usr/bin/env node
/**
 * Cross-platform script to start the CryptoBotics application
 * Handles environment setup and database connection properly on both Windows and Unix systems
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';
import { createInterface } from 'readline';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Set environment for development
process.env.NODE_ENV = 'development';

// Path to the environment file
const envPath = resolve(__dirname, '.env');

async function setupEnvironment() {
  console.log("=== CryptoBotics Platform Startup ===");

  // Check if .env file exists
  if (!fs.existsSync(envPath)) {
    console.log("No .env file found. Let's create one with essential configuration.");
    
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const question = (query) => new Promise(resolve => rl.question(query, resolve));
    
    try {
      // Database setup
      console.log("\n=== Database Configuration ===");
      const dbUser = await question("Database Username (default: postgres): ") || "postgres";
      const dbPass = await question("Database Password: ");
      const dbHost = await question("Database Host (default: localhost): ") || "localhost";
      const dbPort = await question("Database Port (default: 5432): ") || "5432";
      const dbName = await question("Database Name (default: cryptobotics): ") || "cryptobotics";
      
      // Discord setup
      console.log("\n=== Discord Configuration ===");
      console.log("You need Discord OAuth credentials for authentication to work.");
      console.log("Get them from https://discord.com/developers/applications");
      const discordId = await question("Discord Client ID: ") || "1345970311979335722";
      const discordSecret = await question("Discord Client Secret: ") || "WFBZa2IpFqb3gG9GWR0Mgu4xp6xjGPi4";
      
      // Security
      console.log("\n=== Security Configuration ===");
      const encryptionKey = await question("Encryption Key (or leave blank to generate one): ") || 
        `cryptobotics-${Math.random().toString(36).substring(2)}-${Math.random().toString(36).substring(2)}`;
      
      // Create the .env file
      const envContent = `# Database Configuration
DATABASE_URL=postgresql://${dbUser}:${dbPass}@${dbHost}:${dbPort}/${dbName}

# Server Configuration
SERVER_HOST=localhost
PORT=5000

# Discord Configuration
DISCORD_CLIENT_ID=${discordId}
DISCORD_CLIENT_SECRET=${discordSecret}

# Security
ENCRYPTION_KEY=${encryptionKey}
`;
      
      fs.writeFileSync(envPath, envContent);
      console.log("\n.env file created successfully!");
      
      rl.close();
    } catch (error) {
      console.error("Error during setup:", error);
      process.exit(1);
    }
  } else {
    // Load existing environment variables
    console.log("Loading environment from existing .env file...");
    
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        const value = valueParts.join('=').trim();
        if (key && value) {
          // Remove quotes if present
          process.env[key] = value.replace(/^["'](.*)["']$/, '$1');
        }
      }
    });
  }
  
  // Verify DATABASE_URL format
  if (process.env.DATABASE_URL) {
    const dbUrlMatch = process.env.DATABASE_URL.match(/postgresql:\/\/([^:]+):([^@]+)\/([^\s]+)/);
    
    if (dbUrlMatch) {
      // URL is missing hostname
      const [fullMatch, username, password, database] = dbUrlMatch;
      const correctedUrl = `postgresql://${username}:${password}@localhost:5432/${database}`;
      
      console.log("Fixing DATABASE_URL: Missing hostname detected");
      console.log(`Setting correct format: postgresql://${username}:****@localhost:5432/${database}`);
      
      process.env.DATABASE_URL = correctedUrl;
      
      // Also update the .env file for future use
      let envContent = fs.readFileSync(envPath, 'utf-8');
      envContent = envContent.replace(/DATABASE_URL=.*/, `DATABASE_URL=${correctedUrl}`);
      fs.writeFileSync(envPath, envContent);
    }
  }
  
  // Set default encryption key if not present
  if (!process.env.ENCRYPTION_KEY) {
    const defaultKey = `dev-key-${Math.random().toString(36).substring(2)}`;
    process.env.ENCRYPTION_KEY = defaultKey;
    console.log("Setting default ENCRYPTION_KEY for development");
    
    // Also update the .env file
    let envContent = fs.readFileSync(envPath, 'utf-8');
    if (envContent.includes('ENCRYPTION_KEY=')) {
      envContent = envContent.replace(/ENCRYPTION_KEY=.*/, `ENCRYPTION_KEY=${defaultKey}`);
    } else {
      envContent += `\nENCRYPTION_KEY=${defaultKey}\n`;
    }
    fs.writeFileSync(envPath, envContent);
  }
}

async function startServer() {
  console.log("\n=== Starting CryptoBotics Platform ===");
  console.log("Environment: DEVELOPMENT");
  console.log("Frontend + Backend will be available at: http://localhost:5000");
  console.log("Ctrl+C to stop the server");
  console.log("===================================\n");
  
  // Start the server using tsx
  const serverProcess = spawn('npx', ['tsx', 'server/index.ts'], {
    env: process.env,
    stdio: 'inherit',
    shell: true
  });
  
  serverProcess.on('error', (error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
  
  process.on('SIGINT', () => {
    console.log('\nGracefully shutting down...');
    serverProcess.kill('SIGINT');
    process.exit(0);
  });
}

// Run everything
async function main() {
  try {
    await setupEnvironment();
    await startServer();
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

main();