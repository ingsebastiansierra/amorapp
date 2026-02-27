@echo off
echo ========================================
echo Instalacion Limpia de la App
echo ========================================
echo.

echo IMPORTANTE: Cierra TODAS las terminales y editores antes de continuar
echo Presiona cualquier tecla cuando estes listo...
pause > nul

echo.
echo [1/4] Verificando celular...
adb devices
echo.

echo [2/4] Copiando google-services.json...
copy /Y google-services.json android\app\google-services.json
echo.

echo [3/4] Limpiando cache de Metro...
npx expo start --clear
timeout /t 3 > nul
taskkill /F /IM node.exe 2>nul
echo.

echo [4/4] Compilando e instalando (5-10 minutos)...
echo.
npx expo run:android --device

echo.
echo ========================================
echo Proceso completado
echo ========================================
pause
