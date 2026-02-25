import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useEffect, useState } from 'react';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useEmotionalStore } from '@/core/store/useEmotionalStore';
import { useThemeStore } from '@/core/store/useThemeStore';
import { supabase } from '@/core/config/supabase';
import * as Haptics from 'expo-haptics';

function MessagesTabIcon({ color, focused }: { color: string; focused: boolean }) {
    const { user } = useAuthStore();
    const [unreadCount, setUnreadCount] = useState(0);
    const [hasConnections, setHasConnections] = useState(false);

    useEffect(() => {
        if (!user) return;

        const loadUnreadCount = async () => {
            try {
                // Verificar si tiene conexiones activas
                const { data: connections, error: connectionsError } = await supabase
                    .from('connections')
                    .select('id')
                    .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
                    .eq('status', 'active')
                    .limit(1);

                setHasConnections((connections?.length || 0) > 0);

                // Contar mensajes de texto no leídos de TODAS las conexiones
                const { data: textMessages } = await supabase
                    .from('sync_messages')
                    .select('id')
                    .eq('to_user_id', user.id)
                    .eq('read', false);

                // Contar imágenes no vistas
                const { data: images } = await supabase
                    .from('images_private')
                    .select('id')
                    .eq('to_user_id', user.id)
                    .eq('viewed', false);

                // Contar notas de voz no escuchadas
                const { data: voiceNotes } = await supabase
                    .from('voice_notes')
                    .select('id')
                    .eq('to_user_id', user.id)
                    .eq('listened', false);

                const total = (textMessages?.length || 0) + (images?.length || 0) + (voiceNotes?.length || 0);
                setUnreadCount(total);
            } catch (error) {
                console.error('Error loading unread count:', error);
            }
        };

        loadUnreadCount();

        // Suscripción en tiempo real para actualizar el contador
        const channel = supabase
            .channel('unread-messages')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'sync_messages',
                    filter: `to_user_id=eq.${user.id}`,
                },
                () => loadUnreadCount()
            )
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'sync_messages',
                    filter: `to_user_id=eq.${user.id}`,
                },
                () => loadUnreadCount()
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'images_private',
                    filter: `to_user_id=eq.${user.id}`,
                },
                () => loadUnreadCount()
            )
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'voice_notes',
                    filter: `to_user_id=eq.${user.id}`,
                },
                () => loadUnreadCount()
            )
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'connections',
                },
                () => loadUnreadCount()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return (
        <>
            <Ionicons
                name={focused ? "chatbubbles" : "chatbubbles-outline"}
                size={26}
                color={focused ? '#FF6B9D' : (hasConnections ? color : '#D1D5DB')}
            />
            {!hasConnections && (
                <View style={styles.lockBadge}>
                    <Ionicons name="lock-closed" size={10} color="#FFF" />
                </View>
            )}
            {unreadCount > 0 && hasConnections && (
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
            )}
        </>
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
                    position: 'absolute',
                    bottom: 20,
                    left: 50,
                    right: 50,
                    backgroundColor: '#FFF',
                    borderRadius: 30,
                    borderTopWidth: 0,
                    paddingBottom: 16,
                    paddingTop: 16,
                    paddingHorizontal: 20,
                    height: 75,
                    elevation: 12,
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.15,
                    shadowRadius: 16,
                },
                tabBarActiveTintColor: '#FF6B9D',
                tabBarInactiveTintColor: '#9CA3AF',
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    marginTop: 4,
                    letterSpacing: 0.5,
                },
                tabBarIconStyle: {
                    marginTop: 0,
                },
            }}
        >
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Inicio',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                            <Ionicons name={focused ? "flame" : "flame-outline"} size={26} color={focused ? '#FF6B9D' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="messages"
                options={{
                    title: 'Chats',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                            <MessagesTabIcon color={color} focused={focused} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="edit-intention"
                options={{
                    title: '',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.centerButton, focused && styles.centerButtonActive]}>
                            <Ionicons name="heart" size={32} color="#FFF" />
                        </View>
                    ),
                    tabBarLabel: () => null,
                }}
            />
            <Tabs.Screen
                name="private-images"
                options={{
                    title: 'Galería',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                            <Ionicons name={focused ? "images" : "images-outline"} size={26} color={focused ? '#FF6B9D' : color} />
                        </View>
                    ),
                }}
            />
            <Tabs.Screen
                name="profile"
                options={{
                    title: 'Perfil',
                    tabBarIcon: ({ color, focused }) => (
                        <View style={[styles.iconWrapper, focused && styles.iconWrapperActive]}>
                            <Ionicons name={focused ? "person-circle" : "person-circle-outline"} size={26} color={focused ? '#FF6B9D' : color} />
                        </View>
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
            <Tabs.Screen
                name="suggestions"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="preferences-settings"
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
                name="connection-requests"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="components/UserProfileModal"
                options={{
                    href: null,
                }}
            />
            <Tabs.Screen
                name="chat/[id]"
                options={{
                    href: null,
                    tabBarStyle: { display: 'none' },
                }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    iconWrapper: {
        width: 50,
        height: 50,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 25,
    },
    iconWrapperActive: {
        backgroundColor: '#FFE8F0',
    },
    centerButton: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: '#FF6B9D',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
        shadowColor: '#FF6B9D',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    centerButtonActive: {
        backgroundColor: '#E5507A',
    },
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
