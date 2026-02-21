import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

interface UserCardProps {
    id: string;
    name: string;
    age?: number;
    avatar?: string;
    bio?: string;
    compatibility: number;
    distance?: number;
    interests: string[];
    isOnline?: boolean;
    onPress: () => void;
    onLike?: () => void;
}

export function UserCard({
    name,
    age,
    avatar,
    bio,
    compatibility,
    distance,
    interests,
    isOnline,
    onPress,
    onLike,
}: UserCardProps) {
    const getCompatibilityColor = (score: number) => {
        if (score >= 80) return ['#10B981', '#059669']; // Verde
        if (score >= 60) return ['#F59E0B', '#D97706']; // Naranja
        return ['#EF4444', '#DC2626']; // Rojo
    };

    const getCompatibilityEmoji = (score: number) => {
        if (score >= 90) return '🔥';
        if (score >= 80) return '✨';
        if (score >= 70) return '💫';
        if (score >= 60) return '⭐';
        return '💭';
    };

    return (
        <Pressable style={styles.card} onPress={onPress}>
            {/* Header con Avatar */}
            <View style={styles.header}>
                <View style={styles.avatarContainer}>
                    {avatar ? (
                        <Image source={{ uri: avatar }} style={styles.avatar} />
                    ) : (
                        <View style={styles.avatarPlaceholder}>
                            <Ionicons name="person" size={32} color="#667eea" />
                        </View>
                    )}
                    {isOnline && <View style={styles.onlineBadge} />}
                </View>

                <View style={styles.headerInfo}>
                    <View style={styles.nameRow}>
                        <Text style={styles.name}>{name}</Text>
                        {age && <Text style={styles.age}>, {age}</Text>}
                    </View>
                    {distance && (
                        <View style={styles.locationRow}>
                            <Ionicons name="location" size={14} color="#718096" />
                            <Text style={styles.distance}>{distance} km de distancia</Text>
                        </View>
                    )}
                </View>

                {onLike && (
                    <Pressable
                        style={styles.likeButton}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            onLike();
                        }}
                    >
                        <Ionicons name="heart-outline" size={24} color="#FF6B9D" />
                    </Pressable>
                )}
            </View>

            {/* Bio */}
            {bio && (
                <Text style={styles.bio} numberOfLines={2}>
                    {bio}
                </Text>
            )}

            {/* Intereses */}
            {interests.length > 0 && (
                <View style={styles.interestsContainer}>
                    {interests.slice(0, 3).map((interest, index) => (
                        <View key={index} style={styles.interestTag}>
                            <Text style={styles.interestText}>{interest}</Text>
                        </View>
                    ))}
                    {interests.length > 3 && (
                        <View style={styles.interestTag}>
                            <Text style={styles.interestText}>+{interests.length - 3}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Barra de Compatibilidad */}
            <View style={styles.compatibilityContainer}>
                <View style={styles.compatibilityHeader}>
                    <Text style={styles.compatibilityLabel}>
                        {getCompatibilityEmoji(compatibility)} Compatibilidad
                    </Text>
                    <Text style={styles.compatibilityScore}>{compatibility}%</Text>
                </View>
                <View style={styles.progressBar}>
                    <LinearGradient
                        colors={getCompatibilityColor(compatibility)}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={[styles.progressFill, { width: `${compatibility}%` }]}
                    />
                </View>
            </View>

            {/* Footer con acciones */}
            <View style={styles.footer}>
                <Pressable style={styles.actionButton} onPress={onPress}>
                    <Ionicons name="eye-outline" size={18} color="#667eea" />
                    <Text style={styles.actionText}>Ver Perfil</Text>
                </Pressable>
                <Pressable style={styles.actionButton} onPress={onPress}>
                    <Ionicons name="chatbubble-outline" size={18} color="#667eea" />
                    <Text style={styles.actionText}>Mensaje</Text>
                </Pressable>
            </View>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#F3F4F6',
    },
    avatarPlaceholder: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#EEF2FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    onlineBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#10B981',
        borderWidth: 2,
        borderColor: '#FFF',
    },
    headerInfo: {
        flex: 1,
        marginLeft: 12,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'baseline',
        marginBottom: 4,
    },
    name: {
        fontSize: 18,
        fontWeight: '700',
        color: '#2D3748',
    },
    age: {
        fontSize: 16,
        fontWeight: '400',
        color: '#718096',
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    distance: {
        fontSize: 13,
        color: '#718096',
    },
    likeButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF0F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bio: {
        fontSize: 14,
        color: '#4A5568',
        lineHeight: 20,
        marginBottom: 12,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    interestTag: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    interestText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#667eea',
    },
    compatibilityContainer: {
        marginBottom: 12,
    },
    compatibilityHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    compatibilityLabel: {
        fontSize: 13,
        fontWeight: '600',
        color: '#4A5568',
    },
    compatibilityScore: {
        fontSize: 16,
        fontWeight: '700',
        color: '#667eea',
    },
    progressBar: {
        height: 6,
        backgroundColor: '#E2E8F0',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressFill: {
        height: '100%',
        borderRadius: 3,
    },
    footer: {
        flexDirection: 'row',
        gap: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F3F4F6',
    },
    actionButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 10,
        backgroundColor: '#F7FAFC',
        borderRadius: 10,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#667eea',
    },
});
