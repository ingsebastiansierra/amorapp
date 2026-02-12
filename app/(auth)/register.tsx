import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleRegister = async () => {
        if (!name || !email || !password || !gender) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            const { signUp } = useAuthStore.getState();
            await signUp(email, password, name, gender);
            Alert.alert(
                '¡Cuenta creada!',
                'Revisa tu email para confirmar tu cuenta. Luego podrás iniciar sesión.',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.content}>
                    <View style={styles.logoContainer}>
                        <Text style={styles.logo}>💕</Text>
                    </View>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Únete a Palpitos</Text>

                    <TextInput
                        style={styles.input}
                        placeholder="Nombre"
                        placeholderTextColor="#CBD5E0"
                        value={name}
                        onChangeText={setName}
                        autoCapitalize="words"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        placeholderTextColor="#CBD5E0"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                    />

                    <TextInput
                        style={styles.input}
                        placeholder="Contraseña (mínimo 6 caracteres)"
                        placeholderTextColor="#CBD5E0"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <Text style={styles.genderLabel}>Soy:</Text>
                    <View style={styles.genderContainer}>
                        <Pressable
                            style={[
                                styles.genderButton,
                                gender === 'female' && styles.genderButtonSelected,
                            ]}
                            onPress={() => setGender('female')}
                        >
                            <Text style={styles.genderEmoji}>👩</Text>
                            <Text style={styles.genderText}>Mujer</Text>
                        </Pressable>

                        <Pressable
                            style={[
                                styles.genderButton,
                                gender === 'male' && styles.genderButtonSelected,
                            ]}
                            onPress={() => setGender('male')}
                        >
                            <Text style={styles.genderEmoji}>👨</Text>
                            <Text style={styles.genderText}>Hombre</Text>
                        </Pressable>
                    </View>

                    <Pressable
                        style={[styles.button, loading && styles.buttonDisabled]}
                        onPress={handleRegister}
                        disabled={loading}
                    >
                        <Text style={styles.buttonText}>
                            {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Text>
                    </Pressable>

                    <Pressable
                        style={styles.buttonSecondary}
                        onPress={() => router.back()}
                    >
                        <Text style={styles.buttonSecondaryText}>
                            Ya tengo cuenta
                        </Text>
                    </Pressable>
                </View>
            </ScrollView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        flexGrow: 1,
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
        marginBottom: 32,
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
    genderLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    genderContainer: {
        flexDirection: 'row',
        justifyContent: 'space-around',
        marginBottom: 24,
    },
    genderButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        width: '45%',
        borderWidth: 3,
        borderColor: 'transparent',
    },
    genderButtonSelected: {
        borderColor: '#FFF',
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    genderEmoji: {
        fontSize: 48,
        marginBottom: 8,
    },
    genderText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
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
