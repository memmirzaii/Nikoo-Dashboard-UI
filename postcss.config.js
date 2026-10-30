module.exports = {
  plugins: {
    // Tailwind CSS
    tailwindcss: {},
    
    // Autoprefixer for cross-browser compatibility
    autoprefixer: {
      overrideBrowserslist: [
        '> 1%',
        'last 2 versions',
        'not dead',
        'not ie 11',
        'not op_mini all',
      ],
      grid: 'autoplace',
    },
    
    // RTL support for Tailwind
    'postcss-rtl': {
      // Enable RTL processing
      enabled: true,
      // Process all files
      all: true,
      // Don't process node_modules
      exclude: /node_modules/,
    },
    
    // CSS Nano for minification in production
    ...(process.env.NODE_ENV === 'production' ? { cssnano: {} } : {}),
  },
};
