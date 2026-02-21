import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Slider from '@react-native-community/slider';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { useTheme } from '@/shared/hooks/useTheme';

interface UserPreferences {
    looking_for_gender: 'male' | 'female' | 'any';
    age_range_min: number;
    age_range_max: number;
    distance_max_km: number;
}

export default function PreferencesSettingsScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { colors } = useTheme();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [lookingForGender, setLookingForGender] = useState<'male' | 'female' | 'any'>('any');
    const [ageRange, setAgeRange] = useState<[number, number]>([18, 35]);
    const [maxDistance, setMaxDistance] = useState(50);

    const genderOptions: { value: 'male' | 'female' | 'any'; label: string; emoji: string }[] = [
        { value: 'male', label: 'Hombres', emoji: '👨' },
        { value: 'female', label: 'Mujeres', emoji: '👩' },
        { value: 'any', label: 'Todos', emoji: '👥' },
    ];

    useEffect(() => {
        loadPreferences();
    }, []);

    const loadPreferences = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_preferences')
                .select('looking_for_gender, age_range_min, age_range_max, distance_max_km')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setLookingForGender(data.looking_for_gender || 'any');
                setAgeRange([data.age_range_min || 18, data.age_range_max || 35]);
                setMaxDistance(data.distance_max_km || 50);
            }
        } catch (error) {
            console.error('Error loading preferences:', error);
            Alert.alert('Error', 'No se pudieron cargar las preferencias');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        console.log('🔵 Iniciando guardado de preferencias...');
        console.log('🔵 User ID:', user.id);
        console.log('🔵 Looking for gender:', lookingForGender);
        console.log('🔵 Age range:', ageRange);
        console.log('🔵 Max distance:', maxDistance);

        setSaving(true);
        try {
            const dataToSave = {
                user_id: user.id,
                looking_for_gender: lookingForGender,
                age_range_min: ageRange[0],
                age_range_max: ageRange[1],
                distance_max_km: maxDistance,
                updated_at: new Date().toISOString(),
            };

            console.log('🔵 Datos a guardar:', dataToSave);

            const { data, error } = await supabase
                .from('user_preferences')
                .upsert(dataToSave, {
                    onConflict: 'user_id'
                })
                .select();

            if (error) {
                console.error('❌ Error al guardar:', error);
                throw error;
            }

            console.log('✅ Preferencias guardadas exitosamente:', data);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '¡Listo!',
                'Tus preferencias se han actualizado correctamente. Los cambios se aplicarán en el Discovery.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error: any) {
            console.error('❌ Error completo:', error);
            Alert.alert(
                'Error',
                `No se pudieron guardar las preferencias: ${error.message || 'Error desconocido'}`
            );
        } finally {
            setSaving(false);
        }
    };

    const handleBack = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.back();
    };

    if (loading) {
        return (
            <View style={styles.container}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Cargando preferencias...</Text>
                    </View>
                </SafeAreaView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#181113" />
                    </Pressable>
                    <Text style={styles.headerTitle}>PREFERENCIAS</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.iconContainer}>
                        <Ionicons name="search" size={48} color={colors.primary} />
                    </View>
                    <Text style={styles.title}>Preferencias de Búsqueda</Text>
                    <Text style={styles.subtitle}>
                        Personaliza quién aparece en tu Discovery
                    </Text>

                    {/* Género */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>QUIERO CONOCER</Text>
                        <View style={styles.genderGrid}>
                            {genderOptions.map((option) => {
                                const isSelected = lookingForGender === option.value;
                                return (
                                    <Pressable
                                        key={option.value}
                                        style={[
                                            styles.genderCard,
                                            isSelected && { backgroundColor: colors.primary + '15', borderColor: colors.primary }
                                        ]}
                                        onPress={() => {
                                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            setLookingForGender(option.value);
                                        }}
                                    >
                                        <Text style={styles.genderEmoji}>{option.emoji}</Text>
                                        <Text style={[
                                            styles.genderLabel,
                                            isSelected && { color: colors.primary, fontWeight: '700' }
                                        ]}>
                                            {option.label}
                                        </Text>
                                        {isSelected && (
                                            <View style={[styles.checkmark, { backgroundColor: colors.primary }]}>
                                                <Ionicons name="checkmark" size={16} color="#FFF" />
                                            </View>
                                        )}
                                    </Pressable>
                                );
                            })}
                        </View>
                    </View>

                    {/* Rango de Edad */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>RANGO DE EDAD</Text>
                        <View style={styles.card}>
                            <View style={styles.rangeHeader}>
                                <Text style={styles.rangeText}>{ageRange[0]} años</Text>
                                <Text style={styles.rangeSeparator}>-</Text>
                                <Text style={styles.rangeText}>{ageRange[1]} años</Text>
                            </View>

                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderLabel}>Edad mínima</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={18}
                                    maximumValue={100}
                                    step={1}
                                    value={ageRange[0]}
                                    onValueChange={(value) => {
                                        if (value < ageRange[1]) {
                                            setAgeRange([value, ageRange[1]]);
                                        }
                                    }}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="#E5E7EB"
                                    thumbTintColor={colors.primary}
                                />
                            </View>

                            <View style={styles.sliderContainer}>
                                <Text style={styles.sliderLabel}>Edad máxima</Text>
                                <Slider
                                    style={styles.slider}
                                    minimumValue={18}
                                    maximumValue={100}
                                    step={1}
                                    value={ageRange[1]}
                                    onValueChange={(value) => {
                                        if (value > ageRange[0]) {
                                            setAgeRange([ageRange[0], value]);
                                        }
                                    }}
                                    minimumTrackTintColor={colors.primary}
                                    maximumTrackTintColor="#E5E7EB"
                                    thumbTintColor={colors.primary}
                                />
                            </View>
                        </View>
                    </View>

                    {/* Distancia Máxima */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>DISTANCIA MÁXIMA</Text>
                        <View style={styles.card}>
                            <View style={styles.distanceHeader}>
                                <Ionicons name="location" size={24} color={colors.primary} />
                                <Text style={styles.distanceValue}>{maxDistance} km</Text>
                            </View>
                            <Slider
                                style={styles.slider}
                                minimumValue={1}
                                maximumValue={500}
                                step={1}
                                value={maxDistance}
                                onValueChange={setMaxDistance}
                                minimumTrackTintColor={colors.primary}
                                maximumTrackTintColor="#E5E7EB"
                                thumbTintColor={colors.primary}
                            />
                            <View style={styles.distanceLabels}>
                                <Text style={styles.distanceLabel}>1 km</Text>
                                <Text style={styles.distanceLabel}>500 km</Text>
                            </View>
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color={colors.primary} />
                        <Text style={styles.infoText}>
                            Los cambios se aplicarán inmediatamente en tu Discovery
                        </Text>
                    </View>

                    {/* Botón de Guardar */}
                    <View style={styles.footer}>
                        <Pressable
                            style={[styles.saveButton, { backgroundColor: colors.primary }]}
                            onPress={handleSave}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <>
                                    <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                    <Ionicons name="checkmark-circle" size={24} color="#FFF" />
                                </>
                            )}
                        </Pressable>
                    </View>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 16,
        backgroundColor: '#FFF',
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
    scrollView: {
        flex: 1,
    },
    content: {
        padding: 24,
        paddingBottom: 24,
    },
    iconContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#181113',
        textAlign: 'center',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: '#6B7280',
        textAlign: 'center',
        marginBottom: 32,
        lineHeight: 24,
    },
    section: {
        marginBottom: 32,
    },
    sectionTitle: {
        fontSize: 11,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    genderGrid: {
        flexDirection: 'row',
        gap: 12,
    },
    genderCard: {
        flex: 1,
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: '#E5E7EB',
        position: 'relative',
    },
    genderEmoji: {
        fontSize: 40,
    },
    genderLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#181113',
    },
    checkmark: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    rangeHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
        gap: 12,
    },
    rangeText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#181113',
    },
    rangeSeparator: {
        fontSize: 24,
        color: '#9CA3AF',
    },
    sliderContainer: {
        marginBottom: 20,
    },
    sliderLabel: {
        fontSize: 14,
        color: '#6B7280',
        marginBottom: 8,
        fontWeight: '500',
    },
    slider: {
        width: '100%',
        height: 40,
    },
    distanceHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        gap: 8,
    },
    distanceValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#181113',
    },
    distanceLabels: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 8,
    },
    distanceLabel: {
        fontSize: 12,
        color: '#9CA3AF',
    },
    infoBox: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 120,
        paddingTop: 16,
        backgroundColor: '#F8F6F6',
    },
    saveButton: {
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FFF',
        fontSize: 17,
        fontWeight: '700',
    },
});
