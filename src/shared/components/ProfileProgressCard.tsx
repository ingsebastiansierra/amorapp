import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface QuestionnaireItem {
    id: string;
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    completed: boolean;
    route: string;
}

interface ProfileProgressCardProps {
    progress: number; // 0-100
    questionnaires: QuestionnaireItem[];
    onQuestionnairePress: (route: string) => void;
}

export function ProfileProgressCard({ progress, questionnaires, onQuestionnairePress }: ProfileProgressCardProps) {
    const completedCount = questionnaires.filter(q => q.completed).length;
    const totalCount = questionnaires.length;

    return (
        <View style={styles.card}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeft}>
                    <Text style={styles.emoji}>📝</Text>
                    <View>
                        <Text style={styles.title}>Completa tu Perfil</Text>
                        <Text style={styles.subtitle}>
                            {completedCount} de {totalCount} completados
                        </Text>
                    </View>
                </View>
                <Text style={styles.percentage}>{Math.round(progress)}%</Text>
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressBarFill, { width: `${progress}%` }]}
                    />
                </View>
            </View>

            {/* Questionnaires List */}
            <View style={styles.list}>
                {questionnaires.map((item) => (
                    <Pressable
                        key={item.id}
                        style={[
                            styles.listItem,
                            item.completed && styles.listItemCompleted
                        ]}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            onQuestionnairePress(item.route);
                        }}
                    >
                        <View style={styles.listItemLeft}>
                            <View style={[
                                styles.iconContainer,
                                item.completed && styles.iconContainerCompleted
                            ]}>
                                {item.completed ? (
                                    <Ionicons name="checkmark" size={20} color="#10B981" />
                                ) : (
                                    <Ionicons name={item.icon} size={20} color="#667eea" />
                                )}
                            </View>
                            <Text style={[
                                styles.listItemText,
                                item.completed && styles.listItemTextCompleted
                            ]}>
                                {item.title}
                            </Text>
                        </View>
                        {!item.completed && (
                            <Ionicons name="chevron-forward" size={20} color="#CBD5E0" />
                        )}
                    </Pressable>
                ))}
            </View>

            {/* Call to Action */}
            {progress < 100 && (
                <Pressable
                    style={styles.ctaButton}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        const nextIncomplete = questionnaires.find(q => !q.completed);
                        if (nextIncomplete) {
                            onQuestionnairePress(nextIncomplete.route);
                        }
                    }}
                >
                    <LinearGradient
                        colors={['#667eea', '#764ba2']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.ctaGradient}
                    >
                        <Text style={styles.ctaText}>Continuar Completando</Text>
                        <Ionicons name="arrow-forward" size={20} color="#FFF" />
                    </LinearGradient>
                </Pressable>
            )}

            {progress === 100 && (
                <View style={styles.completedBanner}>
                    <Text style={styles.completedEmoji}>🎉</Text>
                    <Text style={styles.completedText}>¡Perfil 100% Completo!</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    emoji: {
        fontSize: 32,
    },
    title: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 13,
        color: '#718096',
    },
    percentage: {
        fontSize: 28,
        fontWeight: '700',
        color: '#667eea',
    },
    progressBarContainer: {
        marginBottom: 20,
    },
    progressBarBg: {
        height: 8,
        backgroundColor: '#E2E8F0',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 4,
    },
    list: {
        gap: 8,
        marginBottom: 16,
    },
    listItem: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 12,
        paddingHorizontal: 12,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    listItemCompleted: {
        backgroundColor: '#F0FDF4',
        borderColor: '#86EFAC',
    },
    listItemLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1,
    },
    iconContainer: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    iconContainerCompleted: {
        backgroundColor: '#D1FAE5',
    },
    listItemText: {
        fontSize: 15,
        fontWeight: '600',
        color: '#2D3748',
        flex: 1,
    },
    listItemTextCompleted: {
        color: '#059669',
    },
    ctaButton: {
        borderRadius: 12,
        overflow: 'hidden',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    ctaGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 14,
        gap: 8,
    },
    ctaText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    completedBanner: {
        backgroundColor: '#F0FDF4',
        borderRadius: 12,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
    },
    completedEmoji: {
        fontSize: 24,
    },
    completedText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#059669',
    },
});
