# SSL/TLS Certificates

## SECURITY NOTICE

**DO NOT commit actual SSL/TLS certificates or private keys to Git.**

Certificates and private keys are excluded from version control via `.gitignore`.

---

## For Development (Localhost)

Generate self-signed certificates for local development:

```bash
cd nginx/ssl

# Generate self-signed certificate for localhost
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout privkey.pem \
  -out fullchain.pem \
  -subj "/C=US/ST=State/L=City/O=Development/CN=localhost"
```

---

## For Production

### Option 1: Cloudflare SSL/TLS (Recommended)

Use Cloudflare's Origin Certificates:

1. Log into Cloudflare Dashboard
2. Go to SSL/TLS → Origin Server
3. Create Certificate
4. Download `origin.pem` (certificate) and `origin-key.pem` (private key)
5. Place in this directory:
   ```bash
   nginx/ssl/fullchain.pem  # origin.pem
   nginx/ssl/privkey.pem    # origin-key.pem
   ```

### Option 2: Let's Encrypt

Use Certbot to obtain free certificates:

```bash
# Install certbot
sudo apt-get update
sudo apt-get install certbot

# Obtain certificate for your domain
sudo certbot certonly --standalone -d crm.senovallc.com

# Certificates will be in:
# /etc/letsencrypt/live/crm.senovallc.com/fullchain.pem
# /etc/letsencrypt/live/crm.senovallc.com/privkey.pem

# Create symlinks or copy to this directory
sudo cp /etc/letsencrypt/live/crm.senovallc.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/crm.senovallc.com/privkey.pem nginx/ssl/
```

### Option 3: Docker Volume Mount (Best Practice)

Don't place certificates in the repository at all. Instead, mount them from the host:

```yaml
# In docker-compose.prod.yml
services:
  nginx:
    volumes:
      - /etc/letsencrypt/live/crm.senovallc.com:/etc/nginx/ssl:ro
```

---

## Certificate Renewal

### Cloudflare Origin Certificates
- Valid for 15 years
- Renewal instructions in Cloudflare dashboard

### Let's Encrypt
- Valid for 90 days
- Auto-renewal via cron:

```bash
# Add to crontab
0 0 * * * certbot renew --quiet && docker compose restart nginx
```

---

## Verification

Test your SSL configuration:

```bash
# Check certificate details
openssl x509 -in fullchain.pem -text -noout

# Test HTTPS connection
curl -v https://crm.senovallc.com

# SSL Labs test (production only)
# Visit: https://www.ssllabs.com/ssltest/
```

---

## Security Best Practices

1. ✅ Never commit certificates to Git
2. ✅ Use strong 2048-bit or 4096-bit RSA keys
3. ✅ Restrict file permissions: `chmod 600 privkey.pem`
4. ✅ Enable HSTS in nginx configuration
5. ✅ Use TLS 1.2 and 1.3 only (disable older versions)
6. ✅ Implement proper cipher suites
7. ✅ Set up certificate renewal reminders

---

**Last Updated:** 2025-12-12
**Maintained By:** Security Team
