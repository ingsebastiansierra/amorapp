import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Modal, ScrollView, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@core/store/useAuthStore';
import * as Haptics from 'expo-haptics';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const { signIn, enterDemoMode, demoMode } = useAuthStore();
    const router = useRouter();

    // Animaciones para los corazones flotantes
    const heart1Rotate = useRef(new Animated.Value(0)).current;
    const heart1Scale = useRef(new Animated.Value(1)).current;
    const heart2Rotate = useRef(new Animated.Value(0)).current;
    const heart2Scale = useRef(new Animated.Value(1)).current;
    const heart3Rotate = useRef(new Animated.Value(0)).current;
    const heart3Scale = useRef(new Animated.Value(1)).current;
    const logoScale = useRef(new Animated.Value(1)).current;
    const borderRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animación del logo (pulso suave)
        Animated.loop(
            Animated.sequence([
                Animated.timing(logoScale, {
                    toValue: 1.05,
                    duration: 2000,
                    useNativeDriver: true,
                }),
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 2000,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // Animación del borde del formulario (rotación continua)
        Animated.loop(
            Animated.timing(borderRotate, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();

        // Animación corazón 1 (rotación y escala)
        Animated.loop(
            Animated.parallel([
                Animated.timing(heart1Rotate, {
                    toValue: 1,
                    duration: 4000,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(heart1Scale, {
                        toValue: 1.2,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heart1Scale, {
                        toValue: 1,
                        duration: 2000,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();

        // Animación corazón 2 (rotación inversa)
        Animated.loop(
            Animated.parallel([
                Animated.timing(heart2Rotate, {
                    toValue: 1,
                    duration: 5000,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(heart2Scale, {
                        toValue: 1.3,
                        duration: 2500,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heart2Scale, {
                        toValue: 1,
                        duration: 2500,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();

        // Animación corazón 3
        Animated.loop(
            Animated.parallel([
                Animated.timing(heart3Rotate, {
                    toValue: 1,
                    duration: 6000,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.timing(heart3Scale, {
                        toValue: 1.15,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                    Animated.timing(heart3Scale, {
                        toValue: 1,
                        duration: 3000,
                        useNativeDriver: true,
                    }),
                ]),
            ])
        ).start();
    }, []);

    const heart1RotateInterpolate = heart1Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const heart2RotateInterpolate = heart2Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['360deg', '0deg'],
    });

    const heart3RotateInterpolate = heart3Rotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const borderRotateInterpolate = borderRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            router.replace('/(app)/home');
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/(auth)/register');
    };

    const handleDemoMode = () => {
        enterDemoMode();
        router.replace('/(app)/home');
    };

    const handleForgotPassword = async () => {
        if (!resetEmail) {
            Alert.alert('Error', 'Por favor ingresa tu email');
            return;
        }

        setLoading(true);
        try {
            const { error } = await useAuthStore.getState().resetPassword(resetEmail);

            if (error) {
                Alert.alert('Error', error.message);
            } else {
                setShowForgotPassword(false);
                Alert.alert(
                    'Código enviado',
                    'Revisa tu correo, te enviamos un código',
                    [
                        {
                            text: 'OK',
                            onPress: () => {
                                router.push({
                                    pathname: '/(auth)/verify-otp',
                                    params: { email: resetEmail }
                                });
                                setResetEmail('');
                            }
                        }
                    ]
                );
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient
            colors={['#667eea', '#764ba2', '#f093fb']}
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
            >
                {/* Logo y Título */}
                <View style={styles.header}>
                    <View style={styles.logoContainer}>
                        {/* Iconos flotantes animados */}
                        <Animated.View
                            style={[
                                styles.floatingHeart,
                                styles.floatingHeart1,
                                {
                                    transform: [
                                        { rotate: heart1RotateInterpolate },
                                        { scale: heart1Scale },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="heart" size={24} color="#f093fb" />
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.floatingHeart,
                                styles.floatingHeart2,
                                {
                                    transform: [
                                        { rotate: heart2RotateInterpolate },
                                        { scale: heart2Scale },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="chatbubble-ellipses" size={20} color="#a8b5ff" />
                        </Animated.View>

                        <Animated.View
                            style={[
                                styles.floatingHeart,
                                styles.floatingHeart3,
                                {
                                    transform: [
                                        { rotate: heart3RotateInterpolate },
                                        { scale: heart3Scale },
                                    ],
                                },
                            ]}
                        >
                            <Ionicons name="sparkles" size={18} color="#764ba2" />
                        </Animated.View>

                        {/* Logo principal con animación */}
                        <Animated.View
                            style={[
                                styles.logoCircle,
                                {
                                    transform: [{ scale: logoScale }],
                                },
                            ]}
                        >
                            <Ionicons name="people" size={60} color="#667eea" />
                        </Animated.View>
                    </View>
                    <Text style={styles.title}>Palpitos</Text>
                    <Text style={styles.subtitle}>Conéctate con tu persona favorita</Text>
                </View>

                {/* Card de Login */}
                <View style={styles.cardWrapper}>
                    {/* Borde animado con destello */}
                    <Animated.View
                        style={[
                            styles.animatedBorder,
                            {
                                transform: [{ rotate: borderRotateInterpolate }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={['#667eea', '#a8b5ff', '#FFFFFF', '#a8b5ff', '#667eea']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.borderGradient}
                        />
                    </Animated.View>

                    <View style={styles.card}>
                        <Text style={styles.cardTitle}>¡Hola de nuevo!</Text>

                        {demoMode && (
                            <View style={styles.demoWarning}>
                                <Text style={styles.demoWarningText}>⚠️ Modo Demo</Text>
                                <Text style={styles.demoWarningSubtext}>
                                    Configura Supabase para usar la app completa
                                </Text>
                            </View>
                        )}

                        {/* Email Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Correo electrónico</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="tu@email.com"
                                    placeholderTextColor="#CCC"
                                    value={email}
                                    onChangeText={setEmail}
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    editable={!demoMode}
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.passwordHeader}>
                                <Text style={styles.inputLabel}>Contraseña</Text>
                                <Pressable onPress={() => setShowForgotPassword(true)}>
                                    <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                                </Pressable>
                            </View>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="••••••••"
                                    placeholderTextColor="#CCC"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
                                    editable={!demoMode}
                                />
                                <Pressable
                                    onPress={() => setShowPassword(!showPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#999"
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {/* Login Button */}
                        {!demoMode ? (
                            <Pressable
                                style={[styles.loginButton, loading && styles.buttonDisabled]}
                                onPress={handleLogin}
                                disabled={loading}
                            >
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.loginButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.loginButtonText}>
                                        {loading ? 'Entrando...' : 'Entrar'}
                                    </Text>
                                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                                </LinearGradient>
                            </Pressable>
                        ) : (
                            <Pressable style={styles.loginButton} onPress={handleDemoMode}>
                                <LinearGradient
                                    colors={['#667eea', '#764ba2']}
                                    style={styles.loginButtonGradient}
                                    start={{ x: 0, y: 0 }}
                                    end={{ x: 1, y: 0 }}
                                >
                                    <Text style={styles.loginButtonText}>Probar Modo Demo</Text>
                                </LinearGradient>
                            </Pressable>
                        )}

                        {/* Divider */}
                        <View style={styles.divider}>
                            <View style={styles.dividerLine} />
                            <Text style={styles.dividerText}>O CONTINÚA CON</Text>
                            <View style={styles.dividerLine} />
                        </View>

                        {/* Social Buttons */}
                        <View style={styles.socialButtons}>
                            <Pressable style={styles.socialButton}>
                                <Ionicons name="logo-google" size={20} color="#4285F4" />
                                <Text style={styles.socialButtonText}>Google</Text>
                            </Pressable>
                            <Pressable style={styles.socialButton}>
                                <Ionicons name="logo-apple" size={20} color="#000" />
                                <Text style={styles.socialButtonText}>Apple</Text>
                            </Pressable>
                        </View>
                    </View>
                </View>

                {/* Sign Up Link */}
                <View style={styles.signupContainer}>
                    <Text style={styles.signupText}>¿No tienes cuenta? </Text>
                    <Pressable onPress={handleSignUp}>
                        <Text style={styles.signupLink}>Crear Cuenta</Text>
                    </Pressable>
                </View>

                {/* Footer Links */}
                <View style={styles.footer}>
                    <Text style={styles.footerLink}>PRIVACIDAD</Text>
                    <Text style={styles.footerDot}>•</Text>
                    <Text style={styles.footerLink}>TÉRMINOS</Text>
                    <Text style={styles.footerDot}>•</Text>
                    <Text style={styles.footerLink}>SOPORTE</Text>
                </View>
            </ScrollView>

            {/* Modal de recuperar contraseña */}
            <Modal
                visible={showForgotPassword}
                transparent
                animationType="fade"
                onRequestClose={() => setShowForgotPassword(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setShowForgotPassword(false)}
                >
                    <Pressable
                        style={styles.modalContent}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <Text style={styles.modalTitle}>Recuperar Contraseña</Text>
                        <Text style={styles.modalSubtitle}>
                            Ingresa tu email y te enviaremos un código de verificación
                        </Text>

                        <View style={styles.modalInputContainer}>
                            <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
                            <TextInput
                                style={styles.modalInput}
                                placeholder="tu@email.com"
                                placeholderTextColor="#999"
                                value={resetEmail}
                                onChangeText={setResetEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <Pressable
                            style={[styles.modalButton, loading && styles.buttonDisabled]}
                            onPress={handleForgotPassword}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.modalButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.modalButtonText}>
                                    {loading ? 'Enviando...' : 'Enviar Código'}
                                </Text>
                            </LinearGradient>
                        </Pressable>

                        <Pressable
                            style={styles.modalCancelButton}
                            onPress={() => {
                                setShowForgotPassword(false);
                                setResetEmail('');
                            }}
                        >
                            <Text style={styles.modalCancelText}>Cancelar</Text>
                        </Pressable>
                    </Pressable>
                </Pressable>
            </Modal>
        </LinearGradient >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoContainer: {
        position: 'relative',
        width: 200,
        height: 200,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    logoCircle: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    floatingHeart: {
        position: 'absolute',
    },
    floatingHeart1: {
        top: 20,
        right: 30,
    },
    floatingHeart2: {
        bottom: 30,
        left: 20,
    },
    floatingHeart3: {
        top: 60,
        left: 10,
    },
    title: {
        fontSize: 36,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 15,
        color: '#FFF',
        textAlign: 'center',
    },
    cardWrapper: {
        position: 'relative',
        marginBottom: 24,
        padding: 3,
    },
    animatedBorder: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 27,
        overflow: 'hidden',
    },
    borderGradient: {
        flex: 1,
        borderRadius: 27,
    },
    card: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 5,
    },
    cardTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 24,
        textAlign: 'center',
    },
    demoWarning: {
        backgroundColor: '#FFF3CD',
        borderRadius: 12,
        padding: 12,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#FFE69C',
    },
    demoWarningText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#856404',
        textAlign: 'center',
        marginBottom: 4,
    },
    demoWarningSubtext: {
        fontSize: 12,
        color: '#856404',
        textAlign: 'center',
    },
    inputGroup: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
    },
    passwordHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    forgotText: {
        fontSize: 13,
        color: '#667eea',
        fontWeight: '500',
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D3748',
    },
    eyeIcon: {
        padding: 8,
    },
    loginButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    loginButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    loginButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    divider: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 24,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#E2E8F0',
    },
    dividerText: {
        fontSize: 11,
        color: '#A0AEC0',
        fontWeight: '600',
        marginHorizontal: 12,
        letterSpacing: 0.5,
    },
    socialButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    socialButton: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        paddingVertical: 14,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        gap: 8,
    },
    socialButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
    },
    signupContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    signupText: {
        fontSize: 14,
        color: '#FFF',
    },
    signupLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        textDecorationLine: 'underline',
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
        gap: 8,
    },
    footerLink: {
        fontSize: 11,
        color: '#FFF',
        fontWeight: '600',
        letterSpacing: 0.5,
    },
    footerDot: {
        fontSize: 11,
        color: '#FFF',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: '700',
        color: '#2D3748',
        marginBottom: 8,
        textAlign: 'center',
    },
    modalSubtitle: {
        fontSize: 14,
        color: '#718096',
        marginBottom: 24,
        textAlign: 'center',
        lineHeight: 20,
    },
    modalInputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        paddingHorizontal: 16,
        marginBottom: 20,
    },
    modalInput: {
        flex: 1,
        paddingVertical: 14,
        fontSize: 15,
        color: '#2D3748',
    },
    modalButton: {
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 12,
    },
    modalButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
    },
    modalButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
    modalCancelButton: {
        padding: 12,
        alignItems: 'center',
    },
    modalCancelText: {
        fontSize: 14,
        color: '#718096',
        fontWeight: '500',
    },
});
