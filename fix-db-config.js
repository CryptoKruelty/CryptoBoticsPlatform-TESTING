#!/usr/bin/env node
/**
 * Script to check and correct database configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.join(__dirname, '.env');

console.log('Checking database configuration...');

// Check if .env file exists
if (fs.existsSync(envPath)) {
  let envContent = fs.readFileSync(envPath, 'utf-8');
  
  // Check if DATABASE_URL is in correct format
  const dbUrlMatch = envContent.match(/DATABASE_URL=postgresql:\/\/([^:]+):([^@]+)\/([^\s]+)/);
  
  if (dbUrlMatch) {
    // Found problematic DATABASE_URL without hostname
    const [fullMatch, username, password, database] = dbUrlMatch;
    
    console.log('Found invalid DATABASE_URL without hostname');
    
    // Fix the URL by adding localhost as hostname
    const correctedUrl = `DATABASE_URL=postgresql://${username}:${password}@localhost:5432/${database}`;
    
    // Replace in the content
    envContent = envContent.replace(fullMatch, correctedUrl);
    
    // Write the updated content back to the file
    fs.writeFileSync(envPath, envContent);
    
    console.log('Fixed DATABASE_URL with localhost:5432 as hostname');
    console.log(`New value: postgresql://${username}:****@localhost:5432/${database}`);
  } else {
    // Check if DATABASE_URL has correct format
    const correctDbUrlMatch = envContent.match(/DATABASE_URL=postgresql:\/\/([^:]+):([^@]+)@([^\/]+)\/([^\s]+)/);
    
    if (correctDbUrlMatch) {
      console.log('DATABASE_URL format is correct, has hostname specified');
    } else {
      // If no DATABASE_URL found or in completely different format, suggest manually setting it
      console.log('Could not find DATABASE_URL or format is unexpected.');
      console.log('Please manually set DATABASE_URL in .env file with format:');
      console.log('DATABASE_URL=postgresql://username:password@localhost:5432/database_name');
    }
  }
} else {
  console.log('.env file not found. Creating one with template database configuration.');
  
  const templateEnv = `# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/cryptobotics

# Add your other environment variables here
`;
  
  fs.writeFileSync(envPath, templateEnv);
  
  console.log('.env file created. Please update with your actual database credentials.');
}

console.log('\nDatabase configuration check complete.');
console.log('To ensure your application works properly, make sure:');
console.log('1. PostgreSQL is installed and running on your local machine');
console.log('2. The database specified in the URL exists');
console.log('3. The username and password in the URL are correct');
console.log('4. The port is correct (default PostgreSQL port is 5432)');