const path = require("path");

module.exports = {
  eslint: {
    enable: false
  },
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      webpackConfig.watchOptions = {
        ignored: [
          '**/node_modules/**',
          '**/.git/**',
          '**/build/**',
          '**/dist/**',
        ],
      };
      return webpackConfig;
    },
  },
};
