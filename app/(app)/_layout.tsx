import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useEmotionalStore } from '@/core/store/useEmotionalStore';
import { useThemeStore } from '@/core/store/useThemeStore';
import { supabase } from '@/core/config/supabase';
import * as Haptics from 'expo-haptics';

function MessagesTabIcon({ color, isSynced, focused }: { color: string; isSynced: boolean; focused: boolean }) {
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
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={28}
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

export default function AppLayout() {
    const { myState, partnerState } = useEmotionalStore();
    const loadTheme = useThemeStore(state => state.loadTheme);
    const [isSynced, setIsSynced] = useState(false);

    // Cargar tema al iniciar
    useEffect(() => {
        loadTheme();
    }, []);

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
                    borderTopWidth: 0,
                    paddingBottom: 24,
                    paddingTop: 12,
                    height: 85,
                    elevation: 8,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: -2 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                },
                tabBarActiveTintColor: '#FF6B9D',
                tabBarInactiveTintColor: '#4B5563',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '600',
                    marginTop: 1,
                    letterSpacing: 0.3,
                },
                tabBarIconStyle: {
                    marginTop: 5,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'INICIO',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? (
                            <View style={styles.fireIconWrapper}>
                                <Ionicons name="flame" size={25} color="#FF6B9D" />
                            </View>
                        ) : (
                            <Ionicons name="home-outline" size={28} color={color} />
                        )
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'MENSAJES',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? (
                            <View style={styles.fireIconWrapper}>
                                <Ionicons name="flame" size={25} color="#FF6B9D" />
                            </View>
                        ) : (
                            <MessagesTabIcon color={color} isSynced={isSynced} focused={focused} />
                        )
                    ),
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
                name="private-images"
                options={{
                    title: 'GALERÍA',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? (
                            <View style={styles.fireIconWrapper}>
                                <Ionicons name="flame" size={25} color="#FF6B9D" />
                            </View>
                        ) : (
                            <Ionicons name="images-outline" size={28} color={color} />
                        )
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'PERFIL',
                    tabBarIcon: ({ color, focused }) => (
                        focused ? (
                            <View style={styles.fireIconWrapper}>
                                <Ionicons name="flame" size={25} color="#FF6B9D" />
                            </View>
                        ) : (
                            <Ionicons name="person-circle-outline" size={28} color={color} />
                        )
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
                name="theme-settings"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="calendar"
                options={{
                    href: null,
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    fireIconWrapper: {
        marginBottom: 4,
    },
    iconContainer: {
        position: 'relative',
        width: 28,
        height: 28,
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
});
