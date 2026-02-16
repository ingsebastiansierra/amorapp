import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { AvatarPicker } from '@/shared/components/AvatarPicker';

interface UserProfile {
    name: string;
    email: string;
    gender: string;
    birth_date: string;
    age: number;
    avatar_url: string | null;
}

export default function ProfileScreen() {
    const { user, signOut } = useAuthStore();
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, gender, birth_date, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                // Calcular edad
                const birthDate = new Date(data.birth_date);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                    age--;
                }

                setProfile({
                    ...data,
                    email: user.email || '', // Usar el email del usuario autenticado
                    age,
                });
            } else {
                // Si no existe el perfil, usar datos del auth
                setProfile({
                    name: user.email?.split('@')[0] || 'Usuario',
                    email: user.email || '',
                    gender: 'male',
                    birth_date: '',
                    age: 0,
                    avatar_url: null,
                });
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <Text style={styles.loadingText}>Cargando...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backIcon}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Mi Perfil</Text>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarSection}>
                        {user && (
                            <AvatarPicker
                                userId={user.id}
                                currentAvatarUrl={profile?.avatar_url || null}
                                gender={profile?.gender}
                                onAvatarUpdated={(url) => {
                                    setProfile(prev => prev ? { ...prev, avatar_url: url } : null);
                                }}
                            />
                        )}
                        <Text style={styles.name}>{profile?.name || 'Usuario'}</Text>
                        <Text style={styles.editHint}>Toca la foto para cambiarla</Text>
                    </View>

                    {/* Info Cards */}
                    <View style={styles.infoContainer}>
                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{profile?.email}</Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Género</Text>
                            <Text style={styles.infoValue}>
                                {profile?.gender === 'female' ? '👩 Mujer' : '👨 Hombre'}
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                            <Text style={styles.infoValue}>
                                {profile?.birth_date ? formatDate(profile.birth_date) : 'No especificada'}
                            </Text>
                        </View>

                        <View style={styles.infoCard}>
                            <Text style={styles.infoLabel}>Edad</Text>
                            <Text style={styles.infoValue}>{profile?.age} años</Text>
                        </View>
                    </View>

                    {/* Actions */}
                    <View style={styles.actionsContainer}>
                        <Pressable
                            style={styles.actionButton}
                            onPress={() => router.push('/(app)/edit-profile')}
                        >
                            <Text style={styles.actionIcon}>✏️</Text>
                            <Text style={styles.actionText}>Editar Perfil</Text>
                        </Pressable>

                        <Pressable style={styles.actionButton} onPress={() => router.push('/(app)/link-partner')}>
                            <Text style={styles.actionIcon}>💑</Text>
                            <Text style={styles.actionText}>Vincular Pareja</Text>
                        </Pressable>

                        <Pressable style={styles.actionButton}>
                            <Text style={styles.actionIcon}>⚙️</Text>
                            <Text style={styles.actionText}>Configuración</Text>
                        </Pressable>

                        <Pressable
                            style={[styles.actionButton, styles.actionButtonDanger]}
                            onPress={handleSignOut}
                        >
                            <Text style={styles.actionIcon}>🚪</Text>
                            <Text style={[styles.actionText, styles.actionTextDanger]}>
                                Cerrar Sesión
                            </Text>
                        </Pressable>
                    </View>
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
    scrollContent: {
        padding: 20,
        paddingTop: 60,
    },
    loadingText: {
        color: '#FFF',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#FFF',
    },
    headerTitle: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginRight: 40,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 30,
    },
    editHint: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.7,
        marginTop: 8,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    infoContainer: {
        marginBottom: 30,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
        marginBottom: 4,
    },
    infoValue: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    actionsContainer: {
        marginTop: 10,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        marginBottom: 12,
    },
    actionIcon: {
        fontSize: 24,
        marginRight: 16,
    },
    actionText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    actionButtonDanger: {
        backgroundColor: 'rgba(229, 62, 62, 0.3)',
    },
    actionTextDanger: {
        color: '#FFF',
    },
});
