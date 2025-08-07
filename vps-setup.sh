#!/bin/bash

# VPS Setup Script for Quiz Application
# This script automates the initial VPS setup process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_header() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   print_warning "This script should not be run as root for security reasons."
   print_warning "Please run as a regular user with sudo privileges."
   exit 1
fi

print_header "🚀 Starting VPS Setup for Quiz Application"

# Update system
print_status "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install essential packages
print_status "Installing essential packages..."
sudo apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# Install Docker
print_status "Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    rm get-docker.sh
    print_status "✅ Docker installed successfully"
else
    print_status "Docker is already installed"
fi

# Install Docker Compose
print_status "Installing Docker Compose..."
if ! command -v docker-compose &> /dev/null; then
    sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
    print_status "✅ Docker Compose installed successfully"
else
    print_status "Docker Compose is already installed"
fi

# Install Nginx
print_status "Installing Nginx..."
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx
    print_status "✅ Nginx installed successfully"
else
    print_status "Nginx is already installed"
fi

# Install Certbot for SSL
print_status "Installing Certbot for SSL certificates..."
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
    print_status "✅ Certbot installed successfully"
else
    print_status "Certbot is already installed"
fi

# Setup firewall
print_status "Configuring UFW firewall..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5000/tcp  # For direct app access during setup
sudo ufw --force enable
print_status "✅ Firewall configured successfully"

# Create application directory
print_status "Creating application directory..."
sudo mkdir -p /opt/quiz-app
sudo chown -R $USER:$USER /opt/quiz-app

# Install Node.js (for local development/debugging)
print_status "Installing Node.js..."
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    print_status "✅ Node.js installed successfully"
else
    print_status "Node.js is already installed"
fi

# Install additional monitoring tools
print_status "Installing monitoring tools..."
sudo apt install -y htop iotop nethogs fail2ban logrotate

# Configure fail2ban
print_status "Configuring fail2ban..."
sudo systemctl enable fail2ban
sudo systemctl start fail2ban

# Create backup directory
print_status "Creating backup directory..."
sudo mkdir -p /opt/backups/quiz-app
sudo chown -R $USER:$USER /opt/backups

# Create logs directory
print_status "Creating logs directory..."
mkdir -p /opt/quiz-app/logs

print_header "🎉 VPS Setup completed successfully!"
print_status ""
print_status "Next steps:"
print_status "1. Clone your application repository to /opt/quiz-app"
print_status "2. Configure your .env file with production settings"
print_status "3. Run the deployment script"
print_status "4. Configure your domain DNS to point to this server"
print_status "5. Setup SSL certificate with certbot"
print_status ""
print_status "Installed versions:"
docker --version
docker-compose --version
nginx -v
node --version
npm --version
print_status ""
print_warning "⚠️  You may need to log out and log back in for Docker group changes to take effect"
print_status "Or run: newgrp docker"
