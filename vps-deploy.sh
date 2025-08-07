#!/bin/bash

# VPS Deployment Script for Quiz Application
# This script handles the complete deployment process on a VPS

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="quiz-app"
APP_DIR="/opt/quiz-app"
NGINX_SITE="/etc/nginx/sites-available/$APP_NAME"
BACKUP_DIR="/opt/backups/$APP_NAME"
LOG_FILE="/var/log/$APP_NAME-deploy.log"

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
    echo "$(date): [INFO] $1" >> $LOG_FILE
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
    echo "$(date): [WARNING] $1" >> $LOG_FILE
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    echo "$(date): [ERROR] $1" >> $LOG_FILE
}

print_header() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
    echo "$(date): [DEPLOY] $1" >> $LOG_FILE
}

print_success() {
    echo -e "${PURPLE}[SUCCESS]${NC} $1"
    echo "$(date): [SUCCESS] $1" >> $LOG_FILE
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to wait for service to be ready
wait_for_service() {
    local url=$1
    local max_attempts=30
    local attempt=1
    
    print_status "Waiting for service to be ready at $url..."
    
    while [ $attempt -le $max_attempts ]; do
        if curl -f -s "$url" > /dev/null 2>&1; then
            print_success "Service is ready!"
            return 0
        fi
        
        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    print_error "Service failed to start within expected time"
    return 1
}

# Function to create backup
create_backup() {
    if [ -d "$APP_DIR" ]; then
        print_status "Creating backup..."
        local backup_name="backup_$(date +%Y%m%d_%H%M%S)"
        mkdir -p "$BACKUP_DIR"
        
        # Stop the application before backup
        if systemctl is-active --quiet $APP_NAME; then
            sudo systemctl stop $APP_NAME
        fi
        
        # Create backup
        sudo tar -czf "$BACKUP_DIR/$backup_name.tar.gz" -C /opt $APP_NAME --exclude=node_modules --exclude=dist --exclude=.git
        print_success "Backup created: $backup_name.tar.gz"
        
        # Keep only last 5 backups
        cd "$BACKUP_DIR"
        ls -t *.tar.gz | tail -n +6 | xargs -r rm --
    fi
}

# Function to setup systemd service
setup_systemd_service() {
    print_status "Setting up systemd service..."
    
    sudo tee /etc/systemd/system/$APP_NAME.service > /dev/null <<EOF
[Unit]
Description=Quiz Application
After=docker.service network.target
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$APP_DIR
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
ExecReload=/usr/local/bin/docker-compose restart
TimeoutStartSec=300
TimeoutStopSec=60
User=$USER
Group=$USER

[Install]
WantedBy=multi-user.target
EOF

    sudo systemctl daemon-reload
    sudo systemctl enable $APP_NAME.service
    print_success "Systemd service configured"
}

# Function to setup nginx
setup_nginx() {
    print_status "Setting up Nginx configuration..."
    
    # Check if domain is provided
    if [ -z "$DOMAIN" ]; then
        print_warning "No domain provided. Using default configuration."
        DOMAIN="localhost"
    fi
    
    # Copy nginx configuration
    if [ -f "$APP_DIR/nginx.conf" ]; then
        sudo cp "$APP_DIR/nginx.conf" "$NGINX_SITE"
        
        # Replace domain placeholder
        sudo sed -i "s/your-domain.com/$DOMAIN/g" "$NGINX_SITE"
        
        # Enable site
        sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/
        
        # Remove default site if it exists
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Test nginx configuration
        if sudo nginx -t; then
            sudo systemctl reload nginx
            print_success "Nginx configuration updated"
        else
            print_error "Nginx configuration test failed"
            return 1
        fi
    else
        print_warning "nginx.conf not found, skipping Nginx setup"
    fi
}

# Function to setup SSL certificate
setup_ssl() {
    if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
        print_status "Setting up SSL certificate for $DOMAIN..."
        
        if command_exists certbot; then
            # Get SSL certificate
            sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" --non-interactive --agree-tos --email "$EMAIL" || {
                print_warning "SSL certificate setup failed, continuing without SSL"
            }
        else
            print_warning "Certbot not installed, skipping SSL setup"
        fi
    else
        print_warning "No valid domain provided, skipping SSL setup"
    fi
}

# Function to setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create monitoring script
    cat > "$APP_DIR/monitor.sh" <<'EOF'
#!/bin/bash
APP_URL="http://localhost:5000/api/health"
LOG_FILE="/var/log/quiz-app-monitor.log"
MAX_LOG_SIZE=10485760  # 10MB

# Rotate log if too large
if [ -f "$LOG_FILE" ] && [ $(stat -f%z "$LOG_FILE" 2>/dev/null || stat -c%s "$LOG_FILE" 2>/dev/null || echo 0) -gt $MAX_LOG_SIZE ]; then
    mv "$LOG_FILE" "${LOG_FILE}.old"
fi

if ! curl -f -s "$APP_URL" > /dev/null 2>&1; then
    echo "$(date): Application is down, restarting..." >> "$LOG_FILE"
    systemctl restart quiz-app
    sleep 30
    if curl -f -s "$APP_URL" > /dev/null 2>&1; then
        echo "$(date): Application restarted successfully" >> "$LOG_FILE"
    else
        echo "$(date): Failed to restart application" >> "$LOG_FILE"
    fi
