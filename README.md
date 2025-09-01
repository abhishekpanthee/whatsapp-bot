# WhatsApp Bot API

A powerful WhatsApp Web automation bot built with Node.js that provides REST API endpoints for sending messages, managing auto-replies, and handling media files.

## ✨ Features

- 🤖 **Auto-reply system** with personalized messages
- 📱 **Send text messages** to individual contacts
- 📸 **Send media files** (images, videos, documents)
- 📊 **Message tracking** and reply detection
- 📋 **QR code generation** for authentication
- 🛠️ **RESTful API** with comprehensive endpoints

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- npm or yarn
- Chrome/Chromium browser (for headless mode)

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/abhishekpanthee/whatsapp-bot.git
   cd whatsapp-bot
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Create environment file:**

   ```bash
   cp .env.example .env
   ```

   Configure your `.env` file:

   ```env
   PORT=3000
   DEFAULT_CC=+977  # Your default country code
   ```

4. **Start the application:**

   ```bash
   npm start
   ```

5. **Authenticate WhatsApp:**
   - Visit `http://localhost:3000/qr` to get the QR code
   - Scan it with your WhatsApp mobile app
   - Wait for "Client is ready" message in console

## 🌐 Deployment

### 🚂 Railway Deployment

Railway offers the easiest deployment option with automatic builds and deployments.

#### Step 1: Prepare Your Project

1. **Ensure all files are ready:**

   ```
   ├── index.js
   ├── package.json
   ├── Procfile
   ├── railway.json
   └── README.md
   ```

2. **Verify Procfile contains:**
   ```
   web: node index.js
   ```

#### Step 2: Deploy to Railway

1. **Using Railway CLI:**

   ```bash
   # Install Railway CLI
   npm install -g @railway/cli

   # Login to Railway
   railway login

   # Deploy your project
   railway up
   ```

2. **Using GitHub Integration:**
   - Push your code to GitHub
   - Connect your GitHub repo to Railway
   - Railway will automatically deploy on each push

#### Step 3: Configure Environment Variables

In Railway dashboard, add these environment variables:

```
PORT=3000
DEFAULT_CC=+977
```

#### Step 4: Access Your Bot

- Your bot will be available at: `https://your-app-name.railway.app`
- Get QR code at: `https://your-app-name.railway.app/qr`

### 🖥️ VPS Deployment

For more control and customization, deploy on your own VPS.

#### Step 1: Server Setup

1. **Update your server:**

   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js:**

   ```bash
   # Install Node.js 18.x
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs

   # Verify installation
   node --version
   npm --version
   ```

3. **Install PM2 (Process Manager):**

   ```bash
   sudo npm install -g pm2
   ```

4. **Install Chrome dependencies:**
   ```bash
   sudo apt-get install -y \
     ca-certificates \
     fonts-liberation \
     libasound2 \
     libatk-bridge2.0-0 \
     libatk1.0-0 \
     libc6 \
     libcairo2 \
     libcups2 \
     libdbus-1-3 \
     libexpat1 \
     libfontconfig1 \
     libgcc1 \
     libgconf-2-4 \
     libgdk-pixbuf2.0-0 \
     libglib2.0-0 \
     libgtk-3-0 \
     libnspr4 \
     libnss3 \
     libpango-1.0-0 \
     libpangocairo-1.0-0 \
     libstdc++6 \
     libx11-6 \
     libx11-xcb1 \
     libxcb1 \
     libxcomposite1 \
     libxcursor1 \
     libxdamage1 \
     libxext6 \
     libxfixes3 \
     libxi6 \
     libxrandr2 \
     libxrender1 \
     libxss1 \
     libxtst6 \
     lsb-release \
     wget \
     xdg-utils
   ```

#### Step 2: Deploy Application

1. **Clone and setup your project:**

   ```bash
   cd /var/www
   sudo git clone https://github.com/abhishekpanthee/whatsapp-bot.git whatsapp-bot
   cd whatsapp-bot
   sudo npm install
   ```

2. **Create environment file:**

   ```bash
   sudo nano .env
   ```

   Add your configuration:

   ```env
   PORT=3000
   DEFAULT_CC=+977
   NODE_ENV=production
   ```

3. **Set proper permissions:**
   ```bash
   sudo chown -R $USER:$USER /var/www/whatsapp-bot
   ```

#### Step 3: Configure PM2

1. **Create PM2 ecosystem file:**

   ```bash
   nano ecosystem.config.js
   ```

   ```javascript
   module.exports = {
     apps: [
       {
         name: "whatsapp-bot",
         script: "index.js",
         instances: 1,
         autorestart: true,
         watch: false,
         max_memory_restart: "1G",
         env: {
           NODE_ENV: "production",
           PORT: 3000,
         },
       },
     ],
   };
   ```

2. **Start the application:**
   ```bash
   pm2 start ecosystem.config.js
   pm2 save
   pm2 startup
   ```

