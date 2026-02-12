import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';

export default function VerifyOtpScreen() {
    const [code, setCode] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { email } = useLocalSearchParams<{ email: string }>();

    const handleVerifyAndReset = async () => {
        if (!code || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (code.length !== 6 && code.length !== 8) {
            Alert.alert('Error', 'El código debe tener 6 u 8 dígitos');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { error } = await useAuthStore.getState().verifyOtpAndResetPassword(
                email,
                code,
                newPassword
            );

            if (error) {
                Alert.alert('Error', error.message || 'Código inválido o expirado');
            } else {
                Alert.alert(
                    '¡Listo!',
                    'Tu contraseña ha sido actualizada correctamente',
                    [
                        {
                            text: 'OK',
                            onPress: () => router.replace('/(auth)/login')
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
                <View style={styles.header}>
                    <Text style={styles.emoji}>🔐</Text>
                    <Text style={styles.title}>Verificar Código</Text>
                    <Text style={styles.subtitle}>
                        Ingresa el código que enviamos a{'\n'}
                        <Text style={styles.email}>{email}</Text>
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

                <TextInput
                    style={styles.input}
                    placeholder="Nueva contraseña"
                    placeholderTextColor="#CBD5E0"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />

                <TextInput
                    style={styles.input}
                    placeholder="Confirmar contraseña"
                    placeholderTextColor="#CBD5E0"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleVerifyAndReset}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Verificando...' : 'Cambiar Contraseña'}
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
    backButton: {
        marginTop: 16,
        alignItems: 'center',
        padding: 12,
    },
    backButtonText: {
        fontSize: 14,
        color: '#FFF',
        textDecorationLine: 'underline',
    },
});
