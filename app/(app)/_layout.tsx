import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useEmotionalStore } from '@/core/store/useEmotionalStore';
import { supabase } from '@/core/config/supabase';
import { EMOTIONAL_STATES } from '@/core/types/emotions';
import * as Haptics from 'expo-haptics';

function MessagesTabIcon({ color, isSynced }: { color: string; isSynced: boolean }) {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user) return;

        const loadUnreadCount = async () => {
            try {
                const { data: userData } = await supabase
                    .from('users')
                    .select('couple_id')
                    .eq('id', user.id)
                    .maybeSingle();

                if (!userData?.couple_id) return;

                // Contar mensajes de texto no leídos
                const { data: textMessages } = await supabase
                    .from('sync_messages')
                    .select('id')
                    .eq('couple_id', userData.couple_id)
                    .eq('to_user_id', user.id)
                    .eq('read', false);

                // Contar imágenes no vistas
                const { data: images } = await supabase
                    .from('images_private')
                    .select('id')
                    .eq('to_user_id', user.id)
                    .eq('viewed', false);

                const total = (textMessages?.length || 0) + (images?.length || 0);
                setUnreadCount(total);
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        };

        loadUnreadCount();

        // Actualizar cada 5 segundos
        const interval = setInterval(loadUnreadCount, 5000);
        return () => clearInterval(interval);
    }, [user]);

    return (
        <View style={styles.iconContainer}>
            <Ionicons
                name="chatbubbles"
                size={26}
                color={isSynced ? color : '#D1D5DB'}
            />
            {!isSynced && (
                <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color="#FFF" />
                </View>
            )}
            {unreadCount > 0 && isSynced && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
            )}
        </View>
    );
}

function EmotionalTabIcon() {
    const { user } = useAuthStore();
    const { myState } = useEmotionalStore();
    const [currentEmoji, setCurrentEmoji] = useState('❤️');

    useEffect(() => {
        if (!user) return;

        const loadMyEmotion = async () => {
            try {
                const { data } = await supabase
                    .from('emotional_states')
                    .select('state')
                    .eq('user_id', user.id)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (data?.state) {
                    const emoji = EMOTIONAL_STATES[data.state]?.emoji || '❤️';
                    setCurrentEmoji(emoji);
                }
            } catch (error) {
                console.error('Error loading emotion:', error);
            }
        };

        loadMyEmotion();

        // Actualizar cada 5 segundos
        const interval = setInterval(loadMyEmotion, 5000);
        return () => clearInterval(interval);
    }, [user, myState]);

    return (
        <Text style={styles.emojiIcon}>{currentEmoji}</Text>
    );
}

export default function AppLayout() {
    const { user } = useAuthStore();
    const { myState, partnerState } = useEmotionalStore();
    const [isSynced, setIsSynced] = useState(false);

    useEffect(() => {
        // Verificar sincronización
        const synced = !!(myState && partnerState && myState === partnerState);
        setIsSynced(synced);
    }, [myState, partnerState]);

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarStyle: {
                    backgroundColor: '#FFF',
                    borderTopWidth: 1,
                    borderTopColor: '#F4F0F2',
                    paddingBottom: 20,
                    paddingTop: 8,
                    height: 80,
                },
                tabBarActiveTintColor: '#EB477E',
                tabBarInactiveTintColor: '#6B7280',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '500',
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="home" size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Mensajes',
                    tabBarIcon: ({ color }) => <MessagesTabIcon color={color} isSynced={isSynced} />,
                    tabBarStyle: { display: 'none' },
                }}
                listeners={{
                    tabPress: (e) => {
                        if (!isSynced) {
                            e.preventDefault();
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
                            Alert.alert(
                                '🔒 Mensajes Bloqueados',
                                'Solo puedes enviar mensajes cuando ambos están sincronizados emocionalmente.\n\n✨ Actualiza tu estado para conectar con tu pareja.',
                                [{ text: 'Entendido', style: 'default' }]
                            );
                        }
                    },
                }}
            />
            <Tabs.Screen
                name="heart"
                options={{
                    title: '',
                    tabBarIcon: () => <EmotionalTabIcon />,
                    tabBarIconStyle: {
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        backgroundColor: '#EB477E',
                        justifyContent: 'center',
                        alignItems: 'center',
                        marginTop: -24,
                        borderWidth: 4,
                        borderColor: '#FFF',
                    },
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="private-images"
                options={{
                    title: 'Galería',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="images" size={26} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, size }) => (
                        <Ionicons name="person-circle" size={26} color={color} />
                    ),
                }}
            />
            {/* Pantallas ocultas del tab bar */}
            <Tabs.Screen
                name="edit-profile"
                options={{
                    href: null, // Oculta del tab bar
                }}
            />
            <Tabs.Screen
                name="link-partner"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="partner-profile"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="change-password"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="voice-notes"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="home-backup"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="home-old"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconContainer: {
        position: 'relative',
        width: 26,
        height: 26,
    },
    badge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#EB477E',
        borderRadius: 10,
        minWidth: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 4,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    lockBadge: {
        position: 'absolute',
        top: -6,
        right: -10,
        backgroundColor: '#9CA3AF',
        borderRadius: 10,
        width: 18,
        height: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 10,
        fontWeight: 'bold',
    },
    emojiIcon: {
        fontSize: 24,
    },
});
