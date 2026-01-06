import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';

export default function LoginScreen() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
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

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <View style={styles.content}>
                <Text style={styles.title}>❤️ Couple Connection</Text>
                <Text style={styles.subtitle}>Conéctate emocionalmente</Text>

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
                    </>
                ) : (
                    <Pressable style={styles.button} onPress={handleDemoMode}>
                        <Text style={styles.buttonText}>Probar Modo Demo</Text>
                    </Pressable>
                )}
            </View>
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
    title: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
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
});
