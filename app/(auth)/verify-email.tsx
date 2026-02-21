import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';

export default function VerifyEmailScreen() {
    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [resending, setResending] = useState(false);
    const router = useRouter();
    const params = useLocalSearchParams<{
        email: string;
        name: string;
        gender: string;
        birthDate: string;
        avatarUri: string;
        password: string;
    }>();

    const handleVerifyEmail = async () => {
        if (!code) {
            Alert.alert('Error', 'Por favor ingresa el código');
            return;
        }

        if (code.length !== 6 && code.length !== 8) {
            Alert.alert('Error', 'El código debe tener 6 u 8 dígitos');
            return;
        }

        setLoading(true);
        try {
            const { verifyEmailOtp, completeSignUp } = useAuthStore.getState();

            // Verificar el código OTP
            const { data, error: verifyError } = await verifyEmailOtp(params.email, code);

            if (verifyError) {
                Alert.alert('Error', 'Código inválido o expirado');
                return;
            }

            // Si la verificación fue exitosa, crear el perfil
            if (data?.user) {
                await completeSignUp(
                    params.email,
                    params.password,
                    params.name,
                    params.gender as 'male' | 'female',
                    params.birthDate ? new Date(params.birthDate) : null,
                    params.avatarUri || null
                );

                // Redirect to home
                router.replace('/(app)/home');
            }
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setResending(true);
        try {
            const { signUpWithOtp } = useAuthStore.getState();
            await signUpWithOtp(
                params.email,
                params.password,
                params.name,
                params.gender as 'male' | 'female',
                params.birthDate ? new Date(params.birthDate) : null,
                params.avatarUri || null
            );
            Alert.alert('Código reenviado', 'Revisa tu email nuevamente');
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setResending(false);
        }
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <View style={styles.content}>
                <View style={styles.header}>
                    <Text style={styles.emoji}>📧</Text>
                    <Text style={styles.title}>Verifica tu Email</Text>
                    <Text style={styles.subtitle}>
                        Ingresa el código de 6 dígitos que enviamos a{'\n'}
                        <Text style={styles.email}>{params.email}</Text>
                    </Text>
                </View>

                <TextInput
                    style={styles.codeInput}
                    placeholder="00000000"
                    placeholderTextColor="#CBD5E0"
                    value={code}
                    onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                    keyboardType="number-pad"
                    maxLength={8}
                    autoFocus
                />

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyEmail}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Verificando...' : 'Verificar Email'}
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.resendButton}
                    onPress={handleResendCode}
                    disabled={resending}
                >
                    <Text style={styles.resendButtonText}>
                        {resending ? 'Reenviando...' : '¿No recibiste el código? Reenviar'}
                    </Text>
                </Pressable>

                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backButtonText}>Volver</Text>
                </Pressable>
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
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    emoji: {
        fontSize: 64,
        marginBottom: 16,
    },
    title: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 14,
        color: '#FFF',
        textAlign: 'center',
        opacity: 0.9,
        lineHeight: 20,
    },
    email: {
        fontWeight: 'bold',
    },
    codeInput: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 20,
        fontSize: 32,
        color: '#FFF',
        marginBottom: 24,
        textAlign: 'center',
        letterSpacing: 8,
        fontWeight: 'bold',
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
    resendButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    resendButtonText: {
        fontSize: 14,
        color: '#FFF',
        textDecorationLine: 'underline',
    },
    backButton: {
        marginTop: 8,
        alignItems: 'center',
        padding: 12,
    },
    backButtonText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.7,
    },
});
