import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '@/core/store/useAuthStore';
import { useInterestsStore } from '@/core/store/useInterestsStore';
import { INTENTIONS, type IntentionType } from '@/core/types/interests';

export default function EditIntentionScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const { intention, setIntention, loadIntention } = useInterestsStore();
    const [selectedIntention, setSelectedIntention] = useState<IntentionType | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        loadCurrentIntention();
    }, []);

    const loadCurrentIntention = async () => {
        if (!user) return;

        try {
            await loadIntention(user.id);
            if (intention) {
                setSelectedIntention(intention.intention_type);
            }
        } catch (error) {
            console.error('Error loading intention:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectIntention = (intentionType: IntentionType) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedIntention(intentionType);
    };

    const handleSave = async () => {
        if (!selectedIntention) {
            Alert.alert('Selecciona una opción', 'Por favor elige qué buscas');
            return;
        }

        if (!user) {
            Alert.alert('Error', 'No se encontró el usuario');
            return;
        }

        setSaving(true);
        try {
            await setIntention(user.id, selectedIntention);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
                '¡Listo!',
                'Tu intención se ha actualizado correctamente',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        } catch (error) {
            console.error('Error saving intention:', error);
            Alert.alert('Error', 'No se pudo guardar tu intención');
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
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FF6B9D" />
                <Text style={styles.loadingText}>Cargando...</Text>
            </View>
        );
    }

    return (
        <LinearGradient colors={['#FF6B9D', '#FFA8C5']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header */}
                <View style={styles.header}>
                    <Pressable onPress={handleBack} style={styles.backButton}>
                        <Ionicons name="arrow-back" size={24} color="#FFF" />
                    </Pressable>
                    <Text style={styles.headerTitle}>MI INTENCIÓN</Text>
                    <View style={{ width: 40 }} />
                </View>

                {/* Content */}
                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.content}
                    showsVerticalScrollIndicator={false}
                >
                    <Text style={styles.emoji}>🎯</Text>
                    <Text style={styles.title}>¿Qué buscas?</Text>
                    <Text style={styles.subtitle}>
                        Actualiza tu intención para conectar con las personas indicadas
                    </Text>

                    <View style={styles.optionsContainer}>
                        {(Object.keys(INTENTIONS) as IntentionType[]).map((key) => {
                            const intentionData = INTENTIONS[key];
                            const isSelected = selectedIntention === key;

                            return (
                                <Pressable
                                    key={key}
                                    style={[
                                        styles.optionCard,
                                        isSelected && styles.optionCardSelected,
                                    ]}
                                    onPress={() => handleSelectIntention(key)}
                                >
                                    <View style={styles.optionContent}>
                                        <Text style={styles.optionEmoji}>{intentionData.emoji}</Text>
                                        <View style={styles.optionText}>
                                            <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                                                {intentionData.label}
                                            </Text>
                                            <Text style={[styles.optionDescription, isSelected && styles.optionDescriptionSelected]}>
                                                {intentionData.description}
                                            </Text>
                                        </View>
                                    </View>
                                    {isSelected && (
                                        <Ionicons name="checkmark-circle" size={28} color="#FFF" />
                                    )}
                                </Pressable>
                            );
                        })}
                    </View>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={24} color="#FFF" />
                        <Text style={styles.infoText}>
                            Tu intención se mostrará a otros usuarios y ayudará a encontrar mejores conexiones
                        </Text>
                    </View>
                </ScrollView>

                {/* Footer */}
                <View style={styles.footer}>
                    <Pressable
                        style={styles.saveButton}
                        onPress={handleSave}
                        disabled={saving || !selectedIntention}
                    >
                        {saving ? (
                            <ActivityIndicator color="#FF6B9D" />
                        ) : (
                            <>
                                <Text style={styles.saveButtonText}>Guardar Cambios</Text>
                                <Ionicons name="checkmark-circle" size={24} color="#FF6B9D" />
                            </>
                        )}
                    </Pressable>
                </View>
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
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
        fontSize: 18,
        fontWeight: 'bold',
        letterSpacing: 2,
        color: '#FFF',
    },
    scrollView: {
        flex: 1,
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 120,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
        textAlign: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    subtitle: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        marginBottom: 32,
        lineHeight: 24,
        textAlign: 'center',
    },
    optionsContainer: {
        gap: 16,
    },
    optionCard: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 2,
        borderColor: 'rgba(255, 255, 255, 0.3)',
    },
    optionCardSelected: {
        backgroundColor: '#FFF',
        borderColor: '#FFF',
    },
    optionContent: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 16,
    },
    optionEmoji: {
        fontSize: 40,
    },
    optionText: {
        flex: 1,
    },
    optionLabel: {
        fontSize: 18,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    optionLabelSelected: {
        color: '#FF6B9D',
    },
    optionDescription: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    optionDescriptionSelected: {
        color: '#6B7280',
    },
    infoBox: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginTop: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 14,
        color: '#FFF',
        lineHeight: 20,
    },
    footer: {
        paddingHorizontal: 24,
        paddingBottom: 120,
        paddingTop: 16,
    },
    saveButton: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        paddingVertical: 18,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    saveButtonText: {
        color: '#FF6B9D',
        fontSize: 17,
        fontWeight: '700',
    },
});
