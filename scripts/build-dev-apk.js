#!/usr/bin/env node

/**
 * Script para compilar APK de desarrollo
 * Optimizado para builds más rápidos
 */

const { execSync } = require('child_process');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

console.log('\n🔨 Compilando APK de desarrollo...\n');

// Configuración
const androidDir = path.join(process.cwd(), 'android');
const apkPath = 'android/app/build/outputs/apk/debug/app-debug.apk';

try {
  log('📦 Paso 1: Limpiando build anterior...', 'blue');
  try {
    process.chdir(androidDir);
    execSync('gradlew clean', { stdio: 'inherit' });
    log('✓ Limpieza completada', 'green');
  } catch (error) {
    log('⚠ No se pudo limpiar (continuando...)', 'yellow');
  }

  log('\n🏗️  Paso 2: Compilando APK...', 'blue');
  log('⏱️  Esto puede tomar 5-10 minutos en la primera compilación', 'cyan');
  log('   Las siguientes compilaciones serán más rápidas', 'cyan');
  
  execSync('gradlew assembleDebug', { 
    stdio: 'inherit',
    cwd: androidDir 
  });

  log('\n✨ APK compilado exitosamente!', 'green');
  log(`\n📍 Ubicación: ${apkPath}`, 'cyan');
  
  log('\n📱 Para instalar en dispositivo:', 'blue');
  log('   1. Conecta tu dispositivo Android', 'reset');
  log('   2. Ejecuta: npm run install:apk', 'reset');
  log('   O manualmente: adb install android/app/build/outputs/apk/debug/app-debug.apk', 'reset');

} catch (error) {
  log('\n✗ Error al compilar APK', 'red');
  log(`  ${error.message}`, 'red');
  process.exit(1);
}
