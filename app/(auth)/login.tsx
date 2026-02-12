import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const { signIn, enterDemoMode, demoMode } = useAuthStore();
    const router = useRouter();

    const handleLogin = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        setLoading(true);
        try {
            await signIn(email, password);
            router.replace('/(app)/home');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSignUp = () => {
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
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.logoContainer}>
                    <Text style={styles.logo}>💕</Text>
                </View>
                <Text style={styles.title}>Palpitos</Text>
                <Text style={styles.subtitle}>Conecta con tu pareja emocionalmente</Text>

                {demoMode && (
                    <View style={styles.demoWarning}>
                        <Text style={styles.demoWarningText}>
                            ⚠️ Modo Demo
                        </Text>
                        <Text style={styles.demoWarningSubtext}>
                            Configura Supabase para usar la app completa (ver SETUP.md)
                        </Text>
                    </View>
                )}

                <TextInput
                    style={styles.input}
                    placeholder="Email"
                    placeholderTextColor="#CBD5E0"
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    editable={!demoMode}
                />

                <TextInput
                    style={styles.input}
                    placeholder="Contraseña"
                    placeholderTextColor="#CBD5E0"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    editable={!demoMode}
                />

                {!demoMode ? (
                    <>
                        <Pressable
                            style={[styles.button, loading && styles.buttonDisabled]}
                            onPress={handleLogin}
                            disabled={loading}
                        >
                            <Text style={styles.buttonText}>
                                {loading ? 'Entrando...' : 'Entrar'}
                            </Text>
                        </Pressable>

                        <Pressable
                            style={styles.buttonSecondary}
                            onPress={handleSignUp}
                        >
                            <Text style={styles.buttonSecondaryText}>
                                Crear Cuenta
                            </Text>
                        </Pressable>

                        <Pressable
                            style={styles.forgotPasswordButton}
                            onPress={() => setShowForgotPassword(true)}
                        >
                            <Text style={styles.forgotPasswordText}>
                                ¿Olvidaste tu contraseña?
                            </Text>
                        </Pressable>
                    </>
                ) : (
                    <Pressable style={styles.button} onPress={handleDemoMode}>
                        <Text style={styles.buttonText}>Probar Modo Demo</Text>
                    </Pressable>
                )}
            </View>

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

                        <TextInput
                            style={styles.modalInput}
                            placeholder="Email"
                            placeholderTextColor="#999"
                            value={resetEmail}
                            onChangeText={setResetEmail}
                            autoCapitalize="none"
                            keyboardType="email-address"
                        />

                        <Pressable
                            style={[styles.modalButton, loading && styles.buttonDisabled]}
                            onPress={handleForgotPassword}
                            disabled={loading}
                        >
                            <Text style={styles.modalButtonText}>
                                {loading ? 'Enviando...' : 'Enviar Código'}
                            </Text>
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
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        justifyContent: 'center',
        padding: 24,
    },
    logoContainer: {
        alignItems: 'center',
        marginBottom: 16,
    },
    logo: {
        fontSize: 80,
        textShadowColor: 'rgba(0, 0, 0, 0.3)',
        textShadowOffset: { width: 0, height: 4 },
        textShadowRadius: 8,
    },
    title: {
        fontSize: 42,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
        textShadowColor: 'rgba(0, 0, 0, 0.2)',
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 48,
        opacity: 0.9,
    },
    demoWarning: {
        backgroundColor: 'rgba(255, 255, 255, 0.15)',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
    },
    demoWarningText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 4,
    },
    demoWarningSubtext: {
        fontSize: 12,
        color: '#FFF',
        textAlign: 'center',
        opacity: 0.9,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFF',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#667eea',
    },
    buttonSecondary: {
        backgroundColor: 'transparent',
        borderWidth: 2,
        borderColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 12,
    },
    buttonSecondaryText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
    forgotPasswordButton: {
        marginTop: 16,
        alignItems: 'center',
    },
    forgotPasswordText: {
        fontSize: 14,
        color: '#FFF',
        textDecorationLine: 'underline',
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
        borderRadius: 20,
        padding: 24,
        width: '100%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
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
    modalInput: {
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        fontSize: 16,
        color: '#1A202C',
        marginBottom: 16,
    },
    modalButton: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginBottom: 12,
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
    },
});