#### Step 4: Configure Nginx (Optional)

1. **Install Nginx:**

   ```bash
   sudo apt install nginx -y
   ```

2. **Create Nginx configuration:**

   ```bash
   sudo nano /etc/nginx/sites-available/whatsapp-bot
   ```

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/whatsapp-bot /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Step 5: Setup SSL (Optional but Recommended)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo crontab -e
# Add this line:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## 📡 API Endpoints

### Authentication

#### Get QR Code

```http
GET /qr
```

**Response:**

```json
{
  "ok": true,
  "qr": "qr_code_string"
}
```

#### Check Status

```http
GET /status
```

**Response:**

```json
{
  "ok": true,
  "state": "CONNECTED",
  "me": {
    "id": "1234567890@c.us",
    "pushname": "Your Name"
  },
  "platform": "web"
}
```

### Messaging

#### Send Text Message

```http
POST /send-text
Content-Type: application/json

{
  "to": "9779812345678",
  "message": "Hello from the bot!"
}
```

**Response:**

```json
{
  "ok": true,
  "id": "message_id",
  "timestamp": 1642123456789,
  "to": "9779812345678@c.us"
}
```

#### Send Media

```http
POST /send-media
Content-Type: multipart/form-data

to: 9779812345678
caption: Optional caption
file: [binary file]
```

**Response:**

```json
{
  "ok": true,
  "id": "message_id",
  "to": "9779812345678@c.us",
  "filename": "image.jpg"
}
```

#### Send Group Message

```http
POST /send-group
Content-Type: application/json

{
  "groupId": "group_id@g.us",
  "message": "Hello group!"
}
```

#### Send Bulk Messages

```http
POST /send-bulk
Content-Type: application/json

{
  "items": [
    {
      "to": "9779812345678",
      "message": "Hello User 1"
    },
    {
      "to": "9779876543210",
      "message": "Hello User 2"
    }
  ],
  "delayMs": 1200
}
```

### Auto-Reply Management

#### Get Auto-Reply Status

```http
GET /auto-reply/status
```

**Response:**

```json
{
  "ok": true,
  "enabled": true,
  "message": "Current auto-reply message",
  "totalAutoReplied": 42
}
```

#### Toggle Auto-Reply

```http
POST /auto-reply/toggle
```

#### Update Auto-Reply Message

```http
POST /auto-reply/message
Content-Type: application/json

{
  "message": "New auto-reply message with {name} placeholder"
}
```

#### Clear Auto-Reply Cooldown

```http
POST /auto-reply/clear/9779812345678
```

#### Clear All Cooldowns

```http
POST /auto-reply/clear-all
```

### Message Tracking

#### Check All Tracked Messages

```http
GET /check-replies
```

**Response:**

```json
{
  "ok": true,
  "trackedMessages": [
    {
      "messageId": "msg_id",
      "to": "9779812345678@c.us",
      "originalMessage": "Hello",
      "timestamp": 1642123456789,
      "replied": true,
      "replyText": "Hi back!",
      "replyTimestamp": 1642123460000
    }
  ],
  "totalTracked": 5
}
```

#### Check Specific Message Reply

```http
GET /check-reply/:messageId
```

## 📱 Phone Number Formats

The bot accepts various phone number formats:

- **International format:** `+9779812345678`
- **National format:** `9812345678` (uses DEFAULT_CC)
- **With country code:** `9779812345678`

## 🔧 Environment Variables

| Variable     | Description          | Default       | Required |
| ------------ | -------------------- | ------------- | -------- |
| `PORT`       | Server port          | `3000`        | No       |
| `DEFAULT_CC` | Default country code | `""`          | No       |
| `NODE_ENV`   | Environment          | `development` | No       |

## 🐛 Troubleshooting

### Common Issues

1. **"Session closed" errors:**

   - Re-scan QR code
   - Clear `.wwebjs_auth` folder
   - Restart the application

2. **Chrome/Puppeteer issues on VPS:**

   ```bash
   # Install missing dependencies
   sudo apt-get install -y gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils wget
   ```

3. **Memory issues:**
   - Increase VPS RAM
   - Configure PM2 memory limits
   - Use `max_memory_restart` in PM2 config

### Monitoring

#### PM2 Commands (VPS)

```bash
# View logs
pm2 logs whatsapp-bot

# Monitor processes
pm2 monit

# Restart application
pm2 restart whatsapp-bot

# View process list
pm2 list
```

#### Railway Logs

```bash
# View logs using Railway CLI
railway logs
```

## 👨‍💻 Author

**Abhishek Panthee**

- Email: contact@abhishekpanthee.com.np
- Website: https://abhishekpanthee.com.np

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## ⭐ Support

If you find this project helpful, please give it a ⭐ on GitHub!

For support, email contact@abhishekpanthee.com.np or create an issue on GitHub.

