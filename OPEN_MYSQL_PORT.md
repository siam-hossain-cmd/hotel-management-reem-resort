# 🔥 Open MySQL Port 3306 in CyberPanel Firewall

## Current Status
- ✅ Remote MySQL access configured in CyberPanel for IP: 180.74.70.121
- ❌ Firewall blocking port 3306 (connection refused)

## Solution: Open Port 3306 in Firewall

### SSH into your CyberPanel server and run:

```bash
ssh root@152.42.246.219
```

Then execute these commands:

### 1. Check if MySQL is running
```bash
systemctl status mysql
# or
systemctl status mariadb
```

### 2. Check current firewall rules
```bash
firewall-cmd --list-all
```

### 3. Open port 3306 for your IP
```bash
# Add rule for your specific IP
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="180.74.70.121" port protocol="tcp" port="3306" accept'

# Reload firewall
firewall-cmd --reload

# Verify the rule was added
firewall-cmd --list-rich-rules
```

### 4. Alternative: Open port 3306 for all (less secure, but simpler)
```bash
# Open port 3306 globally (use with caution)
firewall-cmd --permanent --add-port=3306/tcp
firewall-cmd --reload
```

### 5. Check MySQL bind address
```bash
# Check if MySQL is listening on all interfaces
grep bind-address /etc/my.cnf
# or
grep bind-address /etc/mysql/my.cnf
```

If it shows `bind-address = 127.0.0.1`, you need to change it:

```bash
# Backup the config
cp /etc/my.cnf /etc/my.cnf.backup

# Edit the file
nano /etc/my.cnf

# Find this line:
# bind-address = 127.0.0.1

# Change it to:
# bind-address = 0.0.0.0

# Save and exit (Ctrl+X, then Y, then Enter)

# Restart MySQL
systemctl restart mysql
# or
systemctl restart mariadb
```

### 6. Verify MySQL is listening on 0.0.0.0
```bash
netstat -tlnp | grep 3306
# Should show: 0.0.0.0:3306 or :::3306
```

## Quick All-in-One Command

Run this single command on your server:

```bash
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="180.74.70.121" port protocol="tcp" port="3306" accept' && firewall-cmd --reload && sed -i 's/bind-address.*=.*/bind-address = 0.0.0.0/' /etc/my.cnf && systemctl restart mysql && echo "✅ Configuration complete!"
```

## After Configuration

Once done, test from your local machine:

```bash
# Test with MySQL client
mysql -h 152.42.246.219 -u admin_reem -p admin_reemresort

# Or test with Node.js
cd server
node scripts/test_connection.js
```

## Troubleshooting

### If using CSF Firewall instead of firewalld:
```bash
# Check if CSF is installed
csf -v

# If yes, add your IP to allow list
csf -a 180.74.70.121 "Development Access"

# Restart CSF
csf -r
```

### Check if port is actually blocked:
```bash
# From your server, check what's listening
ss -tlnp | grep 3306
netstat -tlnp | grep 3306
```

### Check MySQL error logs:
```bash
tail -f /var/log/mysql/error.log
# or
tail -f /var/log/mariadb/mariadb.log
```

---

**Your IP**: 180.74.70.121  
**Server IP**: 152.42.246.219  
**Port to open**: 3306  
**Action**: Run the commands above on your CyberPanel server
