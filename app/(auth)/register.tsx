import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function RegisterScreen() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [gender, setGender] = useState<'male' | 'female' | null>(null);
    const [birthDate, setBirthDate] = useState<Date | null>(null);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [avatarUri, setAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería para seleccionar una foto');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setAvatarUri(result.assets[0].uri);
        }
    };

    const calculateAge = (date: Date): number => {
        const today = new Date();
        let age = today.getFullYear() - date.getFullYear();
        const monthDiff = today.getMonth() - date.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
            age--;
        }

        return age;
    };

    const handleRegister = async () => {
        if (!name || !email || !password || !confirmPassword || !gender || !birthDate) {
            Alert.alert('Error', 'Por favor completa todos los campos obligatorios');
            return;
        }

        if (password.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas no coinciden');
            return;
        }

        // Validar edad mínima (18 años)
        const age = calculateAge(birthDate);
        if (age < 18) {
            Alert.alert('Error', 'Debes tener al menos 18 años para registrarte');
            return;
        }

        setLoading(true);
        try {
            const { signUpWithOtp } = useAuthStore.getState();
            await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);

            // Redirigir a pantalla de verificación con código
            router.push({
                pathname: '/(auth)/verify-email',
                params: {
                    email,
                    name,
                    gender,
                    birthDate: birthDate.toISOString(),
                    avatarUri: avatarUri || '',
                    password
                }
            });
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setBirthDate(selectedDate);
        }
    };

    const formatDate = (date: Date): string => {
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
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

                    {/* Contraseña */}
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Contraseña (mínimo 6 caracteres)"
                            placeholderTextColor="#CBD5E0"
                            value={password}
                            onChangeText={setPassword}
                            secureTextEntry={!showPassword}
                        />
                        <Pressable
                            style={styles.eyeButton}
                            onPress={() => setShowPassword(!showPassword)}
                        >
                            <Ionicons
                                name={showPassword ? 'eye-off' : 'eye'}
                                size={24}
                                color="#FFF"
                            />
                        </Pressable>
                    </View>

                    {/* Confirmar Contraseña */}
                    <View style={styles.passwordContainer}>
                        <TextInput
                            style={styles.passwordInput}
                            placeholder="Confirmar contraseña"
                            placeholderTextColor="#CBD5E0"
                            value={confirmPassword}
                            onChangeText={setConfirmPassword}
                            secureTextEntry={!showConfirmPassword}
                        />
                        <Pressable
                            style={styles.eyeButton}
                            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                            <Ionicons
                                name={showConfirmPassword ? 'eye-off' : 'eye'}
                                size={24}
                                color="#FFF"
                            />
                        </Pressable>
                    </View>

                    {/* Fecha de Nacimiento */}
                    <Text style={styles.fieldLabel}>Fecha de Nacimiento *</Text>
                    <Pressable
                        style={styles.dateButton}
                        onPress={() => setShowDatePicker(true)}
                    >
                        <Text style={styles.dateButtonText}>
                            {birthDate ? formatDate(birthDate) : 'Selecciona tu fecha de nacimiento'}
                        </Text>
                        <View style={styles.dateIconContainer}>
                            <Ionicons name="calendar-outline" size={22} color="#FFF" />
                        </View>
                    </Pressable>

                    {showDatePicker && (
                        <DateTimePicker
                            value={birthDate || new Date(2000, 0, 1)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            onChange={onDateChange}
                            maximumDate={new Date()}
                            minimumDate={new Date(1940, 0, 1)}
                        />
                    )}

                    {/* Foto de Perfil (Opcional) */}
                    <Text style={styles.fieldLabel}>Foto de Perfil (Opcional)</Text>
                    <Pressable
                        style={styles.avatarContainer}
                        onPress={pickImage}
                    >
                        {avatarUri ? (
                            <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Ionicons name="camera" size={40} color="#FFF" />
                                <Text style={styles.avatarPlaceholderText}>Toca para agregar foto</Text>
                            </View>
                        )}
                    </Pressable>

                    <Text style={styles.genderLabel}>Soy: *</Text>
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
    passwordContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        marginBottom: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingRight: 12,
    },
    passwordInput: {
        flex: 1,
        padding: 16,
        fontSize: 16,
        color: '#FFF',
    },
    eyeButton: {
        padding: 8,
        justifyContent: 'center',
        alignItems: 'center',
    },
    genderLabel: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 12,
        textAlign: 'center',
    },
    fieldLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 8,
        marginTop: 8,
    },
    dateButton: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        paddingVertical: 16,
        paddingHorizontal: 16,
        marginBottom: 16,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        minHeight: 56,
    },
    dateButtonText: {
        fontSize: 16,
        color: '#FFF',
        flex: 1,
        marginRight: 12,
    },
    dateIconContainer: {
        width: 28,
        height: 28,
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 16,
        width: 120,
        height: 120,
        borderRadius: 60,
        overflow: 'hidden',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 10,
    },
    avatarPlaceholderText: {
        fontSize: 12,
        color: '#FFF',
        textAlign: 'center',
        marginTop: 8,
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
