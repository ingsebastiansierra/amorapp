// Pantalla de galería personal con control de visibilidad
import React, { useState, useEffect, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    Image,
    Pressable,
    Alert,
    Modal,
    TextInput,
    ActivityIndicator,
    Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/core/store/useAuthStore';
import { galleryService } from '@/core/services/galleryService';
import { PersonalGalleryImage } from '@/core/types/gallery';
import { supabase } from '@/core/config/supabase';
import * as Haptics from 'expo-haptics';
import { useSmartInterstitialAd } from '@/shared/hooks/useSmartInterstitialAd';
import { SmartGalleryAd } from '@/shared/components/SmartGalleryAd';
import { InterstitialFallbackModal } from '@/shared/components/InterstitialFallbackModal';
import { useRateLimit } from '@/shared/hooks/useRateLimit';
import { sanitizeCaption } from '@/shared/utils/sanitize';

const { width } = Dimensions.get('window');
const ITEM_SIZE = (width - 48) / 2; // 2 columnas con padding

type TabType = 'my-photos' | 'partner-photos';

export function PersonalGalleryScreen() {
    const router = useRouter();
    const user = useAuthStore((state) => state.user);

    const [activeTab, setActiveTab] = useState<TabType>('my-photos');
    const [myPhotos, setMyPhotos] = useState<PersonalGalleryImage[]>([]);
    const [partnerPhotos, setPartnerPhotos] = useState<PersonalGalleryImage[]>([]);
    const [partnerName, setPartnerName] = useState<string>('');
    const [partnerId, setPartnerId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [showUploadModal, setShowUploadModal] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [caption, setCaption] = useState('');
    const [visibility, setVisibility] = useState<'private' | 'visible'>('visible');

    // Modal de vista completa
    const [viewingPhoto, setViewingPhoto] = useState<PersonalGalleryImage | null>(null);
    const [showViewModal, setShowViewModal] = useState(false);

    // Modo de selección
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedPhotos, setSelectedPhotos] = useState<Set<string>>(new Set());

    // Anuncio intersticial (deshabilitado temporalmente)
    const { showAd, isLoaded } = useSmartInterstitialAd();

    // Rate limiting para subida de imágenes
    const { checkLimit: checkUploadLimit } = useRateLimit({
        maxAttempts: 10,
        windowMs: 3600000, // 1 hora
        message: 'Has subido muchas fotos. Espera un momento.'
    });

    useEffect(() => {
        loadData();
    }, [user]);

    const loadData = async () => {
        if (!user) return;

        setLoading(true);
        try {
            // Cargar info de la pareja
            await loadPartnerInfo();

            // Cargar mis fotos
            const photos = await galleryService.getMyPhotos(user.id);
            setMyPhotos(photos);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadPartnerInfo = async () => {
        if (!user) return;

        try {
            const { data: myData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!myData?.couple_id) return;

            const { data: coupleData } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', myData.couple_id)
                .maybeSingle();

            if (!coupleData) return;

            const partnerUserId = coupleData.user1_id === user.id
                ? coupleData.user2_id
                : coupleData.user1_id;

            setPartnerId(partnerUserId);

            // Obtener nombre de la pareja
            const { data: partnerData } = await supabase
                .from('users')
                .select('name')
                .eq('id', partnerUserId)
                .maybeSingle();

            if (partnerData) {
                setPartnerName(partnerData.name);
            }

            // Cargar fotos de la pareja
            const photos = await galleryService.getPartnerPhotos(partnerUserId);
            setPartnerPhotos(photos);
        } catch (error) {
            console.error('Error loading partner:', error);
        }
    };

    const handleTabChange = (tab: TabType) => {
        setActiveTab(tab);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    const handleUploadPress = async () => {
        try {
            // Mostrar anuncio intersticial antes de abrir el selector de imagen
            if (isLoaded) {
                await showAd();
                // Esperar un momento para que el anuncio se cierre
                await new Promise(resolve => setTimeout(resolve, 500));
            }

            const imageUri = await galleryService.pickImage();
            if (imageUri) {
                setSelectedImage(imageUri);
                setShowUploadModal(true);
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        }
    };

    const handleConfirmUpload = async () => {
        if (!user || !selectedImage) return;

        // Verificar rate limit
        if (!checkUploadLimit()) {
            return;
        }

        setUploading(true);
        try {
            // Sanitizar caption
            const cleanCaption = caption.trim() ? sanitizeCaption(caption) : undefined;

            await galleryService.uploadPhoto(user.id, selectedImage, {
                caption: cleanCaption,
                visibility,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('¡Listo!', 'Foto subida correctamente');

            setShowUploadModal(false);
            setSelectedImage(null);
            setCaption('');
            setVisibility('visible');

            // Recargar fotos
            const photos = await galleryService.getMyPhotos(user.id);
            setMyPhotos(photos);
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', 'No se pudo subir la foto');
        } finally {
            setUploading(false);
        }
    };

    const handleToggleVisibility = async (photo: PersonalGalleryImage) => {
        try {
            const newVisibility = photo.visibility === 'visible' ? 'private' : 'visible';
            await galleryService.updateVisibility(photo.id, newVisibility);

            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

            // Actualizar estado local
            setMyPhotos(prev =>
                prev.map(p => p.id === photo.id ? { ...p, visibility: newVisibility } : p)
            );
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la visibilidad');
        }
    };

    const handleDeletePhoto = (photo: PersonalGalleryImage) => {
        Alert.alert(
            'Eliminar foto',
            '¿Estás seguro de que quieres eliminar esta foto?',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Eliminar',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await galleryService.deletePhoto(photo.id, photo.image_path, photo.thumbnail_path);
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

                            // Actualizar estado local
                            setMyPhotos(prev => prev.filter(p => p.id !== photo.id));
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo eliminar la foto');
                        }
                    },
                },
            ]
        );
    };

    const handlePhotoPress = (photo: PersonalGalleryImage) => {
        if (selectionMode && activeTab === 'my-photos') {
            // Modo selección: toggle selección
            const newSelected = new Set(selectedPhotos);
            if (newSelected.has(photo.id)) {
                newSelected.delete(photo.id);
            } else {
                newSelected.add(photo.id);
            }
            setSelectedPhotos(newSelected);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
            // Modo normal: abrir modal
            setViewingPhoto(photo);
            setShowViewModal(true);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const handleLongPress = (photo: PersonalGalleryImage) => {
        if (activeTab === 'my-photos') {
            setSelectionMode(true);
            setSelectedPhotos(new Set([photo.id]));
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const handleCancelSelection = () => {
        setSelectionMode(false);
        setSelectedPhotos(new Set());
    };

    const handleBulkVisibilityChange = async (visibility: 'private' | 'visible') => {
        try {
            const promises = Array.from(selectedPhotos).map(photoId =>
                galleryService.updateVisibility(photoId, visibility)
            );

            await Promise.all(promises);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            // Actualizar estado local
            setMyPhotos(prev =>
                prev.map(p => selectedPhotos.has(p.id) ? { ...p, visibility } : p)
            );

            handleCancelSelection();
        } catch (error) {
            Alert.alert('Error', 'No se pudo actualizar la visibilidad');
        }
    };

    const renderPhotoItem = ({ item }: { item: { type: 'row' | 'ad'; id: string; photos?: PersonalGalleryImage[] } }) => {
        // Si es un anuncio, renderizar Native Ad ocupando todo el ancho
        if (item.type === 'ad') {
            return (
                <View style={styles.adFullWidth}>
                    <SmartGalleryAd />
                </View>
            );
        }

        // Si es una fila de fotos, renderizar las 2 fotos lado a lado
        return (
            <View style={styles.photoRow}>
                {item.photos?.map((photo) => {
                    const imageUrl = galleryService.getImageUrl(photo.thumbnail_path || photo.image_path);
                    const isMyPhoto = activeTab === 'my-photos';
                    const isSelected = selectedPhotos.has(photo.id);

                    return (
                        <Pressable
                            key={photo.id}
                            style={[
                                styles.photoItem,
                                isSelected && styles.photoItemSelected,
                            ]}
                            onPress={() => handlePhotoPress(photo)}
                            onLongPress={() => handleLongPress(photo)}
                        >
                            <Image source={{ uri: imageUrl }} style={styles.photoImage} />

                            {/* Overlay de selección */}
                            {isSelected && (
                                <View style={styles.selectionOverlay}>
                                    <View style={styles.checkmark}>
                                        <Ionicons name="checkmark" size={20} color="#FFF" />
                                    </View>
                                </View>
                            )}

                            {/* Indicador de selección en modo selección */}
                            {selectionMode && isMyPhoto && !isSelected && (
                                <View style={styles.selectionIndicator}>
                                    <View style={styles.emptyCheckmark} />
                                </View>
                            )}

                            {/* Badge de visibilidad */}
                            <View style={styles.photoBadge}>
                                {isMyPhoto ? (
                                    <Pressable
                                        style={[
                                            styles.visibilityBadge,
                                            photo.visibility === 'visible' ? styles.visibleBadge : styles.privateBadge,
                                        ]}
                                        onPress={() => handleToggleVisibility(photo)}
                                    >
                                        {photo.visibility === 'visible' ? (
                                            <Ionicons name="heart" size={16} color="#FFF" />
                                        ) : (
                                            <Ionicons name="lock-closed" size={16} color="#FFF" />
                                        )}
                                    </Pressable>
                                ) : null}
                            </View>

                            {/* Label de estado */}
                            <View style={styles.photoLabel}>
                                <Text style={styles.photoLabelText}>
                                    {isMyPhoto
                                        ? photo.visibility === 'visible'
                                            ? 'VISIBLE'
                                            : 'SOLO YO'
                                        : 'VISIBLE'}
                                </Text>
                            </View>

                            {/* Botón de eliminar (solo en mis fotos) */}
                            {isMyPhoto && (
                                <Pressable
                                    style={styles.deleteButton}
                                    onPress={() => handleDeletePhoto(photo)}
                                >
                                    <Ionicons name="trash" size={16} color="#FFF" />
                                </Pressable>
                            )}
                        </Pressable>
                    );
                })}
            </View>
        );
    };

    const currentPhotos = activeTab === 'my-photos' ? myPhotos : partnerPhotos;
    const photoCount = currentPhotos.length;

    // Agrupar fotos en filas de 2 + insertar anuncios
    const photosWithAds = useMemo(() => {
        if (currentPhotos.length === 0) return [];

        const result: Array<{ type: 'row' | 'ad'; id: string; photos?: PersonalGalleryImage[] }> = [];

        for (let i = 0; i < currentPhotos.length; i += 2) {
            // Agregar fila de 2 fotos
            const rowPhotos = currentPhotos.slice(i, i + 2);
            result.push({
                type: 'row',
                id: `row-${i}`,
                photos: rowPhotos
            });

            // Insertar anuncio cada 3 filas (6 fotos)
            if ((i + 2) % 6 === 0 && i < currentPhotos.length - 2) {
                result.push({
                    type: 'ad',
                    id: `ad-${i}`
                });
            }
        }

        return result;
    }, [currentPhotos]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                {selectionMode ? (
                    <>
                        <Pressable style={styles.backButton} onPress={handleCancelSelection}>
                            <Ionicons name="close" size={24} color="#2D3748" />
                        </Pressable>
                        <Text style={styles.headerTitle}>
                            {selectedPhotos.size} seleccionada{selectedPhotos.size !== 1 ? 's' : ''}
                        </Text>
                        <View style={styles.menuButton} />
                    </>
                ) : (
                    <>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Ionicons name="arrow-back" size={24} color="#2D3748" />
                        </Pressable>
                        <Text style={styles.headerTitle}>Galería Privada</Text>
                        {activeTab === 'my-photos' && myPhotos.length > 0 && (
                            <Pressable
                                style={styles.selectButton}
                                onPress={() => {
                                    setSelectionMode(true);
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                }}
                            >
                                <Ionicons name="checkmark-circle-outline" size={24} color="#667eea" />
                            </Pressable>
                        )}
                    </>
                )}
            </View>

            {/* Barra de acciones de selección */}
            {selectionMode && selectedPhotos.size > 0 && (
                <View style={styles.selectionBar}>
                    <Pressable
                        style={styles.selectionAction}
                        onPress={() => handleBulkVisibilityChange('visible')}
                    >
                        <Ionicons name="heart" size={20} color="#FFF" />
                        <Text style={styles.selectionActionText}>Hacer visible</Text>
                    </Pressable>
                    <Pressable
                        style={styles.selectionAction}
                        onPress={() => handleBulkVisibilityChange('private')}
                    >
                        <Ionicons name="lock-closed" size={20} color="#FFF" />
                        <Text style={styles.selectionActionText}>Hacer privada</Text>
                    </Pressable>
                </View>
            )}

            {/* Tabs */}
            <View style={styles.tabs}>
                <Pressable
                    style={[styles.tab, activeTab === 'my-photos' && styles.activeTab]}
                    onPress={() => handleTabChange('my-photos')}
                >
                    <Text style={[styles.tabText, activeTab === 'my-photos' && styles.activeTabText]}>
                        Mis Fotos
                    </Text>
                </Pressable>
                <Pressable
                    style={[styles.tab, activeTab === 'partner-photos' && styles.activeTab]}
                    onPress={() => handleTabChange('partner-photos')}
                >
                    <Text style={[styles.tabText, activeTab === 'partner-photos' && styles.activeTabText]}>
                        Fotos de {partnerName || 'Pareja'}
                    </Text>
                </Pressable>
            </View>

            {/* Upload Button */}
            {activeTab === 'my-photos' && (
                <Pressable style={styles.uploadButton} onPress={handleUploadPress}>
                    <LinearGradient
                        colors={['#FF6B9D', '#F06292']}
                        style={styles.uploadButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                    >
                        <Ionicons name="camera" size={20} color="#FFF" />
                        <Text style={styles.uploadButtonText}>Subir Nueva Foto</Text>
                    </LinearGradient>
                </Pressable>
            )}

            {/* Photo Count */}
            <View style={styles.countContainer}>
                <Text style={styles.countLabel}>RECIENTES</Text>
                <Text style={styles.countNumber}>{photoCount} Fotos</Text>
            </View>

            {/* Photos Grid */}
            {loading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#FF6B9D" />
                </View>
            ) : (
                <FlatList
                    data={photosWithAds}
                    renderItem={renderPhotoItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={styles.gridContent}
                    ListEmptyComponent={
                        <View style={styles.emptyContainer}>
                            <Ionicons name="images-outline" size={64} color="#CCC" />
                            <Text style={styles.emptyText}>
                                {activeTab === 'my-photos'
                                    ? 'No tienes fotos aún'
                                    : `${partnerName || 'Tu pareja'} no ha compartido fotos`}
                            </Text>
                        </View>
                    }
                />
            )}

            {/* Info Banner */}
            {activeTab === 'my-photos' && myPhotos.some(p => p.visibility === 'private') && (
                <View style={styles.infoBanner}>
                    <Ionicons name="information-circle" size={20} color="#667eea" />
                    <Text style={styles.infoBannerText}>
                        Las fotos marcadas como "Solo yo" no pueden ser vistas por tu pareja. Cambia el estado en los ajustes de cada foto.
                    </Text>
                </View>
            )}

            {/* View Photo Modal */}
            <Modal
                visible={showViewModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowViewModal(false)}
            >
                <Pressable
                    style={styles.viewModalOverlay}
                    onPress={() => setShowViewModal(false)}
                >
                    <View style={styles.viewModalContent}>
                        {viewingPhoto && (
                            <>
                                <Image
                                    source={{ uri: galleryService.getImageUrl(viewingPhoto.image_path) }}
                                    style={styles.fullImage}
                                    resizeMode="contain"
                                />

                                {viewingPhoto.caption && (
                                    <View style={styles.captionContainer}>
                                        <View style={styles.captionHeader}>
                                            <Ionicons name="chatbubble-ellipses" size={16} color="#667eea" />
                                            <Text style={styles.captionLabel}>Descripción</Text>
                                        </View>
                                        <Text style={styles.captionText}>{viewingPhoto.caption}</Text>
                                    </View>
                                )}

                                <Pressable
                                    style={styles.closeButton}
                                    onPress={() => setShowViewModal(false)}
                                >
                                    <Ionicons name="close" size={28} color="#FFF" />
                                </Pressable>

                                {activeTab === 'my-photos' && (
                                    <View style={styles.viewModalActions}>
                                        <Pressable
                                            style={styles.viewModalButton}
                                            onPress={() => {
                                                setShowViewModal(false);
                                                handleToggleVisibility(viewingPhoto);
                                            }}
                                        >
                                            <Ionicons
                                                name={viewingPhoto.visibility === 'visible' ? 'heart' : 'lock-closed'}
                                                size={20}
                                                color="#FFF"
                                            />
                                            <Text style={styles.viewModalButtonText}>
                                                {viewingPhoto.visibility === 'visible' ? 'Hacer privada' : 'Hacer visible'}
                                            </Text>
                                        </Pressable>

                                        <Pressable
                                            style={[styles.viewModalButton, styles.deleteModalButton]}
                                            onPress={() => {
                                                setShowViewModal(false);
                                                handleDeletePhoto(viewingPhoto);
                                            }}
                                        >
                                            <Ionicons name="trash" size={20} color="#FFF" />
                                            <Text style={styles.viewModalButtonText}>Eliminar</Text>
                                        </Pressable>
                                    </View>
                                )}
                            </>
                        )}
                    </View>
                </Pressable>
            </Modal>

            {/* Upload Modal */}
            <Modal
                visible={showUploadModal}
                transparent
                animationType="fade"
                onRequestClose={() => setShowUploadModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => !uploading && setShowUploadModal(false)}
                >
                    <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
                        <Text style={styles.modalTitle}>Subir Foto</Text>

                        {selectedImage && (
                            <Image source={{ uri: selectedImage }} style={styles.previewImage} />
                        )}

                        <TextInput
                            style={styles.captionInput}
                            placeholder="Añade una descripción (opcional)"
                            placeholderTextColor="#999"
                            value={caption}
                            onChangeText={setCaption}
                            maxLength={500}
                            multiline
                        />

                        <View style={styles.visibilityOptions}>
                            <Text style={styles.visibilityLabel}>Visibilidad:</Text>
                            <View style={styles.visibilityButtons}>
                                <Pressable
                                    style={[
                                        styles.visibilityOption,
                                        visibility === 'visible' && styles.visibilityOptionActive,
                                    ]}
                                    onPress={() => setVisibility('visible')}
                                >
                                    <Ionicons
                                        name="heart"
                                        size={20}
                                        color={visibility === 'visible' ? '#FFF' : '#FF6B9D'}
                                    />
                                    <Text
                                        style={[
                                            styles.visibilityOptionText,
                                            visibility === 'visible' && styles.visibilityOptionTextActive,
                                        ]}
                                    >
                                        Visible
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.visibilityOption,
                                        visibility === 'private' && styles.visibilityOptionActive,
                                    ]}
                                    onPress={() => setVisibility('private')}
                                >
                                    <Ionicons
                                        name="lock-closed"
                                        size={20}
                                        color={visibility === 'private' ? '#FFF' : '#666'}
                                    />
                                    <Text
                                        style={[
                                            styles.visibilityOptionText,
                                            visibility === 'private' && styles.visibilityOptionTextActive,
                                        ]}
                                    >
                                        Solo yo
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        <Pressable
                            style={[styles.confirmButton, uploading && styles.buttonDisabled]}
                            onPress={handleConfirmUpload}
                            disabled={uploading}
                        >
                            <LinearGradient
                                colors={['#FF6B9D', '#F06292']}
                                style={styles.confirmButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                {uploading ? (
                                    <ActivityIndicator color="#FFF" />
                                ) : (
                                    <Text style={styles.confirmButtonText}>Subir Foto</Text>
                                )}
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            style={styles.cancelButton}
                            onPress={() => !uploading && setShowUploadModal(false)}
                        >
                            <Text style={styles.cancelButtonText}>Cancelar</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>

            {/* Fallback Modal para anuncios intersticiales - DESHABILITADO */}
            {/* <InterstitialFallbackModal
                visible={false}
                onClose={() => {}}
            /> */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingTop: 50,
        paddingBottom: 16,
        backgroundColor: '#FFF',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    menuButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabs: {
        flexDirection: 'row',
        backgroundColor: '#FFF',
        paddingHorizontal: 16,
        paddingBottom: 16,
        gap: 12,
    },
    tab: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        alignItems: 'center',
    },
    activeTab: {
        backgroundColor: '#FFE4EC',
    },
    tabText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    activeTabText: {
        color: '#FF6B9D',
    },
    uploadButton: {
        marginHorizontal: 16,
        marginTop: 16,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    uploadButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    uploadButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    countContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 16,
    },
    countLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#999',
        letterSpacing: 0.5,
    },
    countNumber: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B9D',
    },
    gridContent: {
        paddingHorizontal: 16,
        paddingBottom: 100,
    },
    photoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
        paddingHorizontal: 16,
    },
    adFullWidth: {
        width: '100%',
        marginBottom: 16,
    },
    gridRow: {
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    photoItem: {
        width: ITEM_SIZE,
        height: ITEM_SIZE,
        borderRadius: 16,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        position: 'relative',
    },
    photoImage: {
        width: '100%',
        height: '100%',
    },
    photoBadge: {
        position: 'absolute',
        bottom: 8,
        right: 8,
    },
    visibilityBadge: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    visibleBadge: {
        backgroundColor: '#FF6B9D',
    },
    privateBadge: {
        backgroundColor: '#666',
    },
    photoLabel: {
        position: 'absolute',
        bottom: 8,
        left: 8,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    photoLabelText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    deleteButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        color: '#999',
        marginTop: 16,
        textAlign: 'center',
    },
    infoBanner: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        backgroundColor: '#e8ebff',
        padding: 16,
        gap: 12,
    },
    infoBannerText: {
        flex: 1,
        fontSize: 12,
        color: '#667eea',
        lineHeight: 18,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 16,
        textAlign: 'center',
    },
    previewImage: {
        width: '100%',
        height: 200,
        borderRadius: 12,
        marginBottom: 16,
    },
    captionInput: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 12,
        fontSize: 15,
        color: '#2D3748',
        marginBottom: 16,
        minHeight: 80,
        textAlignVertical: 'top',
    },
    visibilityOptions: {
        marginBottom: 20,
    },
    visibilityLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    visibilityButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    visibilityOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        backgroundColor: '#FFF',
        gap: 8,
    },
    visibilityOptionActive: {
        borderColor: '#FF6B9D',
        backgroundColor: '#FF6B9D',
    },
    visibilityOptionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#666',
    },
    visibilityOptionTextActive: {
        color: '#FFF',
    },
    confirmButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    confirmButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    cancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    cancelButtonText: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
    // Estilos del modal de vista completa
    viewModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewModalContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },
    fullImage: {
        width: '100%',
        height: '80%',
    },
    captionContainer: {
        position: 'absolute',
        bottom: 100,
        left: 20,
        right: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        padding: 16,
        borderRadius: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    captionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        gap: 6,
    },
    captionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#667eea',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    captionText: {
        fontSize: 15,
        color: '#2D3748',
        lineHeight: 22,
    },
    closeButton: {
        position: 'absolute',
        top: 50,
        right: 20,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    viewModalActions: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        flexDirection: 'row',
        gap: 12,
    },
    viewModalButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(102, 126, 234, 0.9)',
        paddingVertical: 14,
        borderRadius: 12,
        gap: 8,
    },
    deleteModalButton: {
        backgroundColor: 'rgba(239, 68, 68, 0.9)',
    },
    viewModalButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
    // Estilos de selección
    photoItemSelected: {
        borderWidth: 3,
        borderColor: '#667eea',
    },
    selectionOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(102, 126, 234, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    checkmark: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
    },
    selectionIndicator: {
        position: 'absolute',
        top: 8,
        right: 8,
    },
    emptyCheckmark: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#FFF',
        backgroundColor: 'rgba(0, 0, 0, 0.3)',
    },
    selectionBar: {
        flexDirection: 'row',
        backgroundColor: '#667eea',
        paddingHorizontal: 16,
        paddingVertical: 12,
        gap: 12,
    },
    selectionAction: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 8,
    },
    selectionActionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFF',
    },
});
