@echo off
echo ========================================
echo Compilando e Instalando App
echo ========================================
echo.

echo Verificando celular conectado...
adb devices
echo.

echo Compilando e instalando (esto toma 5-10 minutos)...
echo.

npx expo run:android --device

pause
