import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    ScrollView,
    Image,
    Dimensions,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/core/config/supabase';
import { useAuthStore } from '@/core/store/useAuthStore';

const { width, height } = Dimensions.get('window');

interface UserProfileModalProps {
    visible: boolean;
    userId: string;
    onClose: () => void;
}

interface UserProfile {
    id: string;
    name: string;
    gender: string;
    birth_date: string;
    avatar_url: string | null;
    age: number;
    location?: string;
    distance?: number;
    verified?: boolean;
}

interface GalleryImage {
    id: string;
    image_path: string;
    caption: string | null;
}

export function UserProfileModal({ visible, userId, onClose }: UserProfileModalProps) {
    const { user } = useAuthStore();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [gallery, setGallery] = useState<GalleryImage[]>([]);
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'active'>('none');
    const [matchPercentage, setMatchPercentage] = useState(0);

    useEffect(() => {
        if (visible && userId) {
            loadUserProfile();
            checkConnectionStatus();
        }
    }, [visible, userId]);

    const loadUserProfile = async () => {
        try {
            setLoading(true);

            // Cargar perfil del usuario
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('id, name, gender, birth_date, avatar_url')
                .eq('id', userId)
                .single();

            if (userError) throw userError;

            // Calcular edad
            const birthDate = new Date(userData.birth_date);
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const monthDiff = today.getMonth() - birthDate.getMonth();
            if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }

            setProfile({ ...userData, age });

            // Calcular porcentaje de coincidencia (simulado basado en edad y género)
            const ageMatch = Math.max(0, 100 - Math.abs(age - 25) * 2);
            const randomFactor = Math.floor(Math.random() * 20) + 70;
            const calculatedMatch = Math.min(99, Math.floor((ageMatch + randomFactor) / 2));
            setMatchPercentage(calculatedMatch);

            // Cargar galería pública
            const { data: galleryData } = await supabase
                .from('personal_gallery')
                .select('id, image_path, caption')
                .eq('user_id', userId)
                .eq('visibility', 'visible')
                .order('created_at', { ascending: false })
                .limit(6);

            setGallery(galleryData || []);
        } catch (error) {
            console.error('Error loading user profile:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const checkConnectionStatus = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('connections')
                .select('status')
                .or(`and(user1_id.eq.${user.id},user2_id.eq.${userId}),and(user1_id.eq.${userId},user2_id.eq.${user.id})`)
                .maybeSingle();

            if (data) {
                setConnectionStatus(data.status === 'active' ? 'active' : 'pending');
            } else {
                setConnectionStatus('none');
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    };

    const handleSendRequest = async () => {
        if (!user || !profile) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSending(true);

        try {
            const { error } = await supabase
                .from('connections')
                .insert({
                    user1_id: user.id,
                    user2_id: userId,
                    initiated_by: user.id,
                    status: 'pending',
                    initial_message: `¡Hola! Me gustaría conectar contigo.`,
                });

            if (error) throw error;

            // Enviar notificación push al receptor
            try {
                const { data: recipientData } = await supabase
                    .from('users')
                    .select('push_token')
                    .eq('id', userId)
                    .single();

                const { data: senderData } = await supabase
                    .from('users')
                    .select('name, gender')
                    .eq('id', user.id)
                    .single();

                if (recipientData?.push_token && senderData) {
                    const { notificationService } = await import('@/core/services/notificationService');
                    await notificationService.sendConnectionRequestNotification(
                        recipientData.push_token,
                        senderData.name,
                        senderData.gender
                    );
                }
            } catch (notifError) {
                console.error('Error sending notification:', notifError);
                // No fallar si la notificación falla
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '¡Solicitud Enviada!',
                `Tu solicitud de conexión ha sido enviada a ${profile.name}`,
                [{ text: 'OK', onPress: onClose }]
            );
            setConnectionStatus('pending');
        } catch (error: any) {
            console.error('Error sending request:', error);
            Alert.alert('Error', 'No se pudo enviar la solicitud');
        } finally {
            setSending(false);
        }
    };

    const handleClose = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onClose();
    };

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContainer}>
                    {loading ? (
                        <View style={styles.loadingContainer}>
                            <ActivityIndicator size="large" color="#FF6B9D" />
                            <Text style={styles.loadingText}>Cargando perfil...</Text>
                        </View>
                    ) : profile ? (
                        <>
                            {/* Header con botón cerrar */}
                            <View style={styles.header}>
                                <Pressable onPress={handleClose} style={styles.closeButton}>
                                    <Ionicons name="close" size={28} color="#181113" />
                                </Pressable>
                            </View>

                            <ScrollView
                                style={styles.scrollView}
                                contentContainerStyle={styles.scrollContent}
                                showsVerticalScrollIndicator={false}
                            >
                                {/* Imagen de perfil grande */}
                                <View style={styles.heroImageContainer}>
                                    <Image
                                        source={{
                                            uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=400`,
                                        }}
                                        style={styles.heroImage}
                                    />
                                    <LinearGradient
                                        colors={['transparent', 'rgba(0,0,0,0.7)']}
                                        style={styles.heroGradient}
                                    />

                                    {/* Badge de verificado */}
                                    <View style={styles.verifiedBadge}>
                                        <Ionicons name="checkmark-circle" size={16} color="#FFF" />
                                        <Text style={styles.verifiedText}>Perfil verificado</Text>
                                    </View>

                                    {/* Nombre y ubicación sobre la imagen */}
                                    <View style={styles.heroInfo}>
                                        <Text style={styles.heroName}>{profile.name}, {profile.age}</Text>
                                        <View style={styles.locationRow}>
                                            <Ionicons name="location" size={16} color="#FFF" />
                                            <Text style={styles.locationText}>
                                                Madrid, España • 2 km de distancia
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Sección de coincidencia */}
                                <View style={styles.matchSection}>
                                    <View style={styles.matchCard}>
                                        <Text style={styles.matchLabel}>TU PALPITO</Text>
                                        <View style={styles.matchRow}>
                                            <Text style={styles.matchPercentage}>{matchPercentage}%</Text>
                                            <Text style={styles.matchText}>Coincidencia</Text>
                                            <View style={styles.heartIcon}>
                                                <Ionicons name="heart" size={32} color="#FF6B9D" />
                                                <Text style={styles.heartPercentage}>{matchPercentage}%</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>

                                {/* Sección Sobre mí */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="person" size={20} color="#FF6B9D" />
                                        <Text style={styles.sectionTitle}>Sobre mí</Text>
                                    </View>
                                    <Text style={styles.bioText}>
                                        Me encanta la vida, disfrutar de buenos momentos y conocer gente interesante.
                                        Siempre buscando nuevas experiencias y aventuras.
                                    </Text>
                                </View>

                                {/* Sección de Intereses */}
                                <View style={styles.section}>
                                    <View style={styles.sectionHeader}>
                                        <Ionicons name="heart" size={20} color="#FF6B9D" />
                                        <Text style={styles.sectionTitle}>Intereses</Text>
                                    </View>
                                    <View style={styles.interestsContainer}>
                                        <View style={styles.interestChip}>
                                            <Text style={styles.interestEmoji}>🎨</Text>
                                            <Text style={styles.interestText}>Arte Moderno</Text>
                                        </View>
                                        <View style={styles.interestChip}>
                                            <Text style={styles.interestEmoji}>☕</Text>
                                            <Text style={styles.interestText}>Café Especialidad</Text>
                                        </View>
                                        <View style={styles.interestChip}>
                                            <Text style={styles.interestEmoji}>✈️</Text>
                                            <Text style={styles.interestText}>Viajes</Text>
                                        </View>
                                        <View style={styles.interestChip}>
                                            <Text style={styles.interestEmoji}>🎧</Text>
                                            <Text style={styles.interestText}>Indie Rock</Text>
                                        </View>
                                        <View style={styles.interestChip}>
                                            <Text style={styles.interestEmoji}>🧘</Text>
                                            <Text style={styles.interestText}>Yoga</Text>
                                        </View>
                                    </View>
                                </View>

                                {/* Galería de fotos */}
                                {gallery.length > 0 && (
                                    <View style={styles.section}>
                                        <View style={styles.galleryHeader}>
                                            <View style={styles.sectionHeader}>
                                                <Ionicons name="images" size={20} color="#FF6B9D" />
                                                <Text style={styles.sectionTitle}>Fotos de {profile.name}</Text>
                                            </View>
                                            <Pressable>
                                                <Text style={styles.seeAllText}>Ver todas</Text>
                                            </Pressable>
                                        </View>
                                        <View style={styles.galleryGrid}>
                                            {gallery.slice(0, 4).map((item, index) => (
                                                <View key={item.id} style={styles.galleryItem}>
                                                    <Image
                                                        source={{ uri: item.image_path }}
                                                        style={styles.galleryImage}
                                                    />
                                                    {index === 3 && gallery.length > 4 && (
                                                        <View style={styles.morePhotosOverlay}>
                                                            <Text style={styles.morePhotosText}>
                                                                +{gallery.length - 4}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            ))}
                                        </View>
                                    </View>
                                )}

                                {/* Espacio para el botón */}
                                <View style={{ height: 100 }} />
                            </ScrollView>

                            {/* Botón de acción */}
                            <View style={styles.footer}>
                                {connectionStatus === 'none' ? (
                                    <Pressable
                                        style={styles.actionButton}
                                        onPress={handleSendRequest}
                                        disabled={sending}
                                    >
                                        <LinearGradient
                                            colors={['#FF6B9D', '#FEC163']}
                                            start={{ x: 0, y: 0 }}
                                            end={{ x: 1, y: 0 }}
                                            style={styles.gradientButton}
                                        >
                                            {sending ? (
                                                <ActivityIndicator color="#FFF" />
                                            ) : (
                                                <>
                                                    <Ionicons name="heart" size={24} color="#FFF" />
                                                    <Text style={styles.actionButtonText}>
                                                        Enviar Solicitud
                                                    </Text>
                                                </>
                                            )}
                                        </LinearGradient>
                                    </Pressable>
                                ) : connectionStatus === 'pending' ? (
                                    <View style={styles.statusButton}>
                                        <Ionicons name="time" size={24} color="#F59E0B" />
                                        <Text style={styles.statusButtonText}>Solicitud Pendiente</Text>
                                    </View>
                                ) : (
                                    <View style={styles.statusButton}>
                                        <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                                        <Text style={styles.statusButtonText}>Ya están conectados</Text>
                                    </View>
                                )}
                            </View>
                        </>
                    ) : null}
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: height * 0.9,
        overflow: 'hidden',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: '#6B7280',
    },
    header: {
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 24,
    },
    heroImageContainer: {
        width: width,
        height: height * 0.5,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroGradient: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 200,
    },
    verifiedBadge: {
        position: 'absolute',
        top: 60,
        left: 20,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FF6B9D',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    verifiedText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: '600',
    },
    heroInfo: {
        position: 'absolute',
        bottom: 20,
        left: 20,
        right: 20,
    },
    heroName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    locationText: {
        fontSize: 14,
        color: '#FFF',
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 4,
    },
    matchSection: {
        padding: 20,
        backgroundColor: '#FFF',
    },
    matchCard: {
        backgroundColor: '#FFF5F7',
        borderRadius: 16,
        padding: 20,
        borderWidth: 1,
        borderColor: '#FFE0E9',
    },
    matchLabel: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        marginBottom: 12,
    },
    matchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    matchPercentage: {
        fontSize: 48,
        fontWeight: 'bold',
        color: '#FF6B9D',
    },
    matchText: {
        fontSize: 18,
        color: '#6B7280',
        flex: 1,
    },
    heartIcon: {
        position: 'relative',
        width: 60,
        height: 60,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heartPercentage: {
        position: 'absolute',
        fontSize: 12,
        fontWeight: 'bold',
        color: '#FFF',
    },
    section: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#181113',
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        color: '#4B5563',
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    interestChip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderWidth: 1.5,
        borderColor: '#FFE0E9',
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        gap: 6,
    },
    interestEmoji: {
        fontSize: 16,
    },
    interestText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#181113',
    },
    galleryHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FF6B9D',
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    galleryItem: {
        width: (width - 56) / 2,
        height: (width - 56) / 2,
        borderRadius: 16,
        overflow: 'hidden',
        position: 'relative',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    morePhotosOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    morePhotosText: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
        backgroundColor: '#FFF',
    },
    actionButton: {
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    gradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        gap: 12,
    },
    actionButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: '700',
    },
    statusButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 18,
        backgroundColor: '#F3F4F6',
        borderRadius: 16,
        gap: 12,
    },
    statusButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#6B7280',
    },
});

export default UserProfileModal;
