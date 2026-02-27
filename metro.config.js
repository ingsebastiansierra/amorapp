const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimizaciones para reducir tamaño del bundle
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    compress: {
      // Eliminar console.log en producción
      drop_console: true,
      // Eliminar debugger
      drop_debugger: true,
      // Optimizaciones adicionales
      pure_funcs: ['console.info', 'console.debug', 'console.warn'],
    },
    mangle: {
      // Acortar nombres de variables
      toplevel: true,
    },
    output: {
      // Eliminar comentarios
      comments: false,
      // ASCII only para reducir tamaño
      ascii_only: true,
    },
  },
};

module.exports = config;
