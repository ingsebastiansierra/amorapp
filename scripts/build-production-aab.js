#!/usr/bin/env node

/**
 * Script para generar AAB de PRODUCCIÓN para Google Play Store
 * 
 * Este script genera un Android App Bundle (AAB) de producción
 * que es el formato requerido para subir a Google Play Store.
 */

const { execSync } = require('child_process');
const fs = require('fs');

// Colores para la consola
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
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
  log('║   📦 BUILD AAB PRODUCCIÓN - GOOGLE PLAY STORE 📦     ║', 'bright');
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

  // Verificar versión
  const appJson = JSON.parse(fs.readFileSync('app.json', 'utf8'));
  const version = appJson.expo.version;
  const versionCode = appJson.expo.android.versionCode;
  
  log(`\n📱 Versión de la app: ${version}`, 'blue');
  log(`📱 Version Code: ${versionCode}`, 'blue');

  // Información importante sobre AAB
  log('\n📦 ANDROID APP BUNDLE (AAB)', 'magenta');
  log('   ✓ Formato requerido para Google Play Store', 'cyan');
  log('   ✓ Optimizado para cada dispositivo', 'cyan');
  log('   ✓ Tamaño de descarga reducido', 'cyan');
  log('   ✓ Firmado automáticamente por Google Play\n', 'cyan');

  log('⚠️  IMPORTANTE:', 'yellow');
  log('   - Este AAB es SOLO para Google Play Store', 'yellow');
  log('   - NO se puede instalar directamente en dispositivos', 'yellow');
  log('   - Para pruebas, usa el APK de producción\n', 'yellow');

  // Limpiar caché
  log('🧹 Limpiando caché...', 'cyan');
  try {
    execSync('npx expo start --clear', { stdio: 'ignore', timeout: 5000 });
  } catch (e) {
    // Ignorar errores de timeout
  }

  // Iniciar build AAB
  log('\n🏗️  Iniciando build AAB de producción...', 'bright');
  log('   Esto puede tomar varios minutos.\n', 'yellow');

  const buildSuccess = execCommand(
    'npx eas-cli build --platform android --profile production-aab --non-interactive',
    'Build AAB de producción'
  );

  if (!buildSuccess) {
    log('\n❌ El build falló. Revisa los errores arriba.', 'red');
    process.exit(1);
  }

  // Resumen final
  log('\n╔════════════════════════════════════════════════════════╗', 'green');
  log('║         ✅ BUILD AAB DE PRODUCCIÓN EXITOSO ✅         ║', 'green');
  log('╚════════════════════════════════════════════════════════╝\n', 'green');

  log('📦 Tu AAB de producción está listo para Google Play Store', 'bright');
  
  log('\n📥 Para descargar el AAB:', 'cyan');
  log('   1. Ve a: https://expo.dev/accounts/sebasing03/projects/palpitos/builds', 'cyan');
  log('   2. Busca el build AAB más reciente', 'cyan');
  log('   3. Descarga el archivo .aab\n', 'cyan');

  log('📤 Para subir a Google Play Store:', 'blue');
  log('   1. Ve a Google Play Console', 'blue');
  log('   2. Selecciona tu app', 'blue');
  log('   3. Ve a "Producción" > "Crear nueva versión"', 'blue');
  log('   4. Sube el archivo .aab', 'blue');
  log('   5. Completa la información de la versión', 'blue');
  log('   6. Envía para revisión\n', 'blue');

  log('⏱️  Tiempo de revisión de Google Play: 1-7 días', 'yellow');
  log('✨ ¡Listo para publicación!\n', 'green');
}

main().catch(error => {
  log(`\n❌ Error fatal: ${error.message}`, 'red');
  process.exit(1);
});
