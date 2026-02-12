// Botón compacto para adjuntar imágenes en el chat
import React, { useState } from 'react';
import {
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    Alert,
    ActionSheetIOS,
    Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { usePrivateImages } from '../hooks/usePrivateImages';

interface Props {
    toUserId: string;
    onSent?: () => void;
    size?: number;
    color?: string;
}

export function ImageAttachButton({
    toUserId,
    onSent,
    size = 28,
    color = '#007AFF'
}: Props) {
    const [isLoading, setIsLoading] = useState(false);
    const { pickAndSendImage, takeAndSendPhoto } = usePrivateImages();

    const showOptions = () => {
        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: ['Cancelar', 'Tomar foto', 'Elegir de galería'],
                    cancelButtonIndex: 0,
                },
                async (buttonIndex) => {
                    if (buttonIndex === 1) {
                        await handleTakePhoto();
                    } else if (buttonIndex === 2) {
                        await handlePickImage();
                    }
                }
            );
        } else {
            // Android: mostrar Alert
            Alert.alert(
                'Enviar imagen',
                'Selecciona una opción',
                [
                    { text: 'Cancelar', style: 'cancel' },
                    { text: 'Tomar foto', onPress: handleTakePhoto },
                    { text: 'Elegir de galería', onPress: handlePickImage },
                ]
            );
        }
    };

    const handleTakePhoto = async () => {
        try {
            setIsLoading(true);
            await takeAndSendPhoto(toUserId, {
                maxViews: 1, // Ver una vez por defecto
            });
            onSent?.();
        } catch (error) {
            console.error('Error tomando foto:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePickImage = async () => {
        try {
            setIsLoading(true);
            await pickAndSendImage(toUserId, {
                maxViews: 1, // Ver una vez por defecto
            });
            onSent?.();
        } catch (error) {
            console.error('Error seleccionando imagen:', error);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <ActivityIndicator
                size="small"
                color={color}
                style={styles.loader}
            />
        );
    }

    return (
        <TouchableOpacity
            style={styles.button}
            onPress={showOptions}
            activeOpacity={0.7}
        >
            <Ionicons name="image-outline" size={size} color={color} />
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    button: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loader: {
        padding: 8,
    },
});
