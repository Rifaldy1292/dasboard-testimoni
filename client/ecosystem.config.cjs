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
      cwd: '../server'
    },
    // {
    //   name: 'node-red',
    //   script: 'node',
    //   args: 'C:\\Users\\User\\AppData\\Local\\nvm\\v20.18.3\\node_modules\\node-red\\red.js',
    //   watch: true,
    //   autorestart: true,
    //   windowsHide: true,
    //   env: {
    //     NODE_ENV: 'production'
    //   }
    // }
  ]
}

// dashboard - machine / client / ecosystem.config.cjs
// dashboard - machine / server
