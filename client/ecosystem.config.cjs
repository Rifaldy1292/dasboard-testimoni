module.exports = {
  apps: [
    {
      name: `vue-client`,
      script: 'serve',
      autorestart: true,
      watch: true,
      // cwd: './client',
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
        NODE_ENV: 'production'
      }
    },

    {
      name: 'express-server',
      script: 'node',
      args: 'app.js',
      cwd: '../server',
      watch: true,
      autorestart: true,
    },
    {
      name: 'node-red',
      script: 'cmd',
      args: '/c node-red',
      watch: false,
      autorestart: true,
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}

// dashboard - machine / client / ecosystem.config.cjs
// dashboard - machine / server

