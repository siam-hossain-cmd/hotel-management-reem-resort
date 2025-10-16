# SSH Tunnel to MySQL (Workaround)

If you have SSH access to 216.104.47.118, you can create a tunnel:

## Step 1: Create SSH Tunnel
```bash
ssh -L 3307:localhost:3306 user@216.104.47.118
```

This forwards local port 3307 to the server's MySQL port.

## Step 2: Update .env
```env
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=reemresort_admin
MYSQL_PASSWORD=tyrfaz-Jojgij-mirge6
MYSQL_DATABASE=reemresort_hotel_db
```

## Step 3: Keep SSH connection open
Leave the SSH terminal open while developing.

## Step 4: Start your app
```bash
npm run dev
```

Now your app connects to localhost:3307, which tunnels to the remote server.
