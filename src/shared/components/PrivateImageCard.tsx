// Componente para mostrar una imagen privada pendiente
import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    Image,
    ActivityIndicator,
    Dimensions,
    Alert,
} from 'react-native';
import * as ScreenCapture from 'expo-screen-capture';
import { PrivateImage } from '@/core/types/media';
import { mediaService } from '@/core/services/mediaService';
import { usePrivateImages } from '../hooks/usePrivateImages';

interface Props {
    image: PrivateImage;
}

const { width, height } = Dimensions.get('window');

export function PrivateImageCard({ image }: Props) {
    const [isViewing, setIsViewing] = useState(false);
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { viewImage, loadPendingImages } = usePrivateImages();

    // Bloquear capturas de pantalla cuando se está viendo la imagen
    useEffect(() => {
        if (isViewing) {
            // Activar protección contra capturas
            ScreenCapture.preventScreenCaptureAsync();

            return () => {
                // Desactivar protección al cerrar
                ScreenCapture.allowScreenCaptureAsync();
            };
        }
    }, [isViewing]);

    const handleView = async () => {
        if (image.is_expired) {
            Alert.alert('No disponible', 'Esta imagen ya no está disponible');
            return;
        }

        try {
            setIsLoading(true);

            // Obtener URL firmada
            const url = await mediaService.getImageUrl(image.storage_path);
            setImageUrl(url);
            setIsViewing(true);

            // NO marcar como vista aquí, esperar a que cierre el modal
        } catch (error) {
            console.error('Error al ver imagen:', error);
            Alert.alert('Error', 'No se pudo cargar la imagen');
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = async () => {
        try {
            // Marcar como vista AHORA que está cerrando
            await viewImage(image.id);

            setIsViewing(false);
            setImageUrl(null);

            // Si es de una sola vista, eliminar la imagen
            if (image.max_views === 1) {
                try {
                    await mediaService.deleteImage(image.id, image.storage_path);
                    console.log('✅ Imagen eliminada de storage y BD');
                } catch (error) {
                    console.error('❌ Error al eliminar imagen:', error);
                }
            }

            // Recargar la lista para reflejar cambios
            await loadPendingImages();
        } catch (error) {
            console.error('Error al cerrar imagen:', error);
            setIsViewing(false);
            setImageUrl(null);
        }
    };

    const getViewText = () => {
        if (image.max_views === 1) {
            return '👁️ Ver una vez';
        }
        if (image.max_views === null) {
            return '👁️ Ver ilimitado';
        }
        return `👁️ Ver hasta ${image.max_views} veces`;
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'Ahora';
        if (minutes < 60) return `Hace ${minutes}m`;
        if (hours < 24) return `Hace ${hours}h`;
        return `Hace ${days}d`;
    };

    return (
        <>
            <TouchableOpacity
                style={styles.card}
                onPress={handleView}
                disabled={isLoading}
                activeOpacity={0.7}
            >
                <View style={styles.iconContainer}>
                    <Text style={styles.icon}>📸</Text>
                </View>

                <View style={styles.content}>
                    <Text style={styles.title}>Nueva imagen privada</Text>

                    {image.caption && (
                        <Text style={styles.caption} numberOfLines={2}>
                            {image.caption}
                        </Text>
                    )}

                    <View style={styles.footer}>
                        <Text style={styles.viewInfo}>{getViewText()}</Text>
                        <Text style={styles.time}>{formatTime(image.created_at)}</Text>
                    </View>
                </View>

                {isLoading && (
                    <ActivityIndicator size="small" color="#007AFF" style={styles.loader} />
                )}
            </TouchableOpacity>

            {/* Modal para ver la imagen */}
            <Modal
                visible={isViewing}
                transparent={false}
                animationType="fade"
                onRequestClose={handleClose}
            >
                <View style={styles.modalContainer}>
                    {imageUrl && (
                        <Image
                            source={{ uri: imageUrl }}
                            style={styles.fullImage}
                            resizeMode="contain"
                        />
                    )}

                    {image.caption && (
                        <View style={styles.captionOverlay}>
                            <Text style={styles.captionText}>{image.caption}</Text>
                        </View>
                    )}

                    <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>

                    {image.max_views === 1 && (
                        <View style={styles.warningOverlay}>
                            <Text style={styles.warningText}>
                                🔥 Esta imagen se autodestruirá al cerrar
                            </Text>
                        </View>
                    )}

                    <View style={styles.protectionOverlay}>
                        <Text style={styles.protectionText}>🔒 Capturas bloqueadas</Text>
                    </View>
                </View>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderRadius: 16,
        padding: 16,
        marginHorizontal: 16,
        marginVertical: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    icon: {
        fontSize: 32,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
    },
    title: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 4,
    },
    caption: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    viewInfo: {
        fontSize: 12,
        color: '#007AFF',
        fontWeight: '500',
    },
    time: {
        fontSize: 12,
        color: '#999',
    },
    loader: {
        marginLeft: 8,
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: width,
        height: height,
    },
    captionOverlay: {
        position: 'absolute',
        bottom: 80,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: 16,
        borderRadius: 12,
    },
    captionText: {
        color: '#FFF',
        fontSize: 16,
        textAlign: 'center',
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: {
        color: '#FFF',
        fontSize: 24,
        fontWeight: '300',
    },
    warningOverlay: {
        position: 'absolute',
        top: 50,
        left: 20,
        right: 80,
        backgroundColor: 'rgba(255, 59, 48, 0.9)',
        padding: 12,
        borderRadius: 12,
    },
    warningText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
        textAlign: 'center',
    },
    protectionOverlay: {
        position: 'absolute',
        bottom: 50,
        alignSelf: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
    },
    protectionText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '500',
    },
});
