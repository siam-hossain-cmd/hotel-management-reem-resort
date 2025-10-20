module.exports = {
  apps: [
    {
      name: 'reem-resort',
      script: './server/index.js',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 4000
      },
      error_file: './logs/err.log',
      out_file: './logs/out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // Restart delay in case of crash
      min_uptime: '10s',
      max_restarts: 10,
      // Time to wait before force restart
      kill_timeout: 5000,
      // Wait for graceful shutdown
      wait_ready: true,
      listen_timeout: 10000
    }
  ],

  deploy: {
    production: {
      user: 'your-server-user',
      host: 'your-server-ip',
      ref: 'origin/main',
      repo: 'git@github.com:yourusername/reem-resort.git',
      path: '/var/www/reem-resort',
      'pre-deploy-local': '',
      'post-deploy': 'npm install && cd server && npm install && cd .. && npm run build && pm2 reload ecosystem.config.cjs --env production',
      'pre-setup': ''
    }
  }
};
