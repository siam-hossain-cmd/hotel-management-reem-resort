# 🌐 Remote Database Access Configuration

## Your Public IP Address
**Your IP: `180.74.70.121`**

This IP needs to be whitelisted in CyberPanel for remote MySQL access.

---

## 📋 Configuration Steps

### Step 1: Add Your IP to CyberPanel MySQL Remote Access

1. Login to CyberPanel dashboard
2. Navigate to: **Databases** → **Remote MySQL**
3. Add IP address: `180.74.70.121`
4. Select database: `admin_reemresort`
5. Save

### Step 2: Update MySQL User Permissions (via SSH)

SSH into your CyberPanel server and run:

```bash
mysql -u root -p

# Grant access from your IP
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'180.74.70.121' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Update Firewall Rules

```bash
# For firewalld (common on CentOS/CyberPanel)
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="180.74.70.121" port protocol="tcp" port="3306" accept'
firewall-cmd --reload

# Or for UFW (Ubuntu)
ufw allow from 180.74.70.121 to any port 3306
```

### Step 4: Verify MySQL is Listening on All Interfaces

```bash
# Check MySQL bind address
cat /etc/my.cnf | grep bind-address
# OR
cat /etc/mysql/my.cnf | grep bind-address

# Should be: bind-address = 0.0.0.0
# If it shows 127.0.0.1, you need to change it
```

If bind-address is 127.0.0.1, change it:

```bash
# Edit MySQL config
nano /etc/my.cnf
# OR
nano /etc/mysql/my.cnf

# Change:
# bind-address = 127.0.0.1
# To:
# bind-address = 0.0.0.0

# Restart MySQL
systemctl restart mysql
# OR
systemctl restart mariadb
```

---

## 🔧 Update Local .env for Development

Once remote access is configured, update your local `.env`:

```bash
# CyberPanel Remote MySQL Configuration
MYSQL_HOST=YOUR_CYBERPANEL_SERVER_IP    # Replace with actual IP
MYSQL_PORT=3306
MYSQL_USER=admin_reem
MYSQL_PASSWORD=jFm@@qC2MGdGb7h-
MYSQL_DATABASE=admin_reemresort
```

**You need to replace `YOUR_CYBERPANEL_SERVER_IP` with your actual CyberPanel server IP address.**

---

## ✅ Test Connection

After configuration, test the connection:

```bash
# From your local machine
mysql -h YOUR_CYBERPANEL_SERVER_IP -P 3306 -u admin_reem -p admin_reemresort

# Or test with the Node.js script
cd server
node scripts/test_connection.js
```

---

## 🔐 Security Notes

### Important Security Considerations:

1. **Your IP might change** if you're not on a static IP
   - If your IP changes, you'll need to update the whitelist
   - Consider using a VPN with static IP for development

2. **Limit remote access** to only development IPs
   - Don't open MySQL to `0.0.0.0/0` (all IPs)

3. **Use SSH tunnel** as an alternative (more secure):

```bash
# Create SSH tunnel
ssh -L 3307:localhost:3306 user@your-cyberpanel-server

# Then in .env use:
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
```

This is more secure as MySQL traffic goes through encrypted SSH tunnel.

---

## 🚨 Troubleshooting

### Connection Refused
- Check firewall allows port 3306 from your IP
- Verify MySQL is running: `systemctl status mysql`

### Access Denied
- Verify user permissions: `SHOW GRANTS FOR 'admin_reem'@'180.74.70.121';`
- Check password is correct

### Timeout
- MySQL bind-address might be 127.0.0.1 (needs to be 0.0.0.0)
- Firewall blocking port 3306

---

## 🎯 Quick Commands

```bash
# Get your current IP
curl -4 ifconfig.me

# Test MySQL connection
mysql -h CYBERPANEL_IP -u admin_reem -p admin_reemresort

# Check if port 3306 is open
telnet CYBERPANEL_IP 3306

# Or with nc
nc -zv CYBERPANEL_IP 3306
```

---

**Your IP**: `180.74.70.121`  
**Action Required**: Whitelist this IP in CyberPanel MySQL Remote Access
