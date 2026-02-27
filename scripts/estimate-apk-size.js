#!/usr/bin/env node

/**
 * Script para estimar el tamaño del APK final
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function getDirectorySize(dirPath) {
  let size = 0;
  try {
    const files = fs.readdirSync(dirPath);
    for (const file of files) {
      const filePath = path.join(dirPath, file);
      const stats = fs.statSync(filePath);
      if (stats.isDirectory()) {
        size += getDirectorySize(filePath);
      } else {
        size += stats.size;
      }
    }
  } catch (error) {
    // Ignorar errores
  }
  return size;
}

function formatSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
}

async function main() {
  log('\n╔═══════════════════════════════════════════════╗', 'cyan');
  log('║   📊 ESTIMACIÓN DE TAMAÑO DEL APK FINAL 📊   ║', 'cyan');
  log('╚═══════════════════════════════════════════════╝\n', 'cyan');

  // Componentes del APK
  const components = {
    'Assets (imágenes, fuentes)': getDirectorySize('assets'),
    'Código JavaScript (app + src)': getDirectorySize('app') + getDirectorySize('src'),
    'Código nativo Android': 2.23 * 1024 * 1024, // 2.23 MB
  };

  // Estimaciones de dependencias
  const dependencies = {
    'React Native Core': 8 * 1024 * 1024, // ~8 MB
    'Expo SDK': 12 * 1024 * 1024, // ~12 MB
    'Supabase Client': 1.5 * 1024 * 1024, // ~1.5 MB
    'React Native Reanimated': 2 * 1024 * 1024, // ~2 MB
    'Expo Router': 1 * 1024 * 1024, // ~1 MB
    'Otras dependencias': 5 * 1024 * 1024, // ~5 MB
  };

  log('📦 COMPONENTES DEL APK:\n', 'yellow');
  
  let totalComponents = 0;
  for (const [name, size] of Object.entries(components)) {
    log(`   ${name.padEnd(35)} ${formatSize(size).padStart(10)}`, 'cyan');
    totalComponents += size;
  }

  log('\n📚 DEPENDENCIAS (estimado):\n', 'yellow');
  
  let totalDeps = 0;
  for (const [name, size] of Object.entries(dependencies)) {
    log(`   ${name.padEnd(35)} ${formatSize(size).padStart(10)}`, 'magenta');
    totalDeps += size;
  }

  const totalUncompressed = totalComponents + totalDeps;
  
  // El APK comprime el contenido, típicamente 40-50% de reducción
  const compressionRatio = 0.55; // 45% de compresión
  const totalCompressed = totalUncompressed * compressionRatio;

  log('\n' + '─'.repeat(50), 'blue');
  log(`   ${'Tamaño sin comprimir:'.padEnd(35)} ${formatSize(totalUncompressed).padStart(10)}`, 'bright');
  log(`   ${'Compresión APK (~45%):'.padEnd(35)} ${'-' + formatSize(totalUncompressed - totalCompressed).padStart(9)}`, 'green');
  log('─'.repeat(50), 'blue');
  log(`   ${'TAMAÑO ESTIMADO DEL APK:'.padEnd(35)} ${formatSize(totalCompressed).padStart(10)}`, 'bright');
  log('─'.repeat(50) + '\n', 'blue');

  // Tamaño en dispositivo (descomprimido + overhead)
  const installedSize = totalUncompressed * 1.2; // 20% overhead
  log(`📱 Tamaño instalado en dispositivo: ${formatSize(installedSize)}`, 'yellow');

  // Comparación con apps similares
  log('\n📊 COMPARACIÓN CON APPS SIMILARES:\n', 'cyan');
  log('   WhatsApp:        ~40-50 MB', 'cyan');
  log('   Telegram:        ~30-40 MB', 'cyan');
  log('   Instagram:       ~50-70 MB', 'cyan');
  log('   Tinder:          ~40-60 MB', 'cyan');
  log(`   Palpitos:        ~${(totalCompressed / (1024 * 1024)).toFixed(0)}-${((totalCompressed * 1.1) / (1024 * 1024)).toFixed(0)} MB ✅`, 'green');

  // Recomendaciones
  log('\n💡 RECOMENDACIONES PARA REDUCIR TAMAÑO:\n', 'yellow');
  
  const assetsSize = components['Assets (imágenes, fuentes)'];
  if (assetsSize > 5 * 1024 * 1024) {
    log('   ⚠️  Assets ocupan ' + formatSize(assetsSize), 'yellow');
    log('   → Comprime las imágenes (usa WebP o reduce calidad)', 'cyan');
    log('   → Reducción potencial: ~5 MB\n', 'green');
  }

  log('   ✓ Usa Hermes engine (ya incluido en Expo)', 'green');
  log('   ✓ Habilita ProGuard para ofuscar código', 'green');
  log('   ✓ Usa App Bundle (AAB) en lugar de APK', 'green');
  log('     → Google Play optimiza el tamaño por dispositivo', 'cyan');
  log('     → Reducción adicional: 15-20%\n', 'cyan');

  // Resumen final
  log('╔═══════════════════════════════════════════════╗', 'green');
  log('║              ✅ ANÁLISIS COMPLETO ✅          ║', 'green');
  log('╚═══════════════════════════════════════════════╝\n', 'green');

  const apkMB = (totalCompressed / (1024 * 1024)).toFixed(1);
  const installedMB = (installedSize / (1024 * 1024)).toFixed(1);

  log(`📦 APK para descargar: ~${apkMB} MB`, 'bright');
  log(`📱 Espacio en dispositivo: ~${installedMB} MB`, 'bright');
  log(`✨ Tamaño competitivo para una app de chat/dating\n`, 'green');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
