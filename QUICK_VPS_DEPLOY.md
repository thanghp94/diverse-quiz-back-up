# Quick VPS Deployment Guide

This is a simplified guide to get your quiz application running on a VPS in minutes.

## Prerequisites

- A VPS with Ubuntu 20.04+ (2GB RAM minimum, 4GB recommended)
- SSH access to your VPS
- A domain name pointing to your VPS IP (optional but recommended)
- Your database URL (Neon Database recommended)

## Step 1: Initial VPS Setup

Connect to your VPS and run the setup script:

```bash
# Connect to your VPS
ssh your-username@your-vps-ip

# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/vps-setup.sh -o vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh

# Log out and back in for Docker group changes
exit
ssh your-username@your-vps-ip
```

## Step 2: Deploy Your Application

```bash
# Clone your repository
cd /opt
sudo git clone https://github.com/your-username/your-repo.git quiz-app
sudo chown -R $USER:$USER /opt/quiz-app
cd /opt/quiz-app

# Configure environment variables
cp .env.production .env
nano .env  # Edit with your actual values

# Make scripts executable
chmod +x *.sh

# Deploy the application
./vps-deploy.sh --domain your-domain.com --email your-email@example.com
```

## Step 3: Configure DNS

Point your domain to your VPS IP address:

```
A Record: your-domain.com → your-vps-ip
A Record: www.your-domain.com → your-vps-ip
```

## Step 4: Verify Deployment

```bash
# Check application status
sudo systemctl status quiz-app

# Check application health
curl http://localhost:5000/api/health

# View logs
docker-compose logs -f app
```

## Environment Variables You Must Configure

Edit `/opt/quiz-app/.env` with these essential values:

```env
# Database (Required)
DATABASE_URL=postgresql://username:password@host:5432/database

# Session Security (Required)
SESSION_SECRET=your_very_secure_random_string_here

# Domain (Required for OAuth)
GOOGLE_OAUTH_DOMAIN=your-domain.com

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Email (Optional)
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com
```

## Common Commands

```bash
# Restart application
sudo systemctl restart quiz-app

# View application logs
docker-compose -f /opt/quiz-app/docker-compose.yml logs -f app

# Update application
cd /opt/quiz-app
git pull
./vps-deploy.sh --domain your-domain.com

# Check SSL certificate
sudo certbot certificates

# Renew SSL certificate
sudo certbot renew

# Monitor system resources
htop

# Check disk space
df -h

# View nginx logs
sudo tail -f /var/log/nginx/quiz-app.error.log
```

## Troubleshooting

### Application won't start
```bash
# Check Docker containers
docker ps -a

# Check application logs
docker-compose logs app

# Check system logs
sudo journalctl -u quiz-app.service -f
```

### SSL certificate issues
```bash
# Check certificate status
sudo certbot certificates

# Manually renew certificate
sudo certbot renew --force-renewal

# Test nginx configuration
sudo nginx -t
```

### Database connection issues
```bash
# Test database connection
docker-compose exec app node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1\`.then(() => console.log('DB OK')).catch(console.error);
"
```

### Performance issues
```bash
# Check system resources
htop
free -h
df -h

# Check application performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:5000/api/health
```

## Security Checklist

- [ ] Firewall configured (UFW enabled)
- [ ] SSH key authentication enabled
- [ ] Strong passwords used
- [ ] SSL certificate installed
- [ ] Regular backups scheduled
- [ ] Monitoring enabled
- [ ] Log rotation configured
- [ ] Fail2ban installed and configured

## Backup and Recovery

```bash
# Manual backup
cd /opt/quiz-app
./backup.sh

# Restore from backup
cd /opt/backups/quiz-app
tar -xzf backup_YYYYMMDD_HHMMSS.tar.gz -C /opt/

# Database backup (if using local database)
docker exec quiz-app-db pg_dump -U username database > backup.sql
```

## Scaling Considerations

For high-traffic applications:

1. **Vertical Scaling**: Upgrade VPS resources (CPU, RAM)
2. **Horizontal Scaling**: Use load balancer with multiple instances
3. **Database Scaling**: Use read replicas or database clustering
4. **CDN**: Use CloudFlare or similar for static assets
5. **Caching**: Implement Redis for session storage and caching

## Support

If you encounter issues:

1. Check the logs first
2. Verify environment variables
3. Test database connectivity
4. Check system resources
5. Review nginx configuration
6. Verify SSL certificate status

## One-Line Deployment (Advanced)

For experienced users, you can deploy in one command:

```bash
curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/vps-setup.sh | bash && \
cd /opt && sudo git clone https://github.com/your-username/your-repo.git quiz-app && \
sudo chown -R $USER:$USER /opt/quiz-app && cd /opt/quiz-app && \
cp .env.production .env && nano .env && \
chmod +x *.sh && ./vps-deploy.sh --domain your-domain.com --email your-email@example.com
```

**Note**: Make sure to edit the `.env` file with your actual configuration before running the deployment script.

---

Your quiz application should now be running securely on your VPS with HTTPS, monitoring, and automatic backups! 🎉
