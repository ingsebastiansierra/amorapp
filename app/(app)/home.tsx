import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, Animated, ScrollView, Image, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { avatarService } from '@/core/services/avatarService';
import { useTheme } from '@/shared/hooks/useTheme';
import { ProfileProgressCard } from '@/shared/components/ProfileProgressCard';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

// Componente de burbuja animada
const AnimatedBubble = ({ user, bubbleSize, borderColor, position, onPress }: any) => {
    const pulseAnim = React.useRef(new Animated.Value(1)).current;

    React.useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, {
                    toValue: 1.08,
                    duration: 800,
                    useNativeDriver: true,
                }),
                Animated.timing(pulseAnim, {
                    toValue: 1,
                    duration: 800,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    const age = user.birth_date
        ? new Date().getFullYear() - new Date(user.birth_date).getFullYear()
        : undefined;

    return (
        <Pressable
            key={user.id}
            style={[styles.bubbleAbsolute, position]}
            onPress={onPress}
        >
            <Animated.View style={[styles.bubbleInner, {
                width: bubbleSize,
                height: bubbleSize,
                borderColor,
                borderWidth: 4,
                transform: [{ scale: pulseAnim }]
            }]}>
                {user.avatar_url ? (
                    <Image
                        source={{ uri: avatarService.getAvatarUrl(user.avatar_url) || undefined }}
                        style={styles.bubbleImage}
                    />
                ) : (
                    <View style={styles.bubblePlaceholder}>
                        <Ionicons name="person" size={bubbleSize * 0.4} color="#667eea" />
                    </View>
                )}
                {user.is_online && <View style={styles.bubbleOnline} />}

                {/* Porcentaje dentro de la burbuja */}
                <View style={styles.bubblePercentage}>
                    <Text style={styles.bubblePercentageText}>
                        {user.compatibility}%
                    </Text>
                </View>
            </Animated.View>

            <View style={[styles.bubbleInfo, { width: bubbleSize + 30 }]}>
                <Text style={styles.bubbleName} numberOfLines={1}>
                    {user.name}, {age}
                </Text>
            </View>
        </Pressable>
    );
};

interface UserIntention {
    intention_type: 'make_friends' | 'dating' | 'casual' | 'activity_partner' | 'just_talk';
    activity?: string;
    availability: 'now' | 'today' | 'this_week' | 'flexible';
}

interface UserInterests {
    music_favorite_artist: string | null;
    entertainment_favorite_movie: string | null;
    sports_favorite_sport: string | null;
    food_favorite_food: string | null;
    lifestyle_favorite_color: string | null;
    profile_completed: boolean;
}

interface NearbyUser {
    id: string;
    name: string;
    avatar_url: string | null;
    bio: string | null;
    birth_date: string | null;
    gender: string;
    compatibility: number;
    interests: string[];
    distance: number;
    is_online: boolean;
    intention?: UserIntention;
}

export default function HomeScreen() {
    const { signOut, user } = useAuthStore();
    const router = useRouter();
    const { colors } = useTheme();
    const [showMenu, setShowMenu] = useState(false);
    const [myProfile, setMyProfile] = useState<{ name: string; avatar_url: string | null } | null>(null);
    const [userInterests, setUserInterests] = useState<UserInterests | null>(null);
    const [nearbyUsers, setNearbyUsers] = useState<NearbyUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [selectedIntention, setSelectedIntention] = useState<string>('all');
    const menuSlide = React.useRef(new Animated.Value(300)).current;
    const gradientAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animación continua del degradado cambiando colores
        Animated.loop(
            Animated.sequence([
                Animated.timing(gradientAnim, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: false,
                }),
                Animated.timing(gradientAnim, {
                    toValue: 0,
                    duration: 4000,
                    useNativeDriver: false,
                }),
            ])
        ).start();
    }, []);

    useEffect(() => {
        loadMyProfile();
        loadUserInterests();
        loadNearbyUsers();
    }, []);

    useFocusEffect(
        React.useCallback(() => {
            loadUserInterests();
            loadNearbyUsers();
        }, [])
    );

    useEffect(() => {
        if (showMenu) {
            Animated.spring(menuSlide, {
                toValue: 0,
                useNativeDriver: true,
                damping: 20,
            }).start();
        } else {
            Animated.timing(menuSlide, {
                toValue: 300,
                duration: 200,
                useNativeDriver: true,
            }).start();
        }
    }, [showMenu]);

    const loadMyProfile = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('name, avatar_url')
                .eq('id', user.id)
                .maybeSingle();

            if (data) {
                setMyProfile(data);
            }
        } catch (error) {
            console.error('Error loading profile:', error);
        }
    };

    const loadUserInterests = async () => {
        if (!user) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('user_interests')
                .select('music_favorite_artist, entertainment_favorite_movie, sports_favorite_sport, food_favorite_food, lifestyle_favorite_color, profile_completed')
                .eq('user_id', user.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') {
                console.error('Error loading interests:', error);
            }

            setUserInterests(data);
        } catch (error) {
            console.error('Error loading interests:', error);
        } finally {
            setLoading(false);
        }
    };

    const calculateProgress = () => {
        if (!userInterests) return 0;

        const fields = [
            userInterests.music_favorite_artist,
            userInterests.entertainment_favorite_movie,
            userInterests.sports_favorite_sport,
            userInterests.food_favorite_food,
            userInterests.lifestyle_favorite_color,
        ];

        const completed = fields.filter(field => field !== null && field !== '').length;
        return (completed / fields.length) * 100;
    };

    const questionnaires = [
        {
            id: 'music',
            title: 'Música',
            icon: 'musical-notes' as const,
            completed: !!userInterests?.music_favorite_artist,
            route: '/(onboarding)/music',
        },
        {
            id: 'entertainment',
            title: 'Entretenimiento',
            icon: 'film' as const,
            completed: !!userInterests?.entertainment_favorite_movie,
            route: '/(onboarding)/entertainment',
        },
        {
            id: 'sports',
            title: 'Deportes',
            icon: 'football' as const,
            completed: !!userInterests?.sports_favorite_sport,
            route: '/(onboarding)/sports',
        },
        {
            id: 'food',
            title: 'Comida',
            icon: 'restaurant' as const,
            completed: !!userInterests?.food_favorite_food,
            route: '/(onboarding)/food',
        },
        {
            id: 'lifestyle',
            title: 'Estilo de Vida',
            icon: 'heart' as const,
            completed: !!userInterests?.lifestyle_favorite_color,
            route: '/(onboarding)/lifestyle',
        },
    ];

    const handleQuestionnairePress = (route: string) => {
        router.push(route as any);
    };

    const handleSignOut = async () => {
        await signOut();
        router.replace('/(auth)/login');
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await Promise.all([
            loadUserInterests(),
            loadNearbyUsers(),
        ]);
        setRefreshing(false);
    };

    const handleUserPress = (userId: string) => {
        console.log('Ver perfil:', userId);
    };

    const handleUserLike = (userId: string) => {
        console.log('Like a usuario:', userId);
    };

    const progress = calculateProgress();
    const isProfileComplete = progress === 100;

    const loadNearbyUsers = async () => {
        if (!user) return;

        try {
            const { data: users, error } = await supabase
                .from('users')
                .select(`
                    id, name, avatar_url, bio, birth_date, gender, last_active
                `)
                .neq('id', user.id)
                .eq('is_available', true)
                .limit(50);

            if (error) throw error;

            const userIds = users?.map(u => u.id) || [];
            const { data: intentions } = await supabase
                .from('user_intentions')
                .select('user_id, intention_type, activity, availability')
                .in('user_id', userIds)
                .eq('is_active', true);

            const intentionsMap = new Map(
                intentions?.map(i => [i.user_id, i]) || []
            );

            const usersWithData: NearbyUser[] = (users || []).map(u => {
                const isOnline = u.last_active ?
                    (new Date().getTime() - new Date(u.last_active).getTime()) < 5 * 60 * 1000 : false;

                return {
                    id: u.id,
                    name: u.name,
                    avatar_url: u.avatar_url,
                    bio: u.bio,
                    birth_date: u.birth_date,
                    gender: u.gender,
                    compatibility: Math.floor(Math.random() * 40) + 60,
                    interests: ['Música', 'Deportes', 'Viajes'],
                    distance: Math.floor(Math.random() * 50) + 1,
                    is_online: isOnline,
                    intention: intentionsMap.get(u.id),
                };
            });

            setNearbyUsers(usersWithData);
        } catch (error) {
            console.error('Error loading nearby users:', error);
        }
    };

    const filteredUsers = nearbyUsers.filter(u =>
        selectedIntention === 'all' || u.intention?.intention_type === selectedIntention
    );

    // Opacidad animada para transición entre gradientes
    const opacity1 = gradientAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [1, 0, 1],
    });

    const opacity2 = gradientAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: [0, 1, 0],
    });

    return (
        <View style={styles.container}>
            <View style={StyleSheet.absoluteFill}>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity1 }]}>
                    <LinearGradient
                        colors={['#FF6B9D', '#C471ED', '#667eea']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
                <Animated.View style={[StyleSheet.absoluteFill, { opacity: opacity2 }]}>
                    <LinearGradient
                        colors={['#667eea', '#f093fb', '#FF6B9D']}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                    />
                </Animated.View>
            </View>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {/* Header fijo */}
                <View style={styles.header}>
                    <View style={styles.headerTop}>
                        <View style={styles.headerTitleContainer}>
                            <Text style={styles.headerTitle}>Aura</Text>
                            <Ionicons name="flame" size={32} color="#FF6B9D" style={styles.headerFlame} />
                        </View>
                        <Pressable onPress={() => setShowMenu(true)} style={styles.menuButton}>
                            <Ionicons name="menu" size={28} color="#2D3748" />
                        </Pressable>
                    </View>

                    {/* Filtros de intención */}
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={styles.intentionFilters}
                        contentContainerStyle={styles.intentionFiltersContent}
                    >
                        <Pressable
                            style={[styles.intentionChip, selectedIntention === 'all' && styles.intentionChipActive]}
                            onPress={() => setSelectedIntention('all')}
                        >
                            <Text style={[styles.intentionChipText, selectedIntention === 'all' && styles.intentionChipTextActive]}>
                                Todos
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.intentionChip, selectedIntention === 'dating' && styles.intentionChipActive]}
                            onPress={() => setSelectedIntention('dating')}
                        >
                            <Text style={[styles.intentionChipText, selectedIntention === 'dating' && styles.intentionChipTextActive]}>
                                Salir
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.intentionChip, selectedIntention === 'casual' && styles.intentionChipActive]}
                            onPress={() => setSelectedIntention('casual')}
                        >
                            <Text style={[styles.intentionChipText, selectedIntention === 'casual' && styles.intentionChipTextActive]}>
                                Algo casual
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.intentionChip, selectedIntention === 'just_talk' && styles.intentionChipActive]}
                            onPress={() => setSelectedIntention('just_talk')}
                        >
                            <Text style={[styles.intentionChipText, selectedIntention === 'just_talk' && styles.intentionChipTextActive]}>
                                Solo platicar
                            </Text>
                        </Pressable>

                        <Pressable
                            style={[styles.intentionChip, selectedIntention === 'make_friends' && styles.intentionChipActive]}
                            onPress={() => setSelectedIntention('make_friends')}
                        >
                            <Text style={[styles.intentionChipText, selectedIntention === 'make_friends' && styles.intentionChipTextActive]}>
                                Amigos
                            </Text>
                        </Pressable>
                    </ScrollView>
                </View>

                <ScrollView
                    style={styles.scrollView}
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor="#667eea"
                        />
                    }
                >
                    {loading ? (
                        <View style={styles.loadingState}>
                            <Text style={styles.loadingText}>Cargando...</Text>
                        </View>
                    ) : (
                        <>
                            {!isProfileComplete && (
                                <>
                                    <ProfileProgressCard
                                        progress={progress}
                                        questionnaires={questionnaires}
                                        onQuestionnairePress={handleQuestionnairePress}
                                    />
                                    <View style={styles.motivationCard}>
                                        <Text style={styles.motivationEmoji}>✨</Text>
                                        <Text style={styles.motivationText}>
                                            Completa tu perfil para ver personas compatibles
                                        </Text>
                                    </View>
                                </>
                            )}

                            {isProfileComplete && (
                                <>
                                    <Text style={{ padding: 20, fontSize: 14, color: '#666' }}>
                                        Usuarios encontrados: {filteredUsers.length}
                                    </Text>
                                    {filteredUsers.length === 0 ? (
                                        <View style={styles.emptyFeed}>
                                            <Text style={styles.emptyFeedEmoji}>🔍</Text>
                                            <Text style={styles.emptyFeedTitle}>
                                                No hay personas con esta intención
                                            </Text>
                                            <Text style={styles.emptyFeedSubtitle}>
                                                Intenta con otro filtro
                                            </Text>
                                        </View>
                                    ) : (
                                        <ScrollView
                                            horizontal
                                            showsHorizontalScrollIndicator={false}
                                            style={styles.bubblesScroll}
                                        >
                                            <View style={styles.bubblesContainer}>
                                                {filteredUsers.map((user, index) => {
                                                    const age = user.birth_date
                                                        ? new Date().getFullYear() - new Date(user.birth_date).getFullYear()
                                                        : undefined;

                                                    const baseSize = 50;
                                                    const maxSize = 110;
                                                    const bubbleSize = baseSize + ((user.compatibility / 100) * (maxSize - baseSize));

                                                    // Distribución en grid con variación para evitar superposición
                                                    const cols = 4;
                                                    const spacing = 160;
                                                    const col = index % cols;
                                                    const row = Math.floor(index / cols);

                                                    // Añadir variación aleatoria basada en el ID para que no sea tan rígido
                                                    const seed = user.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                                                    const offsetX = ((seed * 17) % 30) - 15; // -15 a +15
                                                    const offsetY = ((seed * 23) % 30) - 15; // -15 a +15

                                                    const position = {
                                                        left: col * spacing + offsetX + 40,
                                                        top: row * spacing + offsetY + 40,
                                                    };

                                                    const borderColor = user.compatibility >= 90
                                                        ? '#EC4899'
                                                        : user.compatibility >= 80
                                                            ? '#F59E0B'
                                                            : user.compatibility >= 70
                                                                ? '#10B981'
                                                                : '#3B82F6';

                                                    return (
                                                        <AnimatedBubble
                                                            key={user.id}
                                                            user={user}
                                                            bubbleSize={bubbleSize}
                                                            borderColor={borderColor}
                                                            position={position}
                                                            onPress={() => handleUserPress(user.id)}
                                                        />
                                                    );
                                                })}
                                            </View>
                                        </ScrollView>
                                    )}
                                </>
                            )}
                        </>
                    )}
                </ScrollView>

                {/* Modal de menú */}
                <Modal
                    visible={showMenu}
                    transparent
                    animationType="fade"
                    onRequestClose={() => setShowMenu(false)}
                >
                    <Pressable style={styles.modalOverlay} onPress={() => setShowMenu(false)}>
                        <Animated.View style={[styles.menuContainer, { transform: [{ scale: menuSlide.interpolate({ inputRange: [0, 300], outputRange: [1, 0.8] }) }], opacity: menuSlide.interpolate({ inputRange: [0, 300], outputRange: [1, 0] }) }]}>
                            <View style={styles.menuHeader}>
                                <Text style={styles.menuTitle}>Mi Perfil</Text>
                                <Text style={styles.menuEmail}>{user?.email || 'Usuario'}</Text>
                            </View>

                            <Pressable style={styles.menuItem} onPress={() => {
                                setShowMenu(false);
                                router.push('/(app)/profile');
                            }}>
                                <Ionicons name="person-circle-outline" size={28} color="#667eea" style={{ marginRight: 12 }} />
                                <Text style={styles.menuItemText}>Ver Perfil Completo</Text>
                            </Pressable>

                            <Pressable style={styles.menuItem} onPress={() => {
                                setShowMenu(false);
                                router.push('/(app)/link-partner');
                            }}>
                                <Ionicons name="heart-circle-outline" size={28} color="#667eea" style={{ marginRight: 12 }} />
                                <Text style={styles.menuItemText}>Vincular Pareja</Text>
                            </Pressable>

                            <Pressable
                                style={[styles.menuItem, styles.menuItemDanger]}
                                onPress={() => {
                                    setShowMenu(false);
                                    handleSignOut();
                                }}
                            >
                                <Ionicons name="log-out-outline" size={28} color="#E53E3E" style={{ marginRight: 12 }} />
                                <Text style={[styles.menuItemText, styles.menuItemTextDanger]}>
                                    Cerrar Sesión
                                </Text>
                            </Pressable>

                            <Pressable style={styles.menuClose} onPress={() => setShowMenu(false)}>
                                <Text style={styles.menuCloseText}>Cancelar</Text>
                            </Pressable>
                        </Animated.View>
                    </Pressable>
                </Modal>
            </SafeAreaView >
        </View >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollView: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    header: {
        backgroundColor: '#FFF',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
        zIndex: 10,
    },
    headerTop: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    headerTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: '#2D3748',
        letterSpacing: -0.5,
    },
    headerFlame: {
        marginTop: 4,
    },
    headerSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        color: '#EC4899',
        letterSpacing: 1,
        marginTop: 2,
    },
    menuButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    intentionFilters: {
        marginTop: 8,
    },
    intentionFiltersContent: {
        paddingRight: 20,
        gap: 8,
    },
    intentionChip: {
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        marginRight: 8,
    },
    intentionChipActive: {
        backgroundColor: '#EC4899',
    },
    intentionChipText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    intentionChipTextActive: {
        color: '#FFF',
    },
    loadingState: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 100,
    },
    loadingText: {
        fontSize: 16,
        color: '#718096',
    },
    motivationCard: {
        backgroundColor: '#EEF2FF',
        borderRadius: 16,
        padding: 20,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginHorizontal: 16,
        marginTop: 16,
    },
    motivationEmoji: {
        fontSize: 32,
    },
    motivationText: {
        flex: 1,
        fontSize: 14,
        color: '#4C51BF',
        lineHeight: 20,
        fontWeight: '500',
    },
    emptyFeed: {
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 40,
    },
    emptyFeedEmoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyFeedTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptyFeedSubtitle: {
        fontSize: 14,
        color: '#718096',
        textAlign: 'center',
        lineHeight: 20,
    },
    bubblesScroll: {
        marginTop: 0,
        backgroundColor: 'transparent',
    },
    bubblesContainer: {
        height: 2000,
        position: 'relative',
        width: 1000,
        paddingHorizontal: 20,
        backgroundColor: 'transparent',
    },
    bubbleAbsolute: {
        position: 'absolute',
        alignItems: 'center',
    },
    bubbleInner: {
        borderRadius: 1000,
        overflow: 'hidden',
        backgroundColor: '#FFF',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 12,
        elevation: 8,
    },
    bubbleImage: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    bubblePlaceholder: {
        width: '100%',
        height: '100%',
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bubbleOnline: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        width: 16,
        height: 16,
        borderRadius: 8,
        backgroundColor: '#10B981',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    bubblePercentage: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    bubblePercentageText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    bubbleInfo: {
        marginTop: 8,
        alignItems: 'center',
        width: '100%',
    },
    bubbleName: {
        fontSize: 13,
        fontWeight: '700',
        color: '#2D3748',
        textAlign: 'center',
    },
    bubbleAge: {
        fontSize: 11,
        fontWeight: '500',
        color: '#718096',
        marginTop: 2,
    },
    bubbleMatch: {
        fontSize: 12,
        fontWeight: '700',
        color: '#667eea',
        marginTop: 4,
    },
    topMatchBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EC4899',
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: 10,
        marginTop: 4,
        gap: 3,
    },
    topMatchText: {
        fontSize: 8,
        fontWeight: '800',
        color: '#FFF',
        letterSpacing: 0.5,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    menuContainer: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        paddingTop: 24,
        paddingBottom: 24,
        paddingHorizontal: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 24,
        elevation: 12,
    },
    menuHeader: {
        marginBottom: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F3F4F6',
    },
    menuTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 4,
    },
    menuEmail: {
        fontSize: 14,
        color: '#718096',
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 16,
        paddingHorizontal: 16,
        borderRadius: 16,
        marginBottom: 12,
        backgroundColor: '#F9FAFB',
    },
    menuItemText: {
        fontSize: 16,
        color: '#2D3748',
        fontWeight: '500',
    },
    menuItemDanger: {
        backgroundColor: '#FEF2F2',
        marginTop: 8,
    },
    menuItemTextDanger: {
        color: '#E53E3E',
    },
    menuClose: {
        marginTop: 8,
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: '#F3F4F6',
    },
    menuCloseText: {
        fontSize: 16,
        color: '#6B7280',
        fontWeight: '700',
    },
});
