module.exports = {
    apps: [
        {
            name: `vue-client`,
            script: "serve",
            cwd: "./client",
            env: {
                PM2_SERVE_PATH: "./dist",
                PM2_SERVE_PORT: 5173,
                PM2_SERVE_SPA: "true",
                NODE_ENV: 'production',
            },
        },

        {
            name: "node-red",
            script: "npx",
            args: "node-red",
            env: {
                NODE_ENV: "production",
            },
        }
    ],
};



