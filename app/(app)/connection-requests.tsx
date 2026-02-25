import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, Alert, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';

interface ConnectionRequest {
    id: string;
    sender_id: string;
    sender_name: string;
    sender_avatar_url: string | null;
    sender_gender: string;
    initial_message: string | null;
    created_at: string;
}

export default function ConnectionRequestsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [requests, setRequests] = useState<ConnectionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        loadRequests();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadRequests();
        }, [])
    );

    const loadRequests = async () => {
        if (!user) return;

        try {
            // Query directa en lugar de usar RPC
            const { data, error } = await supabase
                .from('connections')
                .select(`
                    id,
                    user1_id,
                    initial_message,
                    created_at,
                    sender:user1_id (
                        id,
                        name,
                        avatar_url,
                        gender
                    )
                `)
                .eq('user2_id', user.id)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Transformar los datos al formato esperado
            const transformedRequests = (data || []).map((req: any) => ({
                id: req.id,
                sender_id: req.user1_id,
                sender_name: req.sender?.name || 'Usuario',
                sender_avatar_url: req.sender?.avatar_url || null,
                sender_gender: req.sender?.gender || 'male',
                initial_message: req.initial_message,
                created_at: req.created_at,
            }));

            setRequests(transformedRequests);
        } catch (error) {
            console.error('Error loading requests:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const handleAccept = async (requestId: string, senderName: string) => {
        if (!user) return;

        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setProcessingId(requestId);

        try {
            const { error } = await supabase
                .from('connections')
                .update({ status: 'active' })
                .eq('id', requestId)
                .eq('user2_id', user.id)
                .eq('status', 'pending');

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '¡Conexión Aceptada!',
                `Ahora estás conectado con ${senderName}`,
                [{ text: 'OK' }]
            );
            loadRequests();
        } catch (error) {
            console.error('Error accepting request:', error);
            Alert.alert('Error', 'No se pudo aceptar la solicitud');
        } finally {
            setProcessingId(null);
        }
    };

    const handleReject = async (requestId: string, senderName: string) => {
        if (!user) return;

        Alert.alert(
            'Rechazar Solicitud',
            `¿Estás seguro de rechazar la solicitud de ${senderName}?`,
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Rechazar',
                    style: 'destructive',
                    onPress: async () => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setProcessingId(requestId);

                        try {
                            const { error } = await supabase
                                .from('connections')
                                .update({ status: 'rejected' })
                                .eq('id', requestId)
                                .eq('user2_id', user.id)
                                .eq('status', 'pending');

                            if (error) throw error;

                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            loadRequests();
                        } catch (error) {
                            console.error('Error rejecting request:', error);
                            Alert.alert('Error', 'No se pudo rechazar la solicitud');
                        } finally {
                            setProcessingId(null);
                        }
                    }
                }
            ]
        );
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadRequests();
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `Hace ${diffMins}m`;
        if (diffHours < 24) return `Hace ${diffHours}h`;
        if (diffDays < 7) return `Hace ${diffDays}d`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>Solicitudes</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#FFF"
                        />
                    }
                >
                    {loading ? (
                        <View style={styles.emptyState}>
                            <Text style={styles.emptyText}>Cargando...</Text>
                        </View>
                    ) : requests.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="people-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
                            <Text style={styles.emptyText}>No tienes solicitudes</Text>
                            <Text style={styles.emptySubtext}>
                                Las solicitudes de conexión aparecerán aquí
                            </Text>
                        </View>
                    ) : (
                        requests.map((request) => (
                            <View key={request.id} style={styles.requestCard}>
                                <View style={styles.requestHeader}>
                                    <View style={styles.avatarContainer}>
                                        {request.sender_avatar_url ? (
                                            <Image
                                                source={{ uri: request.sender_avatar_url }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Ionicons name="person" size={32} color="#667eea" />
                                            </View>
                                        )}
                                        <View style={[
                                            styles.genderBadge,
                                            { backgroundColor: request.sender_gender === 'male' ? '#3B82F6' : '#EC4899' }
                                        ]}>
                                            <Ionicons
                                                name={request.sender_gender === 'male' ? 'male' : 'female'}
                                                size={12}
                                                color="#FFF"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.requestInfo}>
                                        <Text style={styles.senderName}>{request.sender_name}</Text>
                                        <Text style={styles.requestTime}>{formatDate(request.created_at)}</Text>
                                        {request.initial_message && (
                                            <Text style={styles.message} numberOfLines={2}>
                                                "{request.initial_message}"
                                            </Text>
                                        )}
                                    </View>
                                </View>

                                <View style={styles.actions}>
                                    <Pressable
                                        style={[styles.actionButton, styles.rejectButton]}
                                        onPress={() => handleReject(request.id, request.sender_name)}
                                        disabled={processingId === request.id}
                                    >
                                        <Ionicons name="close" size={20} color="#EF4444" />
                                        <Text style={[styles.actionButtonText, styles.rejectButtonText]}>
                                            Rechazar
                                        </Text>
                                    </Pressable>

                                    <Pressable
                                        style={[styles.actionButton, styles.acceptButton]}
                                        onPress={() => handleAccept(request.id, request.sender_name)}
                                        disabled={processingId === request.id}
                                    >
                                        <Ionicons name="checkmark" size={20} color="#FFF" />
                                        <Text style={[styles.actionButtonText, styles.acceptButtonText]}>
                                            Aceptar
                                        </Text>
                                    </Pressable>
                                </View>
                            </View>
                        ))
                    )}
                </ScrollView>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 100,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: 8,
        textAlign: 'center',
    },
    requestCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    requestHeader: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
    },
    avatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#F3F4F6',
        alignItems: 'center',
        justifyContent: 'center',
    },
    genderBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 20,
        height: 20,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    requestInfo: {
        flex: 1,
        justifyContent: 'center',
    },
    senderName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#181113',
        marginBottom: 4,
    },
    requestTime: {
        fontSize: 12,
        color: '#9CA3AF',
        marginBottom: 6,
    },
    message: {
        fontSize: 14,
        color: '#6B7280',
        fontStyle: 'italic',
        lineHeight: 18,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 12,
        borderRadius: 12,
        gap: 6,
    },
    rejectButton: {
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FEE2E2',
    },
    acceptButton: {
        backgroundColor: '#667eea',
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
    rejectButtonText: {
        color: '#EF4444',
    },
    acceptButtonText: {
        color: '#FFF',
    },
});
