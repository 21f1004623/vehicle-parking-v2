# ParkEase — Deployment Guide

This guide covers deploying ParkEase on a VPS using Docker Compose.

---

## Step 1 — Get a VPS

**Hetzner** (recommended): https://hetzner.com/cloud

Pick **CX22** — €3.79/mo, 2 vCPU, 4GB RAM.

- Choose **Ubuntu 24.04**
- Add your SSH key during setup
- Note the server IP once created

---

## Step 2 — SSH into the server

```bash
ssh root@<your-server-ip>
```

---

## Step 3 — Install Docker

```bash
curl -fsSL https://get.docker.com | sh
```

Installs Docker + Docker Compose plugin in one command.

---

## Step 4 — Clone the repo

```bash
git clone https://github.com/21f1004623/vehicle-parking-v2
cd vehicle-parking-v2
```

---

## Step 5 — Configure environment variables

```bash
cp .env.example .env
nano .env
```

Generate secure random keys (run twice):

```bash
python3 -c "import secrets; print(secrets.token_hex(32))"
```

Set in `.env`:

```env
SECRET_KEY=<generated-key-1>
JWT_SECRET_KEY=<generated-key-2>
```

Save and exit: `Ctrl+X → Y → Enter`

---

## Step 6 — Expose port 80

```bash
nano docker-compose.yml
```

Change the `web` service ports from:

```yaml
ports:
  - "5000:5000"
```

To:

```yaml
ports:
  - "80:5000"
```

---

## Step 7 — Deploy

```bash
docker compose up --build -d
```

App is now live at **http://\<your-server-ip\>**

---

## Step 8 (Optional) — Domain + HTTPS

Point your domain's A record to the server IP, then:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

Create `/etc/nginx/sites-available/parkease`:

```nginx
server {
    server_name yourdomain.com;
    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
ln -s /etc/nginx/sites-available/parkease /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
certbot --nginx -d yourdomain.com
```

App is now live at **https://yourdomain.com**

---

## Useful commands

```bash
# View live logs
docker compose logs -f web

# Pull latest code and redeploy
git pull && docker compose up --build -d

# Check running containers
docker compose ps

# Stop all services
docker compose down

# Stop and wipe database
docker compose down -v
```

---

## Access Points

| URL | Description |
|-----|-------------|
| `http://<ip>/` | Landing page |
| `http://<ip>/user` | User portal |
| `http://<ip>/admin` | Admin portal |
| `http://<ip>:8025` | MailHog email inbox (dev) |
