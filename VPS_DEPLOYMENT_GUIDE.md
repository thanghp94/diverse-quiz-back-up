# VPS Deployment Guide for Quiz Application

This guide will walk you through deploying your quiz application to a VPS (Virtual Private Server).

## Prerequisites

- A VPS with Ubuntu 20.04+ or similar Linux distribution
- SSH access to your VPS
- Domain name (optional but recommended)
- Basic knowledge of command line

## Step 1: Prepare Your VPS

### 1.1 Connect to your VPS
```bash
ssh root@your-vps-ip
# or
ssh your-username@your-vps-ip
```

### 1.2 Update the system
```bash
sudo apt update && sudo apt upgrade -y
```

### 1.3 Install Docker and Docker Compose
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (if not root)
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
docker --version
docker-compose --version
```

### 1.4 Install additional tools
```bash
sudo apt install -y git curl nginx certbot python3-certbot-nginx ufw
```

## Step 2: Setup Firewall

```bash
# Allow SSH, HTTP, and HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 5000  # For direct app access (optional)
sudo ufw --force enable
``` 
cd /opt
sudo git clone https://github.com/your-username/your-repo.git quiz-app
sudo chown -R $USER:$USER /opt/quiz-app
cd /opt/quiz-app
```

### 3.2 Setup environment variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit the environment file
nano .env
```

**Important Environment Variables:**
```env
# Database
DATABASE_URL=your_neon_database_url

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_OAUTH_DOMAIN=your-domain.com

# Session Secret
SESSION_SECRET=your_very_secure_random_string

# Environment
NODE_ENV=production

# SendGrid (for emails)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com

# Google Cloud Storage (for file uploads)
GOOGLE_CLOUD_PROJECT_ID=your_project_id
GOOGLE_CLOUD_STORAGE_BUCKET=your_bucket_name
```

### 3.3 Deploy the application
```bash
# Make deploy script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Step 4: Setup Nginx Reverse Proxy

### 4.1 Create Nginx configuration
```bash
sudo nano /etc/nginx/sites-available/quiz-app
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Handle static files
    location /assets/ {
        proxy_pass http://localhost:5000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /api/health {
        proxy_pass http://localhost:5000;
        access_log off;
    }
}
```

### 4.2 Enable the site
```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/quiz-app /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

## Step 5: Setup SSL Certificate (HTTPS)

```bash
# Get SSL certificate from Let's Encrypt
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

## Step 6: Setup Process Management

### 6.1 Create systemd service
```bash
sudo nano /etc/systemd/system/quiz-app.service
```

Add the following content:
```ini
[Unit]
Description=Quiz Application
After=docker.service
Requires=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/quiz-app
ExecStart=/usr/local/bin/docker-compose up -d
ExecStop=/usr/local/bin/docker-compose down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

### 6.2 Enable and start the service
```bash
sudo systemctl daemon-reload
sudo systemctl enable quiz-app.service
sudo systemctl start quiz-app.service
```

## Step 7: Setup Monitoring and Logging

### 7.1 Setup log rotation
```bash
sudo nano /etc/logrotate.d/quiz-app
```

Add:
```
/opt/quiz-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 root root
    postrotate
        docker-compose -f /opt/quiz-app/docker-compose.yml restart app
    endscript
}
```

### 7.2 Create monitoring script
```bash
nano /opt/quiz-app/monitor.sh
```

Add:
```bash
#!/bin/bash
# Simple monitoring script

APP_URL="http://localhost:5000/api/health"
LOG_FILE="/var/log/quiz-app-monitor.log"

if ! curl -f $APP_URL > /dev/null 2>&1; then
    echo "$(date): Application is down, restarting..." >> $LOG_FILE
    cd /opt/quiz-app
    docker-compose restart app
    sleep 30
    if curl -f $APP_URL > /dev/null 2>&1; then
        echo "$(date): Application restarted successfully" >> $LOG_FILE
    else
        echo "$(date): Failed to restart application" >> $LOG_FILE
    fi
else
    echo "$(date): Application is healthy" >> $LOG_FILE
fi
```

### 7.3 Setup cron job for monitoring
```bash
chmod +x /opt/quiz-app/monitor.sh
crontab -e
```

Add:
```
# Check application health every 5 minutes
*/5 * * * * /opt/quiz-app/monitor.sh
```

## Step 8: Backup Strategy

### 8.1 Create backup script
```bash
nano /opt/quiz-app/backup.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/opt/backups/quiz-app"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup application files
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C /opt quiz-app --exclude=node_modules --exclude=dist

# Backup database (if using local database)
# docker exec quiz-app-db pg_dump -U username database_name > $BACKUP_DIR/db_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete

echo "Backup completed: $DATE"
```

### 8.2 Setup backup cron job
```bash
chmod +x /opt/quiz-app/backup.sh
crontab -e
```

Add:
```
# Daily backup at 2 AM
0 2 * * * /opt/quiz-app/backup.sh
```

## Step 9: Useful Commands

### Application Management
```bash
# View application logs
cd /opt/quiz-app && docker-compose logs -f app

# Restart application
cd /opt/quiz-app && docker-compose restart app

# Update application
cd /opt/quiz-app && git pull && ./deploy.sh

# Check application status
systemctl status quiz-app.service
```

### System Monitoring
```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check running processes
htop

# Check Docker containers
docker ps

# Check Nginx status
systemctl status nginx
```

### Troubleshooting
```bash
# Check application logs
docker-compose logs app

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log

# Check system logs
sudo journalctl -u quiz-app.service -f

# Test application health
curl http://localhost:5000/api/health
```

## Security Best Practices

1. **Keep system updated**: `sudo apt update && sudo apt upgrade -y`
2. **Use strong passwords** and SSH keys
3. **Configure fail2ban**: `sudo apt install fail2ban`
4. **Regular backups** of your data
5. **Monitor logs** for suspicious activity
6. **Use HTTPS** for all traffic
7. **Keep Docker images updated**: `docker-compose pull && docker-compose up -d`

## Performance Optimization

1. **Enable Nginx caching** for static assets
2. **Use CDN** for global content delivery
3. **Optimize database queries** and add indexes
4. **Monitor resource usage** and scale as needed
5. **Use Docker multi-stage builds** to reduce image size

## Scaling Considerations

For high-traffic applications, consider:
- Load balancer (Nginx, HAProxy)
- Multiple application instances
- Database clustering
- Redis for session storage
- Container orchestration (Docker Swarm, Kubernetes)

---

## Quick Deployment Checklist

- [ ] VPS setup with Docker and Docker Compose
- [ ] Firewall configured
- [ ] Application deployed and running
- [ ] Nginx reverse proxy configured
- [ ] SSL certificate installed
- [ ] Systemd service enabled
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Domain DNS configured
- [ ] Environment variables configured
- [ ] Application tested and accessible

Your quiz application should now be successfully deployed and accessible at your domain!
