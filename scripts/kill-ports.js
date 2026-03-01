#!/usr/bin/env node

const { execSync } = require('child_process');

console.log('🔍 Buscando procesos de Node y Expo...\n');

try {
    if (process.platform === 'win32') {
        // Windows
        console.log('💻 Sistema: Windows');
        
        // Matar procesos de Node
        try {
            console.log('🔪 Cerrando procesos de Node...');
            execSync('taskkill /F /IM node.exe', { stdio: 'inherit' });
        } catch (e) {
            console.log('ℹ️  No hay procesos de Node activos');
        }

        // Matar procesos de Expo
        try {
            console.log('🔪 Cerrando procesos de Expo...');
            execSync('taskkill /F /IM expo.exe', { stdio: 'inherit' });
        } catch (e) {
            console.log('ℹ️  No hay procesos de Expo activos');
        }

        // Liberar puertos específicos
        const ports = [8081, 19000, 19001, 19002, 19006];
        
        for (const port of ports) {
            try {
                console.log(`🔓 Liberando puerto ${port}...`);
                const output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
                const lines = output.split('\n');
                
                for (const line of lines) {
                    const match = line.match(/LISTENING\s+(\d+)/);
                    if (match) {
                        const pid = match[1];
                        try {
                            execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
                            console.log(`   ✅ Puerto ${port} liberado (PID: ${pid})`);
                        } catch (e) {
                            // Ignorar errores
                        }
                    }
                }
            } catch (e) {
                console.log(`   ℹ️  Puerto ${port} ya está libre`);
            }
        }

    } else {
        // Linux/Mac
        console.log('💻 Sistema: Unix/Linux/Mac');
        
        // Matar procesos de Node
        try {
            console.log('🔪 Cerrando procesos de Node...');
            execSync('pkill -9 node', { stdio: 'inherit' });
        } catch (e) {
            console.log('ℹ️  No hay procesos de Node activos');
        }

        // Liberar puertos específicos
        const ports = [8081, 19000, 19001, 19002, 19006];
        
        for (const port of ports) {
            try {
                console.log(`🔓 Liberando puerto ${port}...`);
                execSync(`lsof -ti:${port} | xargs kill -9`, { stdio: 'inherit' });
                console.log(`   ✅ Puerto ${port} liberado`);
            } catch (e) {
                console.log(`   ℹ️  Puerto ${port} ya está libre`);
            }
        }
    }

    console.log('\n✅ Todos los puertos han sido liberados');
    console.log('🚀 Ahora puedes ejecutar: npm start\n');

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}
