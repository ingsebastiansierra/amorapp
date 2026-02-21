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
                                {/* Avatar y nombre */}
                                <View style={styles.profileHeader}>
                                    <Image
                                        source={{
                                            uri: profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&size=200`,
                                        }}
                                        style={styles.avatar}
                                    />
                                    <Text style={styles.name}>{profile.name}</Text>
                                    <View style={styles.infoRow}>
                                        <Ionicons
                                            name={profile.gender === 'female' ? 'woman' : 'man'}
                                            size={20}
                                            color="#6B7280"
                                        />
                                        <Text style={styles.infoText}>{profile.age} años</Text>
                                    </View>
                                </View>

                                {/* Galería pública */}
                                {gallery.length > 0 && (
                                    <View style={styles.gallerySection}>
                                        <Text style={styles.sectionTitle}>FOTOS</Text>
                                        <View style={styles.galleryGrid}>
                                            {gallery.map((item) => (
                                                <View key={item.id} style={styles.galleryItem}>
                                                    <Image
                                                        source={{ uri: item.image_path }}
                                                        style={styles.galleryImage}
                                                    />
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
        height: height * 0.85,
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
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    closeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        padding: 24,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#FF6B9D',
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#181113',
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    infoText: {
        fontSize: 16,
        color: '#6B7280',
    },
    gallerySection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        marginBottom: 16,
    },
    galleryGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    galleryItem: {
        width: (width - 64) / 3,
        height: (width - 64) / 3,
        borderRadius: 12,
        overflow: 'hidden',
    },
    galleryImage: {
        width: '100%',
        height: '100%',
    },
    footer: {
        padding: 24,
        paddingBottom: 40,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
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
