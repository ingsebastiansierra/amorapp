@echo off
echo ========================================
echo Instalando App en Celular
echo ========================================
echo.

echo Verificando celular conectado...
adb devices
echo.

echo Compilando e instalando...
echo Esto tomara 5-10 minutos
echo.

npx expo run:android --device

pause
