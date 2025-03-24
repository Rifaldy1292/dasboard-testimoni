module.exports = {
  apps: [
    {
      name: `vue-client`,
      script: 'serve',
      cwd: './client',
      env: {
        PM2_SERVE_PATH: './dist',
        PM2_SERVE_PORT: 5173,
        PM2_SERVE_SPA: 'true',
        NODE_ENV: 'production'
      }
    },
    {
      name: 'node-red',
      script: 'node-red',
      args: [],
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
}
