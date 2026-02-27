#!/usr/bin/env node

/**
 * Script para limpiar el proyecto y reducir su tamaño
 * Elimina archivos temporales, cachés y builds antiguos
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function deleteFolder(folderPath) {
  if (fs.existsSync(folderPath)) {
    const stats = fs.statSync(folderPath);
    const sizeMB = (getDirectorySize(folderPath) / (1024 * 1024)).toFixed(2);
    
    try {
      fs.rmSync(folderPath, { recursive: true, force: true });
      log(`  ✓ Eliminado: ${folderPath} (${sizeMB} MB)`, 'green');
      return parseFloat(sizeMB);
    } catch (error) {
      log(`  ✗ Error eliminando: ${folderPath}`, 'red');
      return 0;
    }
  }
  return 0;
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
    // Ignorar errores de permisos
  }
  return size;
}

async function main() {
  log('\n╔════════════════════════════════════════════╗', 'cyan');
  log('║   🧹 LIMPIEZA DE PROYECTO - PALPITOS 🧹   ║', 'cyan');
  log('╚════════════════════════════════════════════╝\n', 'cyan');

  let totalSaved = 0;

  // Limpiar Android
  log('📱 Limpiando archivos de Android...', 'yellow');
  totalSaved += deleteFolder('android/.gradle');
  totalSaved += deleteFolder('android/app/.cxx');
  totalSaved += deleteFolder('android/app/build');
  totalSaved += deleteFolder('android/build');

  // Limpiar Expo
  log('\n📦 Limpiando caché de Expo...', 'yellow');
  totalSaved += deleteFolder('.expo/web');
  totalSaved += deleteFolder('.expo/.cache');

  // Limpiar node_modules caché
  log('\n📚 Limpiando caché de node_modules...', 'yellow');
  totalSaved += deleteFolder('node_modules/.cache');

  // Limpiar archivos temporales
  log('\n🗑️  Limpiando archivos temporales...', 'yellow');
  const tempPatterns = [
    '**/*.log',
    '**/.DS_Store',
    '**/Thumbs.db',
    '**/*.tmp'
  ];

  // Resumen
  log('\n╔════════════════════════════════════════════╗', 'green');
  log('║          ✅ LIMPIEZA COMPLETADA ✅         ║', 'green');
  log('╚════════════════════════════════════════════╝\n', 'green');

  log(`💾 Espacio liberado: ${totalSaved.toFixed(2)} MB`, 'cyan');
  log('✨ Proyecto optimizado para builds más rápidos\n', 'green');
}

main().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
