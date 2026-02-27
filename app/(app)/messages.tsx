import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Image, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';

interface Connection {
    id: string;
    user_id: string;
    user_name: string;
    user_avatar: string | null;
    user_gender: string;
    last_message: string | null;
    last_message_time: string | null;
    unread_count: number;
}

export default function ChatsListScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const [connections, setConnections] = useState<Connection[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedChats, setSelectedChats] = useState<Set<string>>(new Set());
    const [selectionMode, setSelectionMode] = useState(false);

    useEffect(() => {
        loadConnections();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadConnections();
        }, [])
    );

    const loadConnections = async () => {
        if (!user) return;

        try {
            // Obtener todas las conexiones activas
            const { data: connectionsData, error } = await supabase
                .from('connections')
                .select(`
                    id,
                    user1_id,
                    user2_id,
                    user1:user1_id (
                        id,
                        name,
                        avatar_url,
                        gender
                    ),
                    user2:user2_id (
                        id,
                        name,
                        avatar_url,
                        gender
                    )
                `)
                .eq('status', 'active')
                .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`);

            if (error) throw error;

            // Transformar los datos para obtener el otro usuario
            const transformedConnections: Connection[] = await Promise.all(
                (connectionsData || []).map(async (conn: any) => {
                    const isUser1 = conn.user1_id === user.id;
                    const otherUser = isUser1 ? conn.user2 : conn.user1;
                    const otherUserId = isUser1 ? conn.user2_id : conn.user1_id;

                    // Obtener el último mensaje entre estos dos usuarios
                    const { data: lastMessageData } = await supabase
                        .from('sync_messages')
                        .select('message, created_at, from_user_id')
                        .or(`and(from_user_id.eq.${user.id},to_user_id.eq.${otherUserId}),and(from_user_id.eq.${otherUserId},to_user_id.eq.${user.id})`)
                        .order('created_at', { ascending: false })
                        .limit(1)
                        .maybeSingle();

                    // Obtener mensajes no leídos
                    const { count: unreadCount } = await supabase
                        .from('sync_messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('to_user_id', user.id)
                        .eq('from_user_id', otherUserId)
                        .eq('read', false);

                    let last_message = null;
                    if (lastMessageData) {
                        // Agregar "Tú: " si el mensaje fue enviado por ti
                        const prefix = lastMessageData.from_user_id === user.id ? 'Tú: ' : '';
                        last_message = prefix + lastMessageData.message;
                    }

                    return {
                        id: conn.id,
                        user_id: otherUserId,
                        user_name: otherUser?.name || 'Usuario',
                        user_avatar: otherUser?.avatar_url || null,
                        user_gender: otherUser?.gender || 'male',
                        last_message,
                        last_message_time: lastMessageData?.created_at || null,
                        unread_count: unreadCount || 0,
                    };
                })
            );

            // Ordenar por último mensaje (más reciente primero)
            transformedConnections.sort((a, b) => {
                if (!a.last_message_time) return 1;
                if (!b.last_message_time) return -1;
                return new Date(b.last_message_time).getTime() - new Date(a.last_message_time).getTime();
            });

            setConnections(transformedConnections);
        } catch (error) {
            console.error('Error loading connections:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const onRefresh = () => {
        setRefreshing(true);
        loadConnections();
    };

    const handleChatPress = (connectionId: string, userId: string) => {
        if (selectionMode) {
            // En modo selección, marcar/desmarcar
            toggleSelection(connectionId);
        } else {
            // Modo normal, abrir chat
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push(`/(app)/chat/${userId}` as any);
        }
    };

    const handleChatLongPress = (connectionId: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectionMode(true);
        toggleSelection(connectionId);
    };

    const toggleSelection = (connectionId: string) => {
        setSelectedChats(prev => {
            const newSet = new Set(prev);
            if (newSet.has(connectionId)) {
                newSet.delete(connectionId);
            } else {
                newSet.add(connectionId);
            }
            // Si no hay selecciones, salir del modo selección
            if (newSet.size === 0) {
                setSelectionMode(false);
            }
            return newSet;
        });
    };

    const cancelSelection = () => {
        setSelectedChats(new Set());
        setSelectionMode(false);
    };

    const deleteSelectedChats = async () => {
        if (selectedChats.size === 0) return;

        try {
            // Borrar las conexiones seleccionadas
            const idsToDelete = Array.from(selectedChats);
            
            for (const connId of idsToDelete) {
                const conn = connections.find(c => c.id === connId);
                if (!conn) continue;

                // Borrar mensajes
                await supabase
                    .from('sync_messages')
                    .delete()
                    .eq('from_user_id', user!.id)
                    .eq('to_user_id', conn.user_id);

                await supabase
                    .from('sync_messages')
                    .delete()
                    .eq('from_user_id', conn.user_id)
                    .eq('to_user_id', user!.id);

                // Borrar la conexión
                await supabase
                    .from('connections')
                    .delete()
                    .eq('id', connId);
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            cancelSelection();
            loadConnections();
        } catch (error) {
            console.error('Error deleting chats:', error);
        }
    };

    const formatTime = (dateString: string | null) => {
        if (!dateString) return '';

        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffMins < 1) return 'Ahora';
        if (diffMins < 60) return `${diffMins}m`;
        if (diffHours < 24) return `${diffHours}h`;
        if (diffDays < 7) return `${diffDays}d`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    {selectionMode ? (
                        <View style={styles.selectionHeader}>
                            <Pressable onPress={cancelSelection} style={styles.cancelButton}>
                                <Ionicons name="close" size={24} color="#FFF" />
                            </Pressable>
                            <Text style={styles.selectionTitle}>
                                {selectedChats.size} seleccionado{selectedChats.size !== 1 ? 's' : ''}
                            </Text>
                            <Pressable onPress={deleteSelectedChats} style={styles.deleteButton}>
                                <Ionicons name="trash" size={24} color="#FFF" />
                            </Pressable>
                        </View>
                    ) : (
                        <Text style={styles.headerTitle}>Chats</Text>
                    )}
                </View>

                {/* Burbujas de contactos activos */}
                {!selectionMode && connections.length > 0 && (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.bubblesContainer}
                        contentContainerStyle={styles.bubblesContent}
                    >
                        {connections.map((connection) => (
                            <Pressable
                                key={connection.id}
                                style={styles.bubble}
                                onPress={() => handleChatPress(connection.id, connection.user_id)}
                            >
                                {connection.user_avatar ? (
                                    <Image
                                        source={{ uri: connection.user_avatar }}
                                        style={styles.bubbleAvatar}
                                    />
                                ) : (
                                    <View style={styles.bubbleAvatarPlaceholder}>
                                        <Ionicons name="person" size={24} color="#667eea" />
                                    </View>
                                )}
                                <Text style={styles.bubbleName} numberOfLines={1}>
                                    {connection.user_name.split(' ')[0]}
                                </Text>
                            </Pressable>
                        ))}
                    </ScrollView>
                )}

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
                    ) : connections.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="chatbubbles-outline" size={80} color="rgba(255, 255, 255, 0.3)" />
                            <Text style={styles.emptyText}>No tienes chats</Text>
                            <Text style={styles.emptySubtext}>
                                Acepta solicitudes de conexión para empezar a chatear
                            </Text>
                        </View>
                    ) : (
                        connections.map((connection) => {
                            const isSelected = selectedChats.has(connection.id);
                            return (
                                <Pressable
                                    key={connection.id}
                                    style={[
                                        styles.chatCard,
                                        isSelected && styles.chatCardSelected
                                    ]}
                                    onPress={() => handleChatPress(connection.id, connection.user_id)}
                                    onLongPress={() => handleChatLongPress(connection.id)}
                                >
                                    {selectionMode && (
                                        <View style={styles.checkboxContainer}>
                                            <View style={[
                                                styles.checkbox,
                                                isSelected && styles.checkboxSelected
                                            ]}>
                                                {isSelected && (
                                                    <Ionicons name="checkmark" size={16} color="#FFF" />
                                                )}
                                            </View>
                                        </View>
                                    )}

                                    <View style={styles.avatarContainer}>
                                        {connection.user_avatar ? (
                                            <Image
                                                source={{ uri: connection.user_avatar }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={styles.avatarPlaceholder}>
                                                <Ionicons name="person" size={32} color="#667eea" />
                                            </View>
                                        )}
                                        <View style={[
                                            styles.genderBadge,
                                            { backgroundColor: connection.user_gender === 'male' ? '#3B82F6' : '#EC4899' }
                                        ]}>
                                            <Ionicons
                                                name={connection.user_gender === 'male' ? 'male' : 'female'}
                                                size={12}
                                                color="#FFF"
                                            />
                                        </View>
                                    </View>

                                    <View style={styles.chatInfo}>
                                        <View style={styles.chatHeader}>
                                            <Text style={styles.userName}>{connection.user_name}</Text>
                                            {connection.last_message_time && (
                                                <Text style={styles.time}>
                                                    {formatTime(connection.last_message_time)}
                                                </Text>
                                            )}
                                        </View>
                                        <View style={styles.messageRow}>
                                            <Text style={styles.lastMessage} numberOfLines={1}>
                                                {connection.last_message || 'Inicia una conversación'}
                                            </Text>
                                            {connection.unread_count > 0 && (
                                                <View style={styles.unreadBadge}>
                                                    <Text style={styles.unreadText}>
                                                        {connection.unread_count > 99 ? '99+' : connection.unread_count}
                                                    </Text>
                                                </View>
                                            )}
                                        </View>
                                    </View>

                                    {!selectionMode && (
                                        <Ionicons name="chevron-forward" size={20} color="rgba(255, 255, 255, 0.5)" />
                                    )}
                                </Pressable>
                            );
                        })
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
        paddingHorizontal: 20,
        paddingVertical: 20,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFF',
    },
    selectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    selectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        flex: 1,
        textAlign: 'center',
    },
    cancelButton: {
        padding: 8,
    },
    deleteButton: {
        padding: 8,
    },
    bubblesContainer: {
        maxHeight: 100,
        marginBottom: 12,
    },
    bubblesContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    bubble: {
        alignItems: 'center',
        width: 70,
    },
    bubbleAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        borderWidth: 3,
        borderColor: '#FFF',
    },
    bubbleAvatarPlaceholder: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    bubbleName: {
        fontSize: 12,
        color: '#FFF',
        marginTop: 4,
        fontWeight: '600',
        textAlign: 'center',
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
        paddingHorizontal: 40,
    },
    chatCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    chatCardSelected: {
        backgroundColor: '#E0E7FF',
        borderWidth: 2,
        borderColor: '#667eea',
    },
    checkboxContainer: {
        marginRight: 12,
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#D1D5DB',
        alignItems: 'center',
        justifyContent: 'center',
    },
    checkboxSelected: {
        backgroundColor: '#667eea',
        borderColor: '#667eea',
    },
    avatarContainer: {
        position: 'relative',
        marginRight: 12,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
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
    chatInfo: {
        flex: 1,
    },
    chatHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
        color: '#181113',
    },
    time: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    messageRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    lastMessage: {
        fontSize: 14,
        color: '#6B7280',
        flex: 1,
        marginRight: 8,
        flexShrink: 1,
    },
    unreadBadge: {
        backgroundColor: '#EF4444',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        paddingHorizontal: 6,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unreadText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
