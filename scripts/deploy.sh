#!/bin/bash

# Set script to exit immediately if a command exits with non-zero status
set -e

echo "Starting deployment process..."

# Step 1: Build only api and web services without their dependencies
echo "Building api and web services..."
docker compose build api web

# Step 2: Run migrations in the api directory
echo "Running database migrations..."
cd "$(pwd)/api" && npm run migration:run
cd ..

# Step 3: Start the api and web services
echo "Starting api and web services..."
docker compose up -d --no-deps api web

echo "Deployment completed successfully!"

