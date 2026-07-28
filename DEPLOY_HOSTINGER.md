# Hostinger VPS Deployment Guide

This project is prepared for production deployment with Docker + Nginx.

## 1) Requirements on VPS

Run these on your Hostinger VPS (Ubuntu):

```bash
sudo apt update
sudo apt install -y ca-certificates curl gnupg nginx certbot python3-certbot-nginx

sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
sudo chmod a+r /etc/apt/keyrings/docker.gpg

echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | \
  sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo systemctl enable docker
sudo systemctl start docker
```

Optional non-root Docker usage:

```bash
sudo usermod -aG docker $USER
newgrp docker
```

## 2) Upload/clone project

```bash
sudo mkdir -p /var/www/nextjs-fintech
sudo chown -R $USER:$USER /var/www/nextjs-fintech
cd /var/www/nextjs-fintech
git clone <YOUR_REPO_URL> .
```

## 3) Create production env file

```bash
cp .env.production.example .env.production
nano .env.production
```

Set all required values:
- `NEXTAUTH_URL` (must be your real domain, e.g. `https://app.example.com`)
- `NEXTAUTH_SECRET` (long random string)
- `MONGODB_URI`
- Cloudinary keys

## 4) Start app container

```bash
cd /var/www/nextjs-fintech
docker compose up -d --build
docker compose ps
```

App listens on `127.0.0.1:3000` (internal only).

## 5) Configure Nginx reverse proxy

Copy provided config and edit domain:

```bash
sudo cp deploy/nginx/nextjs-fintech.conf /etc/nginx/sites-available/nextjs-fintech
sudo nano /etc/nginx/sites-available/nextjs-fintech
```

Replace:
- `your-domain.com`
- `www.your-domain.com`

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/nextjs-fintech /etc/nginx/sites-enabled/nextjs-fintech
sudo nginx -t
sudo systemctl reload nginx
```

## 6) Point domain to VPS

In Hostinger DNS:
- A record for `@` -> VPS public IP
- A record for `www` -> VPS public IP

Wait for DNS propagation.

## 7) Enable SSL (Let's Encrypt)

```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

Certbot will auto-update Nginx for HTTPS.

## 8) Firewall (recommended)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

## 9) Deploy updates later

```bash
cd /var/www/nextjs-fintech
chmod +x scripts/vps-deploy.sh
./scripts/vps-deploy.sh
```

## Troubleshooting

- Check container logs:
```bash
docker compose logs -f app
```
- Check Nginx logs:
```bash
sudo tail -f /var/log/nginx/error.log
```
- Verify env file:
```bash
cat /var/www/nextjs-fintech/.env.production
```
