import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { avatarService } from '@/core/services/avatarService';

interface AvatarPickerProps {
    userId: string;
    currentAvatarUrl: string | null;
    gender?: string;
    onAvatarUpdated: (url: string) => void;
}

export function AvatarPicker({ userId, currentAvatarUrl, gender, onAvatarUpdated }: AvatarPickerProps) {
    const [uploading, setUploading] = useState(false);

    const handlePickImage = async () => {
        try {
            const image = await avatarService.pickImage();
            if (!image) return;

            setUploading(true);

            // Subir imagen
            const { url } = await avatarService.uploadAvatar(userId, image.uri);

            // Actualizar en la base de datos
            await avatarService.updateUserAvatar(userId, url);

            // Notificar al componente padre
            onAvatarUpdated(url);

            Alert.alert('¡Listo!', 'Tu foto de perfil se actualizó correctamente');
        } catch (error) {
            console.error('Error updating avatar:', error);
            Alert.alert('Error', 'No se pudo actualizar la foto de perfil');
        } finally {
            setUploading(false);
        }
    };

    const avatarUrl = avatarService.getAvatarUrl(currentAvatarUrl);

    return (
        <Pressable onPress={handlePickImage} disabled={uploading}>
            <View style={styles.avatarContainer}>
                {avatarUrl ? (
                    <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.avatarEmoji}>
                            {gender === 'female' ? '👩' : '👨'}
                        </Text>
                    </View>
                )}

                {uploading && (
                    <View style={styles.uploadingOverlay}>
                        <ActivityIndicator size="large" color="#FFF" />
                    </View>
                )}

                <View style={styles.editBadge}>
                    <Text style={styles.editIcon}>📷</Text>
                </View>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    avatarContainer: {
        width: 120,
        height: 120,
        borderRadius: 60,
        position: 'relative',
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarEmoji: {
        fontSize: 64,
    },
    uploadingOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    editIcon: {
        fontSize: 18,
    },
});