fi
EOF

    chmod +x "$APP_DIR/monitor.sh"
    
    # Setup cron job for monitoring
    (crontab -l 2>/dev/null; echo "*/5 * * * * $APP_DIR/monitor.sh") | crontab -
    
    print_success "Monitoring setup completed"
}

# Function to setup log rotation
setup_log_rotation() {
    print_status "Setting up log rotation..."
    
    sudo tee /etc/logrotate.d/$APP_NAME > /dev/null <<EOF
$APP_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        docker-compose -f $APP_DIR/docker-compose.yml restart app > /dev/null 2>&1 || true
    endscript
}

/var/log/$APP_NAME*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

    print_success "Log rotation configured"
}

# Main deployment function
main() {
    print_header "🚀 Starting VPS deployment for $APP_NAME"
    
    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                DOMAIN="$2"
                shift 2
                ;;
            --email)
                EMAIL="$2"
                shift 2
                ;;
            --skip-backup)
                SKIP_BACKUP=true
                shift
                ;;
            --skip-ssl)
                SKIP_SSL=true
                shift
                ;;
            --help)
                echo "Usage: $0 [OPTIONS]"
                echo "Options:"
                echo "  --domain DOMAIN    Domain name for the application"
                echo "  --email EMAIL      Email for SSL certificate"
                echo "  --skip-backup      Skip backup creation"
                echo "  --skip-ssl         Skip SSL certificate setup"
                echo "  --help             Show this help message"
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                exit 1
                ;;
        esac
    done
    
    # Validate prerequisites
    print_status "Checking prerequisites..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed. Please run vps-setup.sh first."
        exit 1
    fi
    
    if ! command_exists docker-compose; then
        print_error "Docker Compose is not installed. Please run vps-setup.sh first."
        exit 1
    fi
    
    if ! command_exists nginx; then
        print_error "Nginx is not installed. Please run vps-setup.sh first."
        exit 1
    fi
    
    # Check if .env file exists
    if [ ! -f "$APP_DIR/.env" ]; then
        if [ -f "$APP_DIR/.env.production" ]; then
            print_warning ".env file not found, copying from .env.production"
            cp "$APP_DIR/.env.production" "$APP_DIR/.env"
            print_warning "Please edit $APP_DIR/.env with your actual configuration"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error ".env file not found. Please create one with your configuration."
            exit 1
        fi
    fi
    
    # Create backup if not skipped
    if [ "$SKIP_BACKUP" != true ]; then
        create_backup
    fi
    
    # Build and deploy application
    print_status "Building and deploying application..."
    cd "$APP_DIR"
    
    # Pull latest changes if git repository
    if [ -d ".git" ]; then
        print_status "Pulling latest changes..."
        git pull origin main || git pull origin master || print_warning "Failed to pull latest changes"
    fi
    
    # Build Docker image
    print_status "Building Docker image..."
    docker-compose build --no-cache
    
    # Start application
    print_status "Starting application..."
    docker-compose up -d
    
    # Wait for application to be ready
    wait_for_service "http://localhost:5000/api/health"
    
    # Setup systemd service
    setup_systemd_service
    
    # Setup Nginx
    setup_nginx
    
    # Setup SSL certificate
    if [ "$SKIP_SSL" != true ]; then
        setup_ssl
    fi
    
    # Setup monitoring
    setup_monitoring
    
    # Setup log rotation
    setup_log_rotation
    
    # Final health check
    print_status "Performing final health check..."
    if curl -f -s "http://localhost:5000/api/health" > /dev/null; then
        print_success "✅ Application is running successfully!"
        
        if [ -n "$DOMAIN" ] && [ "$DOMAIN" != "localhost" ]; then
            print_success "🌐 Your application should be accessible at: https://$DOMAIN"
        else
            print_success "🌐 Your application is accessible at: http://$(curl -s ifconfig.me):5000"
        fi
        
        print_success "🏥 Health check: http://localhost:5000/api/health"
    else
        print_error "❌ Application health check failed"
        print_error "Check logs with: docker-compose logs app"
        exit 1
    fi
    
    # Show useful information
    print_header "📋 Deployment Summary"
    print_status "Application: $APP_NAME"
    print_status "Directory: $APP_DIR"
    print_status "Domain: ${DOMAIN:-'Not configured'}"
    print_status "SSL: ${SKIP_SSL:+Skipped}"
    print_status ""
    print_status "Useful commands:"
    print_status "  View logs: docker-compose -f $APP_DIR/docker-compose.yml logs -f app"
    print_status "  Restart:   sudo systemctl restart $APP_NAME"
    print_status "  Status:    sudo systemctl status $APP_NAME"
    print_status "  Stop:      sudo systemctl stop $APP_NAME"
    print_status "  Start:     sudo systemctl start $APP_NAME"
    print_status ""
    print_status "Monitoring:"
    print_status "  Monitor logs: tail -f /var/log/$APP_NAME-monitor.log"
    print_status "  Deploy logs: tail -f $LOG_FILE"
    
    print_header "🎉 Deployment completed successfully!"
}

# Create log file
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chown "$USER:$USER" "$LOG_FILE"

# Run main function
main "$@"
