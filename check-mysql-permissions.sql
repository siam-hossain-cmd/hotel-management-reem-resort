-- Run this on the MySQL server to check user permissions

-- Check which hosts are allowed for this user
SELECT user, host FROM mysql.user WHERE user = 'reemresort_admin';

-- Check detailed permissions
SHOW GRANTS FOR 'reemresort_admin'@'%';
SHOW GRANTS FOR 'reemresort_admin'@'localhost';

-- See all users
SELECT user, host, authentication_string FROM mysql.user;
