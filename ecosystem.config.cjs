module.exports = {
  apps: [
    {
      name: 'oman-sale-api',
      cwd: './apps/api',
      script: 'dist/server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOST: '127.0.0.1',
        PORT: '3600',
        TRUST_PROXY: '1'
      }
    },
    {
      name: 'oman-sale-web',
      cwd: './apps/web',
      script: '../../node_modules/next/dist/bin/next',
      args: 'start -H 127.0.0.1 -p 3601',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        HOSTNAME: '127.0.0.1',
        PORT: '3601'
      }
    },
    {
      name: 'oman-sale-worker',
      cwd: './apps/api',
      script: 'dist/worker.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
