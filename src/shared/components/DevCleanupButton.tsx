// Botón temporal para desarrollo - BORRAR EN PRODUCCIÓN
import React, { useState } from 'react';
import { Pressable, Text, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { deleteAllData } from '@/scripts/deleteAllData';

export function DevCleanupButton() {
    const [isLoading, setIsLoading] = useState(false);

    const handleCleanup = () => {
        Alert.alert(
            '🗑️ Borrar todos los datos',
            '¿Estás seguro? Esto borrará:\n\n• Todos los mensajes\n• Todas las notas de voz\n• Todas las imágenes\n• Historial de emociones',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Borrar todo',
                    style: 'destructive',
                    onPress: async () => {
                        setIsLoading(true);
                        const result = await deleteAllData();
                        setIsLoading(false);

                        if (result.success) {
                            Alert.alert(
                                '✅ Limpieza completada',
                                `Datos restantes:\n` +
                                `• Mensajes: ${result.remaining.messages}\n` +
                                `• Notas de voz: ${result.remaining.voiceNotes}\n` +
                                `• Imágenes: ${result.remaining.images}\n` +
                                `• Archivos de voz: ${result.remaining.voiceFiles}\n` +
                                `• Archivos de imagen: ${result.remaining.imageFiles}`
                            );
                        } else {
                            Alert.alert('Error', 'No se pudo completar la limpieza');
                        }
                    },
                },
            ]
        );
    };

    return (
        <Pressable
            style={styles.button}
            onPress={handleCleanup}
            disabled={isLoading}
        >
            {isLoading ? (
                <ActivityIndicator size="small" color="#FFF" />
            ) : (
                <Text style={styles.text}>🗑️ Limpiar BD</Text>
            )}
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#FF3B30',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 8,
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 120,
    },
    text: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
});
