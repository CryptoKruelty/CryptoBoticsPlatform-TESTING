#!/usr/bin/env node
/**
 * Cross-platform script to start the application in development mode.
 * Works on both Windows and Ubuntu without environment variable syntax issues.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import fs from 'fs';

// Set up NODE_ENV environment variable
process.env.NODE_ENV = 'development';

// Get the directory of the current script
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file if it exists
const envPath = resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('Loading environment variables from .env file...');
  const envContent = fs.readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmedLine = line.trim();
    if (trimmedLine && !trimmedLine.startsWith('#')) {
      const [key, ...valueParts] = trimmedLine.split('=');
      const value = valueParts.join('=');
      if (key && value) {
        process.env[key] = value;
      }
    }
  });
  console.log('Environment variables loaded successfully');
} else {
  console.log('No .env file found. Using default environment variables.');
}

// Start the server
console.log('Starting server in development mode...');
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
  console.log('Stopping server...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});