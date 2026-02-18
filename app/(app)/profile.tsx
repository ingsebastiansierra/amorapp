import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { AvatarPicker } from '@/shared/components/AvatarPicker';
import { useTheme } from '@/shared/hooks/useTheme';

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
    const { colors } = useTheme();
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
                    email: user.email || '',
                    age,
                });
            } else {
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
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea}>
                    <Text style={styles.loadingText}>Cargando...</Text>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#181113" />
                    </Pressable>
                    <Text style={styles.headerTitle}>NUESTRO PERFIL</Text>
                    <View style={{ width: 40 }} />
                </View>

                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    {/* Avatar Section */}
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

                    {/* Personal Info Cards */}
                    <View style={[styles.infoCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
                        <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="mail" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Email</Text>
                            <Text style={styles.infoValue}>{profile?.email || 'No disponible'}</Text>
                        </View>
                    </View>

                    <View style={[styles.infoCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
                        <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name={profile?.gender === 'female' ? 'woman' : 'man'} size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Género</Text>
                            <Text style={styles.infoValue}>
                                {profile?.gender === 'female' ? 'Femenino' : profile?.gender === 'male' ? 'Masculino' : 'No especificado'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.infoCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
                        <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="calendar" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Fecha de Nacimiento</Text>
                            <Text style={styles.infoValue}>
                                {profile?.birth_date ? formatDate(profile.birth_date) : 'No disponible'}
                            </Text>
                        </View>
                    </View>

                    <View style={[styles.infoCard, { borderLeftColor: colors.primary, borderLeftWidth: 3 }]}>
                        <View style={[styles.infoIconBox, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="time" size={20} color={colors.primary} />
                        </View>
                        <View style={styles.infoContent}>
                            <Text style={styles.infoLabel}>Edad</Text>
                            <Text style={styles.infoValue}>
                                {profile?.age ? `${profile.age} años` : 'No disponible'}
                            </Text>
                        </View>
                    </View>

                    {/* Settings Section */}
                    <Text style={styles.sectionTitle}>CONFIGURACIÓN</Text>

                    {/* Settings Cards */}
                    <Pressable style={styles.settingCard}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="notifications" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Notificaciones</Text>
                            <Text style={styles.settingSubtitle}>Aniversarios, recordatorios compartidos</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Pressable style={styles.settingCard}>
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="lock-closed" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Privacidad y Seguridad</Text>
                            <Text style={styles.settingSubtitle}>Visibilidad del perfil, datos compartidos</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Pressable
                        style={styles.settingCard}
                        onPress={() => router.push('/(app)/theme-settings')}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="color-palette" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Personalización</Text>
                            <Text style={styles.settingSubtitle}>Temas, colores, iconos de la app</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Pressable
                        style={styles.settingCard}
                        onPress={() => router.push('/(app)/edit-profile')}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="person" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Editar Perfil</Text>
                            <Text style={styles.settingSubtitle}>Actualiza tu información</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Pressable
                        style={styles.settingCard}
                        onPress={() => router.push('/(app)/link-partner')}
                    >
                        <View style={[styles.settingIcon, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="heart" size={24} color={colors.primary} />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={styles.settingTitle}>Vincular Pareja</Text>
                            <Text style={styles.settingSubtitle}>Conéctate con tu pareja</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <Pressable
                        style={[styles.settingCard, styles.dangerCard]}
                        onPress={handleSignOut}
                    >
                        <View style={[styles.settingIcon, styles.dangerIcon]}>
                            <Ionicons name="log-out" size={24} color="#EF4444" />
                        </View>
                        <View style={styles.settingContent}>
                            <Text style={[styles.settingTitle, styles.dangerText]}>Cerrar Sesión</Text>
                            <Text style={styles.settingSubtitle}>Salir de tu cuenta</Text>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
                    </Pressable>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F6',
    },
    safeArea: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    loadingText: {
        color: '#181113',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 100,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 48,
        paddingBottom: 16,
        backgroundColor: '#FFF',
        marginBottom: 20,
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#181113',
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 24,
    },
    editHint: {
        fontSize: 12,
        color: '#9CA3AF',
        marginTop: 8,
    },
    name: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#181113',
        textAlign: 'center',
        marginTop: 12,
    },
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    infoIconBox: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    infoContent: {
        flex: 1,
    },
    infoLabel: {
        fontSize: 11,
        fontWeight: '600',
        color: '#9CA3AF',
        marginBottom: 2,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    infoValue: {
        fontSize: 15,
        fontWeight: '600',
        color: '#181113',
    },
    sectionTitle: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        opacity: 0.6,
        marginBottom: 12,
        marginTop: 24,
        paddingHorizontal: 4,
    },
    settingCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 1,
    },
    settingIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    settingContent: {
        flex: 1,
    },
    settingTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#181113',
        marginBottom: 2,
    },
    settingSubtitle: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    dangerCard: {
        backgroundColor: '#FFF5F5',
    },
    dangerIcon: {
        backgroundColor: '#FEE2E2',
    },
    dangerText: {
        color: '#EF4444',
    },
});
