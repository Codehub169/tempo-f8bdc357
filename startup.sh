#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

echo "Starting Wholesale Shop Management Application setup..."

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Navigate to the server directory
echo "Setting up backend server..."
cd "$SCRIPT_DIR/server"

# Install server dependencies
echo "Installing server dependencies (npm install)..."
npm install

# Initialize the database (creates tables if they don't exist)
echo "Initializing database (npm run init-db)..."
npm run init-db

# Navigate to the client directory
echo "Setting up frontend client..."
cd "$SCRIPT_DIR/client"

# Install client dependencies
echo "Installing client dependencies (npm install)..."
npm install

# Build the client application
echo "Building client application (npm run build)..."
npm run build

# Navigate back to the server directory to start the server
cd "$SCRIPT_DIR/server"

echo "Starting the application server on port 9000 (npm start)..."
# The server.js is configured to serve the client/build directory
# and listen on port 9000.
npm start
