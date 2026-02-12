import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert, SafeAreaView } from 'react-native';
import { useRouter } from 'expo-router';
import { supabase } from '@/core/config/supabase';

export default function ChangePasswordScreen() {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Por favor completa todos los campos');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'Las contraseñas nuevas no coinciden');
            return;
        }

        if (newPassword.length < 6) {
            Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            // Primero verificar la contraseña actual
            const { data: { user } } = await supabase.auth.getUser();
            if (!user?.email) throw new Error('No hay usuario autenticado');

            // Intentar hacer login con la contraseña actual para verificarla
            const { error: signInError } = await supabase.auth.signInWithPassword({
                email: user.email,
                password: currentPassword,
            });

            if (signInError) {
                Alert.alert('Error', 'La contraseña actual es incorrecta');
                setLoading(false);
                return;
            }

            // Actualizar a la nueva contraseña
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;

            Alert.alert(
                '✅ Contraseña actualizada',
                'Tu contraseña ha sido cambiada exitosamente',
                [
                    {
                        text: 'OK',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error: any) {
            Alert.alert('Error', error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Pressable onPress={() => router.back()} style={styles.backButton}>
                    <Text style={styles.backButtonText}>← Volver</Text>
                </Pressable>
                <Text style={styles.title}>Cambiar Contraseña</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Contraseña Actual</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Ingresa tu contraseña actual"
                    placeholderTextColor="#999"
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    secureTextEntry
                />

                <Text style={styles.label}>Nueva Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Mínimo 6 caracteres"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry
                />

                <Text style={styles.label}>Confirmar Nueva Contraseña</Text>
                <TextInput
                    style={styles.input}
                    placeholder="Repite la nueva contraseña"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                />

                <Pressable
                    style={[styles.button, loading && styles.buttonDisabled]}
                    onPress={handleChangePassword}
                    disabled={loading}
                >
                    <Text style={styles.buttonText}>
                        {loading ? 'Actualizando...' : 'Actualizar Contraseña'}
                    </Text>
                </Pressable>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        backgroundColor: '#FFF',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        marginBottom: 8,
    },
    backButtonText: {
        fontSize: 16,
        color: '#667eea',
        fontWeight: '500',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1A202C',
    },
    content: {
        padding: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1A202C',
        marginBottom: 8,
        marginTop: 16,
    },
    input: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        padding: 16,
        fontSize: 16,
        color: '#1A202C',
    },
    button: {
        backgroundColor: '#667eea',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 32,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFF',
    },
});
