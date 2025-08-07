#!/bin/bash

# Deployment script for the quiz application
set -e

echo "🚀 Starting deployment process..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    print_warning ".env file not found. Make sure to create one with your environment variables."
    print_warning "The application may not work properly without proper environment configuration."
fi

# Build and start the application
print_status "Building Docker image..."
docker-compose build --no-cache

print_status "Starting the application..."
docker-compose up -d

# Wait for the application to start
print_status "Waiting for application to start..."
sleep 10

# Check if the application is healthy
print_status "Checking application health..."
if curl -f http://localhost:5000/api/health > /dev/null 2>&1; then
    print_status "✅ Application is running successfully!"
    print_status "🌐 Access your application at: http://localhost:5000"
    print_status "🏥 Health check endpoint: http://localhost:5000/api/health"
else
    print_error "❌ Application health check failed. Check the logs:"
    docker-compose logs app
    exit 1
fi

# Show running containers
print_status "Running containers:"
docker-compose ps

print_status "🎉 Deployment completed successfully!"
print_status ""
print_status "Useful commands:"
print_status "  View logs: docker-compose logs -f app"
print_status "  Stop app:  docker-compose down"
print_status "  Restart:   docker-compose restart"
print_status "  Rebuild:   docker-compose up --build -d"
