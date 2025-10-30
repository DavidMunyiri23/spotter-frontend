#!/bin/bash
echo "Starting FMCSA HOS Tracker Frontend..."
echo

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing npm dependencies..."
    npm install
    echo
fi

# Start React development server
echo "Starting React development server..."
echo "Frontend will be available at: http://localhost:3000"
echo
npm start