#!/usr/bin/env node

/**
 * Script para generar build de PRODUCCIÓN
 * 
 * Este script genera un APK de producción listo para distribución
 * usando EAS Build con el perfil de producción configurado.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function execCommand(command, description) {
  log(`\n${description}...`, 'cyan');
  try {
    execSync(command, { stdio: 'inherit' });
    log(`✓ ${description} completado`, 'green');
    return true;
  } catch (error) {
    log(`✗ Error en: ${description}`, 'red');
    return false;
  }
}

async function main() {
  log('\n╔════════════════════════════════════════════════════════╗', 'bright');
  log('║     🚀 BUILD DE PRODUCCIÓN - PALPITOS APP 🚀         ║', 'bright');
  log('╚════════════════════════════════════════════════════════╝\n', 'bright');

  // Verificar archivos críticos
  log('📋 Verificando configuración...', 'yellow');
  
  const requiredFiles = [
    'app.json',
    'eas.json',
    'android/app/google-services.json'
  ];

  for (const file of requiredFiles) {
    if (!fs.existsSync(file)) {
      log(`✗ Archivo requerido no encontrado: ${file}`, 'red');
      process.exit(1);
    }
  }
  log('✓ Todos los archivos requeridos están presentes', 'green');

  // Limpiar proyecto antes del build
  log('\n🧹 Limpiando proyecto para reducir tamaño...', 'yellow');
  try {
    require('./clean-project.js');
  } catch (e) {
    log('⚠️  No se pudo ejecutar limpieza automática', 'yellow');
  }

  // Verificar versión en app.json
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const version = appJson.expo.version;
  const versionCode = appJson.expo.android.versionCode;
  
  log(`\n📱 Versión de la app: ${version}`, 'blue');
  log(`📱 Version Code: ${versionCode}`, 'blue');

  // Confirmar build
  log('\n⚠️  IMPORTANTE: Este es un build de PRODUCCIÓN', 'yellow');
  log('   - Se generará un APK firmado', 'yellow');
  log('   - Listo para distribución', 'yellow');
  log('   - Canal: production\n', 'yellow');

  // Limpiar caché de Expo
  log('\n🧹 Limpiando caché...', 'cyan');
  try {
    execSync('npx expo start --clear', { stdio: 'ignore', timeout: 5000 });
  } catch (e) {
    // Ignorar errores de timeout
  }

  // Iniciar build de producción
  log('\n🏗️  Iniciando build de producción con EAS...', 'bright');
  log('   Esto puede tomar varios minutos.\n', 'yellow');

  const buildSuccess = execCommand(
    'npx eas-cli build --platform android --profile production --non-interactive',
    'Build de producción'
  );

  if (!buildSuccess) {
    log('\n❌ El build falló. Revisa los errores arriba.', 'red');
    process.exit(1);
  }

  // Resumen final
  log('\n╔════════════════════════════════════════════════════════╗', 'green');
  log('║           ✅ BUILD DE PRODUCCIÓN EXITOSO ✅           ║', 'green');
  log('╚════════════════════════════════════════════════════════╝\n', 'green');

  log('📦 Tu APK de producción está listo', 'bright');
  log('\n📥 Para descargar el APK:', 'cyan');
  log('   1. Ve a: https://expo.dev/accounts/sebasing03/projects/palpitos/builds', 'cyan');
  log('   2. Busca el build más reciente', 'cyan');
  log('   3. Descarga el APK\n', 'cyan');

  log('📤 Para subir a Google Play Store:', 'blue');
  log('   - Usa el perfil "production-aab" para generar un AAB', 'blue');
  log('   - Comando: npm run build:production-aab\n', 'blue');

  log('✨ ¡Listo para distribución!\n', 'green');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
