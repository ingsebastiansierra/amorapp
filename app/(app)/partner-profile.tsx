import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { supabase } from '@/core/config/supabase';

interface PartnerProfile {
    name: string;
    email: string;
    gender: string;
    birth_date: string;
    age: number;
}

export default function PartnerProfileScreen() {
    const router = useRouter();
    const { partnerId } = useLocalSearchParams();
    const [profile, setProfile] = useState<PartnerProfile | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!partnerId) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, email, gender, birth_date')
                .eq('id', partnerId)
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
                    age,
                });
            }
        } catch (error) {
            console.error('Error loading partner profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <LinearGradient colors={['#FF6B9D', '#FFA8C5']} style={styles.container}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    <Text style={styles.loadingText}>Cargando...</Text>
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#FF6B9D', '#FFA8C5']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backIcon}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Mi Pareja</Text>
                    </View>

                    {/* Avatar */}
                    <View style={styles.avatarContainer}>
                        <View style={styles.avatar}>
                            <Text style={styles.avatarEmoji}>
                                {profile?.gender === 'female' ? '👩' : '👨'}
                            </Text>
                        </View>
                        <Text style={styles.name}>{profile?.name || 'Usuario'}</Text>
                        <Text style={styles.subtitle}>💕 Tu pareja</Text>
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
                    <View style={{ height: 120 }} />
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
    avatarContainer: {
        alignItems: 'center',
        marginBottom: 30,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarEmoji: {
        fontSize: 64,
    },
    name: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        marginTop: 4,
    },
    infoContainer: {
        marginBottom: 30,
    },
    infoCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
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
});
