#!/usr/bin/env bash
set -euo pipefail

APP_DIR="/var/www/nextjs-fintech"

if [ ! -d "$APP_DIR" ]; then
  echo "Directory $APP_DIR not found. Clone the repo there first."
  exit 1
fi

cd "$APP_DIR"

if [ ! -f ".env.production" ]; then
  echo ".env.production is missing. Create it before deployment."
  exit 1
fi

echo "Pulling latest code..."
git pull

echo "Building and restarting containers..."
docker compose down
docker compose up -d --build

echo "Deployment finished. Current status:"
docker compose ps
