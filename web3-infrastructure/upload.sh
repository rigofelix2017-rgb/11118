#!/bin/bash

# Web3 Infrastructure with VOID Intro System
# Upload script for GitHub repository

echo "🚀 Uploading to GitHub: rigofelix2017-rgb/lame"
echo ""

# Navigate to directory
cd "$(dirname "$0")"

# Initialize git if not already initialized
if [ ! -d .git ]; then
    echo "📦 Initializing git repository..."
    git init
fi

# Add all files
echo "📁 Adding files..."
git add .

# Commit
echo "💾 Committing..."
git commit -m "Initial commit: Web3 infrastructure with VOID intro system

Includes:
- Beta notice & epilepsy warning modals
- VOID splash screen with 3-stage intro
- Interactive consciousness gathering puzzle minigame
- WebSocket infrastructure with auto-reconnect
- Coinbase wallet authentication
- Global & proximity chat
- Session management
- NO game engine bloat

18 files total, ~3MB bundle size"

# Add remote
echo "🔗 Adding remote..."
git remote remove origin 2>/dev/null
git remote add origin https://github.com/rigofelix2017-rgb/lame.git

# Set main branch
echo "🌿 Setting main branch..."
git branch -M main

# Push
echo "⬆️  Pushing to GitHub..."
git push -u origin main --force

echo ""
echo "✅ Upload complete!"
echo "🔗 View at: https://github.com/rigofelix2017-rgb/lame"
