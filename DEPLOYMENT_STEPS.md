# Step-by-Step VPS Deployment Guide

Follow these steps in order to deploy your quiz application to a VPS.

## 📋 Prerequisites Checklist

Before starting, make sure you have:
- [ ] A VPS server (Ubuntu 20.04+ recommended, minimum 2GB RAM)
- [ ] SSH access to your VPS (username and IP address)
- [ ] A domain name (optional but recommended)
- [ ] Your Neon database URL
- [ ] Email address for SSL certificate

## 🚀 Step 1: Connect to Your VPS

```bash
# Replace with your actual VPS details
ssh your-username@your-vps-ip-address

# Example:
# ssh root@123.456.789.123
# or
# ssh ubuntu@your-domain.com
```

**✅ Checkpoint:** You should see your VPS command prompt.

---

## 🔧 Step 2: Initial VPS Setup

Run this command on your VPS to install all required software:

```bash
# Download and run the setup script
curl -fsSL https://raw.githubusercontent.com/your-username/your-repo/main/vps-setup.sh -o vps-setup.sh
chmod +x vps-setup.sh
./vps-setup.sh
```

**What this does:**
- Installs Docker and Docker Compose
- Installs Nginx web server
- Installs SSL certificate tools (Certbot)
- Configures firewall
- Sets up monitoring tools

**✅ Checkpoint:** You should see "VPS Setup completed successfully!" message.

**Important:** Log out and back in after this step:
```bash
exit
ssh your-username@your-vps-ip-address
```

---

## 📁 Step 3: Get Your Application Code

```bash
# Create application directory and clone your code
cd /opt
sudo git clone https://github.com/your-username/your-repo.git quiz-app
sudo chown -R $USER:$USER /opt/quiz-app
cd /opt/quiz-app
```

**✅ Checkpoint:** You should be in `/opt/quiz-app` directory with your application files.

---

## ⚙️ Step 4: Configure Environment Variables

```bash
# Copy the production environment template
cp .env.production .env

# Edit the environment file
nano .env
```

**Required Configuration:**
```env
# Database (REQUIRED - Get this from Neon Dashboard)
DATABASE_URL=postgresql://username:password@ep-xxx.us-east-1.aws.neon.tech/neondb

# Session Security (REQUIRED - Generate a random string)
SESSION_SECRET=your_very_secure_random_string_here_make_it_long_and_complex

# Domain (REQUIRED if using custom domain)
GOOGLE_OAUTH_DOMAIN=your-domain.com

# Optional: Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# Optional: Email
SENDGRID_API_KEY=your_sendgrid_api_key
FROM_EMAIL=noreply@your-domain.com
```

**How to save in nano:**
1. Edit the values above
2. Press `Ctrl + X`
3. Press `Y` to confirm
4. Press `Enter` to save

**✅ Checkpoint:** Your `.env` file should contain your actual database URL and other settings.

---

## 🌐 Step 5: Configure Your Domain (If Using One)

**If you have a domain name:**

1. **Point your domain to your VPS:**
   - Go to your domain registrar (GoDaddy, Namecheap, etc.)
   - Add these DNS records:
     ```
     A Record: your-domain.com → your-vps-ip-address
     A Record: www.your-domain.com → your-vps-ip-address
     ```

2. **Wait for DNS propagation (5-30 minutes)**

**If you don't have a domain:**
- You can still deploy and access via IP address
- Skip the domain-related steps

**✅ Checkpoint:** Your domain should resolve to your VPS IP (test with `ping your-domain.com`).

---

## 🚀 Step 6: Deploy Your Application

```bash
# Make scripts executable
chmod +x *.sh

# Deploy with domain (replace with your actual domain and email)
./vps-deploy.sh --domain your-domain.com --email your-email@example.com

# OR deploy without domain (IP access only)
./vps-deploy.sh
```

**What this does:**
- Builds your Docker image
- Starts your application
- Configures Nginx reverse proxy
- Sets up SSL certificate (if domain provided)
- Configures monitoring and backups
- Sets up automatic startup

**✅ Checkpoint:** You should see "Deployment completed successfully!" message.

---

## 🧪 Step 7: Test Your Deployment

```bash
# Test application health
curl http://localhost:5000/api/health

# Check application status
sudo systemctl status quiz-app

# View application logs
docker-compose logs -f app
```

**✅ Checkpoint:** 
- Health check should return `{"status":"healthy"}`
- Service should show "active (running)"
- Logs should show "serving on port 5000"

---

## 🌍 Step 8: Access Your Application

**With Domain:**
- Visit: `https://your-domain.com`
- Should automatically redirect to HTTPS

**Without Domain:**
- Visit: `http://your-vps-ip-address:5000`
- Or through Nginx: `http://your-vps-ip-address`

**✅ Checkpoint:** You should see your quiz application login page.

---

## 🔍 Troubleshooting Common Issues

### Issue: "Connection refused"
```bash
# Check if application is running
docker ps
sudo systemctl status quiz-app

# Check logs
docker-compose logs app
```

### Issue: "Database connection failed"
```bash
# Test database connection
docker-compose exec app node -e "
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);
sql\`SELECT 1\`.then(() => console.log('DB OK')).catch(console.error);
"
```

### Issue: "SSL certificate failed"
```bash
# Check certificate status
sudo certbot certificates

# Try manual certificate
sudo certbot --nginx -d your-domain.com
```

### Issue: "502 Bad Gateway"
```bash
# Check Nginx configuration
sudo nginx -t

# Restart services
sudo systemctl restart nginx
sudo systemctl restart quiz-app
```

---

## 📊 Useful Commands After Deployment

```bash
# View application logs
docker-compose -f /opt/quiz-app/docker-compose.yml logs -f app

# Restart application
sudo systemctl restart quiz-app

# Check system resources
htop

# Check disk space
df -h

# Update application (after code changes)
cd /opt/quiz-app
git pull
./vps-deploy.sh --domain your-domain.com
```

---

## 🎉 Success Checklist

- [ ] VPS setup completed
- [ ] Application code deployed
- [ ] Environment variables configured
- [ ] Domain DNS configured (if using domain)
- [ ] Application deployed successfully
- [ ] Health check passes
- [ ] Can access application in browser
- [ ] SSL certificate installed (if using domain)
- [ ] Monitoring and backups configured

---

## 🆘 Need Help?

If you encounter issues:

1. **Check the logs first:**
   ```bash
   docker-compose logs app
   sudo journalctl -u quiz-app.service -f
   ```

2. **Verify your configuration:**
   ```bash
   cat /opt/quiz-app/.env
   ```

3. **Test individual components:**
   ```bash
   curl http://localhost:5000/api/health
   sudo nginx -t
   docker ps
   ```

4. **Common fixes:**
   ```bash
   # Restart everything
   sudo systemctl restart quiz-app
   sudo systemctl restart nginx
   
   # Rebuild application
   cd /opt/quiz-app
   docker-compose down
   docker-compose up --build -d
   ```

Your quiz application should now be running securely on your VPS! 🚀
