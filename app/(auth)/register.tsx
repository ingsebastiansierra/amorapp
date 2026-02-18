import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, ScrollView, Image, Platform, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@core/store/useAuthStore';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';

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

    // Animación del borde
    const borderRotate = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // Animación del borde del formulario (rotación continua)
        Animated.loop(
            Animated.timing(borderRotate, {
                toValue: 1,
                duration: 3000,
                useNativeDriver: true,
            })
        ).start();
    }, []);

    const borderRotateInterpolate = borderRotate.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '360deg'],
    });

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

        const age = calculateAge(birthDate);
        if (age < 18) {
            Alert.alert('Error', 'Debes tener al menos 18 años para registrarte');
            return;
        }

        setLoading(true);
        try {
            const { signUpWithOtp } = useAuthStore.getState();
            await signUpWithOtp(email, password, name, gender, birthDate, avatarUri);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setBirthDate(selectedDate);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
                {/* Header */}
                <View style={styles.header}>
                    <Pressable style={styles.backButton} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={24} color="#2D3748" />
                    </Pressable>
                    <View style={styles.logoCircle}>
                        <Ionicons name="people" size={50} color="#667eea" />
                    </View>
                    <Text style={styles.title}>Crear Cuenta</Text>
                    <Text style={styles.subtitle}>Únete a Palpitos</Text>
                </View>

                {/* Card */}
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
                        {/* Avatar */}
                        <Pressable style={styles.avatarContainer} onPress={pickImage}>
                            {avatarUri ? (
                                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="camera" size={32} color="#667eea" />
                                </View>
                            )}
                            <View style={styles.avatarBadge}>
                                <Ionicons name="add" size={16} color="#FFF" />
                            </View>
                        </Pressable>
                        <Text style={styles.avatarLabel}>Foto de perfil (opcional)</Text>

                        {/* Name Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Nombre completo</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="person-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Tu nombre"
                                    placeholderTextColor="#CCC"
                                    value={name}
                                    onChangeText={setName}
                                    autoCapitalize="words"
                                />
                            </View>
                        </View>

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
                                />
                            </View>
                        </View>

                        {/* Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Contraseña</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Mínimo 6 caracteres"
                                    placeholderTextColor="#CCC"
                                    value={password}
                                    onChangeText={setPassword}
                                    secureTextEntry={!showPassword}
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

                        {/* Confirm Password Input */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Confirmar contraseña</Text>
                            <View style={styles.inputContainer}>
                                <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
                                <TextInput
                                    style={styles.input}
                                    placeholder="Repite tu contraseña"
                                    placeholderTextColor="#CCC"
                                    value={confirmPassword}
                                    onChangeText={setConfirmPassword}
                                    secureTextEntry={!showConfirmPassword}
                                />
                                <Pressable
                                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                    style={styles.eyeIcon}
                                >
                                    <Ionicons
                                        name={showConfirmPassword ? "eye-outline" : "eye-off-outline"}
                                        size={20}
                                        color="#999"
                                    />
                                </Pressable>
                            </View>
                        </View>

                        {/* Birth Date */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
                            <Pressable
                                style={styles.inputContainer}
                                onPress={() => setShowDatePicker(true)}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#999" style={styles.inputIcon} />
                                <Text style={[styles.input, !birthDate && styles.placeholderText]}>
                                    {birthDate ? formatDate(birthDate) : 'Selecciona tu fecha'}
                                </Text>
                            </Pressable>
                        </View>

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

                        {/* Gender Selection */}
                        <View style={styles.inputGroup}>
                            <Text style={styles.inputLabel}>Género</Text>
                            <View style={styles.genderContainer}>
                                <Pressable
                                    style={[
                                        styles.genderButton,
                                        gender === 'female' && styles.genderButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setGender('female');
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={styles.genderEmoji}>👩</Text>
                                    <Text style={[styles.genderText, gender === 'female' && styles.genderTextSelected]}>
                                        Mujer
                                    </Text>
                                </Pressable>

                                <Pressable
                                    style={[
                                        styles.genderButton,
                                        gender === 'male' && styles.genderButtonSelected,
                                    ]}
                                    onPress={() => {
                                        setGender('male');
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    }}
                                >
                                    <Text style={styles.genderEmoji}>👨</Text>
                                    <Text style={[styles.genderText, gender === 'male' && styles.genderTextSelected]}>
                                        Hombre
                                    </Text>
                                </Pressable>
                            </View>
                        </View>

                        {/* Register Button */}
                        <Pressable
                            style={[styles.registerButton, loading && styles.buttonDisabled]}
                            onPress={handleRegister}
                            disabled={loading}
                        >
                            <LinearGradient
                                colors={['#667eea', '#764ba2']}
                                style={styles.registerButtonGradient}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                            >
                                <Text style={styles.registerButtonText}>
                                    {loading ? 'Creando cuenta...' : 'Crear Cuenta'}
                                </Text>
                                <Ionicons name="arrow-forward" size={20} color="#FFF" />
                            </LinearGradient>
                        </Pressable>
                    </View>
                </View>

                {/* Login Link */}
                <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>¿Ya tienes cuenta? </Text>
                    <Pressable onPress={() => router.back()}>
                        <Text style={styles.loginLink}>Iniciar Sesión</Text>
                    </Pressable>
                </View>

                <View style={{ height: 40 }} />
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
        paddingTop: 60,
        paddingBottom: 40,
        paddingHorizontal: 24,
    },
    header: {
        alignItems: 'center',
        marginBottom: 32,
    },
    backButton: {
        position: 'absolute',
        left: 0,
        top: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    logoCircle: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#FFF',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    title: {
        fontSize: 32,
        fontWeight: '700',
        color: '#FFF',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 15,
        color: '#FFF',
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
    avatarContainer: {
        alignSelf: 'center',
        marginBottom: 8,
        position: 'relative',
    },
    avatarImage: {
        width: 100,
        height: 100,
        borderRadius: 50,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: '#e8ebff',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#667eea',
        borderStyle: 'dashed',
    },
    avatarBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#667eea',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarLabel: {
        fontSize: 13,
        color: '#718096',
        textAlign: 'center',
        marginBottom: 20,
    },
    inputGroup: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#4A5568',
        marginBottom: 8,
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
    placeholderText: {
        color: '#CCC',
    },
    eyeIcon: {
        padding: 8,
    },
    genderContainer: {
        flexDirection: 'row',
        gap: 12,
    },
    genderButton: {
        flex: 1,
        backgroundColor: '#F7FAFC',
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#E2E8F0',
        paddingVertical: 16,
        alignItems: 'center',
    },
    genderButtonSelected: {
        borderColor: '#667eea',
        backgroundColor: '#e8ebff',
    },
    genderEmoji: {
        fontSize: 32,
        marginBottom: 4,
    },
    genderText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#718096',
    },
    genderTextSelected: {
        color: '#667eea',
    },
    registerButton: {
        borderRadius: 16,
        overflow: 'hidden',
        marginTop: 8,
        shadowColor: '#667eea',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    registerButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    registerButtonText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFF',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    loginContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 24,
    },
    loginText: {
        fontSize: 14,
        color: '#FFF',
    },
    loginLink: {
        fontSize: 14,
        fontWeight: '700',
        color: '#FFF',
        textDecorationLine: 'underline',
    },
});
