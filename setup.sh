#!/bin/bash

# JITPhone Server Setup Script
# This script installs and starts the JITPhone server

echo "🚀 JITPhone Server Setup"
echo "========================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ and try again."
    echo "Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node --version)"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Create logs directory
mkdir -p logs

# Get local IP address for iOS connection
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    LOCAL_IP=$(hostname -I | awk '{print $1}')
else
    LOCAL_IP="localhost"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📱 iOS Shortcuts Setup:"
echo "1. On your iOS device, open the Shortcuts app"
echo "2. Import the shortcut from: examples/shortcut-import.json"
echo "3. When prompted, enter your server IP: http://$LOCAL_IP:3000"
echo ""
echo "🖥️  Local testing:"
echo "• Health check: http://localhost:3000/health"
echo "• JIT info: http://localhost:3000/jit/info"
echo ""
echo "🔧 Available commands:"
echo "• npm start     - Start the server"
echo "• npm run dev   - Start with auto-restart"
echo "• npm test      - Run tests"
echo ""
echo "Starting server now..."
echo ""

# Start the server
npm start 