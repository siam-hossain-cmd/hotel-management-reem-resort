#!/bin/bash
# Run these commands on your CyberPanel server via SSH

echo "🔧 Configuring MySQL Remote Access for IP: 180.74.70.121"
echo "=========================================================="

# Step 1: Grant MySQL permissions
echo ""
echo "Step 1: Granting MySQL permissions..."
mysql -u root -p << EOF
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'180.74.70.121' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';
GRANT ALL PRIVILEGES ON admin_reemresort.* TO 'admin_reem'@'%' IDENTIFIED BY 'jFm@@qC2MGdGb7h-';
FLUSH PRIVILEGES;
EXIT;
EOF

echo "✅ MySQL permissions granted"

# Step 2: Update MySQL bind address
echo ""
echo "Step 2: Updating MySQL bind address..."

# Check if my.cnf exists and update bind-address
if [ -f /etc/my.cnf ]; then
    cp /etc/my.cnf /etc/my.cnf.backup
    sed -i 's/bind-address.*=.*/bind-address = 0.0.0.0/' /etc/my.cnf
    echo "✅ Updated /etc/my.cnf"
elif [ -f /etc/mysql/my.cnf ]; then
    cp /etc/mysql/my.cnf /etc/mysql/my.cnf.backup
    sed -i 's/bind-address.*=.*/bind-address = 0.0.0.0/' /etc/mysql/my.cnf
    echo "✅ Updated /etc/mysql/my.cnf"
fi

# Step 3: Update firewall
echo ""
echo "Step 3: Updating firewall rules..."
firewall-cmd --permanent --add-rich-rule='rule family="ipv4" source address="180.74.70.121" port protocol="tcp" port="3306" accept'
firewall-cmd --reload
echo "✅ Firewall updated"

# Step 4: Restart MySQL
echo ""
echo "Step 4: Restarting MySQL service..."
systemctl restart mysql || systemctl restart mariadb
echo "✅ MySQL restarted"

echo ""
echo "🎉 Configuration complete!"
echo ""
echo "Test connection from your local machine:"
echo "mysql -h 152.42.246.219 -u admin_reem -p admin_reemresort"
