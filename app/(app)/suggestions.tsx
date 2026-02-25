import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { useTheme } from '@/shared/hooks/useTheme';
import * as Haptics from 'expo-haptics';

type SuggestionType = 'feature' | 'bug' | 'improvement' | 'other';
type SuggestionStatus = 'pending' | 'reviewing' | 'planned' | 'implemented' | 'rejected';

interface Suggestion {
    id: string;
    suggestion_type: SuggestionType;
    title: string;
    description: string;
    status: SuggestionStatus;
    created_at: string;
}

const SUGGESTION_TYPES = [
    { value: 'feature', label: 'Nueva Función', icon: 'bulb', color: '#10B981' },
    { value: 'bug', label: 'Reportar Bug', icon: 'bug', color: '#EF4444' },
    { value: 'improvement', label: 'Mejora', icon: 'trending-up', color: '#3B82F6' },
    { value: 'other', label: 'Otro', icon: 'chatbubble', color: '#8B5CF6' },
];

const STATUS_CONFIG = {
    pending: { label: 'Pendiente', color: '#9CA3AF', icon: 'time' },
    reviewing: { label: 'En Revisión', color: '#3B82F6', icon: 'eye' },
    planned: { label: 'Planificado', color: '#F59E0B', icon: 'calendar' },
    implemented: { label: 'Implementado', color: '#10B981', icon: 'checkmark-circle' },
    rejected: { label: 'Rechazado', color: '#EF4444', icon: 'close-circle' },
};

export default function SuggestionsScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const { colors } = useTheme();
    const [showForm, setShowForm] = useState(false);
    const [selectedType, setSelectedType] = useState<SuggestionType>('feature');
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [loading, setLoading] = useState(false);
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loadingSuggestions, setLoadingSuggestions] = useState(true);

    useEffect(() => {
        loadMySuggestions();
    }, []);

    const loadMySuggestions = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('user_suggestions')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setSuggestions(data || []);
        } catch (error) {
            console.error('Error loading suggestions:', error);
        } finally {
            setLoadingSuggestions(false);
        }
    };

    const handleSubmit = async () => {
        if (!user) return;

        if (title.trim().length < 3) {
            Alert.alert('Error', 'El título debe tener al menos 3 caracteres');
            return;
        }

        if (description.trim().length < 10) {
            Alert.alert('Error', 'La descripción debe tener al menos 10 caracteres');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase
                .from('user_suggestions')
                .insert({
                    user_id: user.id,
                    suggestion_type: selectedType,
                    title: title.trim(),
                    description: description.trim(),
                });

            if (error) {
                if (error.message.includes('límite')) {
                    Alert.alert('Límite Alcanzado', 'Has alcanzado el límite de 5 sugerencias por día. Intenta mañana.');
                } else {
                    throw error;
                }
                return;
            }

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('¡Gracias!', 'Tu sugerencia ha sido enviada. La revisaremos pronto.');

            setTitle('');
            setDescription('');
            setShowForm(false);
            loadMySuggestions();
        } catch (error) {
            console.error('Error submitting suggestion:', error);
            Alert.alert('Error', 'No se pudo enviar la sugerencia. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Hoy';
        if (diffDays === 1) return 'Ayer';
        if (diffDays < 7) return `Hace ${diffDays} días`;

        return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    };

    return (
        <View style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#181113" />
                    </Pressable>
                    <Text style={styles.headerTitle}>SUGERENCIAS</Text>
                    <Pressable
                        style={styles.addButton}
                        onPress={() => {
                            setShowForm(!showForm);
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        }}
                    >
                        <Ionicons name={showForm ? "close" : "add"} size={24} color={colors.primary} />
                    </Pressable>
                </View>

                <KeyboardAvoidingView
                    style={{ flex: 1 }}
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                >
                    <ScrollView
                        contentContainerStyle={styles.scrollContent}
                        showsVerticalScrollIndicator={false}
                    >
                        {showForm && (
                            <View style={styles.formCard}>
                                <Text style={styles.formTitle}>Nueva Sugerencia</Text>

                                <Text style={styles.label}>Tipo</Text>
                                <View style={styles.typeGrid}>
                                    {SUGGESTION_TYPES.map((type) => (
                                        <Pressable
                                            key={type.value}
                                            style={[
                                                styles.typeButton,
                                                selectedType === type.value && {
                                                    backgroundColor: type.color + '20',
                                                    borderColor: type.color,
                                                    borderWidth: 2
                                                }
                                            ]}
                                            onPress={() => {
                                                setSelectedType(type.value as SuggestionType);
                                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                            }}
                                        >
                                            <Ionicons
                                                name={type.icon as any}
                                                size={24}
                                                color={selectedType === type.value ? type.color : '#9CA3AF'}
                                            />
                                            <Text style={[
                                                styles.typeLabel,
                                                selectedType === type.value && { color: type.color, fontWeight: '600' }
                                            ]}>
                                                {type.label}
                                            </Text>
                                        </Pressable>
                                    ))}
                                </View>

                                <Text style={styles.label}>Título</Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: Agregar modo oscuro"
                                    placeholderTextColor="#9CA3AF"
                                    value={title}
                                    onChangeText={setTitle}
                                    maxLength={100}
                                />
                                <Text style={styles.charCount}>{title.length}/100</Text>

                                <Text style={styles.label}>Descripción</Text>
                                <TextInput
                                    style={[styles.input, styles.textArea]}
                                    placeholder="Describe tu sugerencia con detalle..."
                                    placeholderTextColor="#9CA3AF"
                                    value={description}
                                    onChangeText={setDescription}
                                    maxLength={1000}
                                    multiline
                                    numberOfLines={6}
                                    textAlignVertical="top"
                                />
                                <Text style={styles.charCount}>{description.length}/1000</Text>

                                <Pressable
                                    style={[styles.submitButton, { backgroundColor: colors.primary }]}
                                    onPress={handleSubmit}
                                    disabled={loading}
                                >
                                    <Text style={styles.submitButtonText}>
                                        {loading ? 'Enviando...' : 'Enviar Sugerencia'}
                                    </Text>
                                </Pressable>
                            </View>
                        )}

                        <Text style={styles.sectionTitle}>MIS SUGERENCIAS</Text>

                        {loadingSuggestions ? (
                            <Text style={styles.emptyText}>Cargando...</Text>
                        ) : suggestions.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Ionicons name="bulb-outline" size={64} color="#D1D5DB" />
                                <Text style={styles.emptyText}>No has enviado sugerencias</Text>
                                <Text style={styles.emptySubtext}>
                                    Ayúdanos a mejorar la app compartiendo tus ideas
                                </Text>
                            </View>
                        ) : (
                            suggestions.map((suggestion) => {
                                const typeConfig = SUGGESTION_TYPES.find(t => t.value === suggestion.suggestion_type);
                                const statusConfig = STATUS_CONFIG[suggestion.status];

                                return (
                                    <View key={suggestion.id} style={styles.suggestionCard}>
                                        <View style={styles.suggestionHeader}>
                                            <View style={[styles.typeTag, { backgroundColor: typeConfig?.color + '20' }]}>
                                                <Ionicons name={typeConfig?.icon as any} size={14} color={typeConfig?.color} />
                                                <Text style={[styles.typeTagText, { color: typeConfig?.color }]}>
                                                    {typeConfig?.label}
                                                </Text>
                                            </View>
                                            <View style={[styles.statusTag, { backgroundColor: statusConfig.color + '20' }]}>
                                                <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                                <Text style={[styles.statusText, { color: statusConfig.color }]}>
                                                    {statusConfig.label}
                                                </Text>
                                            </View>
                                        </View>

                                        <Text style={styles.suggestionTitle}>{suggestion.title}</Text>
                                        <Text style={styles.suggestionDescription} numberOfLines={3}>
                                            {suggestion.description}
                                        </Text>

                                        <Text style={styles.suggestionDate}>
                                            {formatDate(suggestion.created_at)}
                                        </Text>
                                    </View>
                                );
                            })
                        )}

                        <View style={{ height: 120 }} />
                    </ScrollView>
                </KeyboardAvoidingView>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#F4F0F2',
    },
    backButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#181113',
    },
    addButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        padding: 20,
    },
    formCard: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    formTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#181113',
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#181113',
        marginBottom: 8,
        marginTop: 12,
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 8,
    },
    typeButton: {
        flex: 1,
        minWidth: '45%',
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        gap: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    typeLabel: {
        fontSize: 12,
        color: '#6B7280',
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#F9FAFB',
        borderRadius: 12,
        padding: 16,
        fontSize: 15,
        color: '#181113',
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    textArea: {
        height: 120,
        paddingTop: 16,
    },
    charCount: {
        fontSize: 11,
        color: '#9CA3AF',
        textAlign: 'right',
        marginTop: 4,
    },
    submitButton: {
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 20,
    },
    submitButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    sectionTitle: {
        fontSize: 12,
        fontWeight: '700',
        letterSpacing: 1.5,
        color: '#6B7280',
        marginBottom: 16,
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#6B7280',
        marginTop: 16,
    },
    emptySubtext: {
        fontSize: 14,
        color: '#9CA3AF',
        marginTop: 8,
        textAlign: 'center',
        paddingHorizontal: 40,
    },
    suggestionCard: {
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
    suggestionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    typeTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
    },
    typeTagText: {
        fontSize: 12,
        fontWeight: '600',
    },
    statusTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '600',
    },
    suggestionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#181113',
        marginBottom: 8,
    },
    suggestionDescription: {
        fontSize: 14,
        color: '#6B7280',
        lineHeight: 20,
        marginBottom: 12,
    },
    suggestionDate: {
        fontSize: 12,
        color: '#9CA3AF',
    },
});
