import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import { avatarService } from '@/core/services/avatarService';

export default function EditProfileScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [name, setName] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
    const [newAvatarUri, setNewAvatarUri] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [canChangeName, setCanChangeName] = useState(true);
    const [daysUntilChange, setDaysUntilChange] = useState(0);
    const [lastNameChange, setLastNameChange] = useState<Date | null>(null);

    useEffect(() => {
        loadProfile();
    }, []);

    const loadProfile = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('name, avatar_url, last_name_change')
                .eq('id', user.id)
                .maybeSingle();

            if (error) throw error;

            if (data) {
                setName(data.name);
                setAvatarUrl(data.avatar_url);

                // Si last_name_change es NULL, es la primera vez que puede cambiar el nombre
                if (data.last_name_change === null) {
                    setCanChangeName(true);
                    setLastNameChange(null);
                    setDaysUntilChange(0);
                } else {
                    const lastChange = new Date(data.last_name_change);
                    setLastNameChange(lastChange);

                    // Calcular si puede cambiar el nombre
                    const daysSinceChange = Math.floor(
                        (Date.now() - lastChange.getTime()) / (1000 * 60 * 60 * 24)
                    );

                    const canChange = daysSinceChange >= 60;
                    setCanChangeName(canChange);

                    if (!canChange) {
                        setDaysUntilChange(60 - daysSinceChange);
                    }
                }
            }
        } catch (error) {
            console.error('Error loading profile:', error);
            Alert.alert('Error', 'No se pudo cargar el perfil');
        } finally {
            setLoading(false);
        }
    };

    const pickImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permiso denegado', 'Necesitamos acceso a tu galería');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            setNewAvatarUri(result.assets[0].uri);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
    };

    const uploadAvatar = async (): Promise<string | null> => {
        if (!newAvatarUri || !user) return null;

        try {
            setUploadingAvatar(true);

            const fileExt = newAvatarUri.split('.').pop();
            const fileName = `${user.id}-${Date.now()}.${fileExt}`;

            // Convertir URI a blob
            const response = await fetch(newAvatarUri);
            const blob = await response.blob();

            // Eliminar avatar anterior si existe
            if (avatarUrl) {
                await supabase.storage.from('avatars').remove([avatarUrl]);
            }

            // Subir nuevo avatar
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, blob, {
                    contentType: `image/${fileExt}`,
                    upsert: false,
                });

            if (error) throw error;

            return fileName;
        } catch (error) {
            console.error('Error uploading avatar:', error);
            throw error;
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleSave = async () => {
        if (!user) return;

        if (!name.trim()) {
            Alert.alert('Error', 'El nombre no puede estar vacío');
            return;
        }

        if (name.trim().length < 2) {
            Alert.alert('Error', 'El nombre debe tener al menos 2 caracteres');
            return;
        }

        if (!canChangeName) {
            Alert.alert(
                'No disponible',
                `Podrás cambiar tu nombre nuevamente en ${daysUntilChange} días`
            );
            return;
        }

        try {
            setSaving(true);

            // Subir avatar si hay uno nuevo
            let newAvatarUrl = avatarUrl;
            if (newAvatarUri) {
                newAvatarUrl = await uploadAvatar();
            }

            const updateData: any = {};

            // Solo actualizar nombre si cambió y puede cambiarlo
            if (name.trim() !== '' && canChangeName) {
                updateData.name = name.trim();
                updateData.last_name_change = new Date().toISOString();
            }

            // Actualizar avatar si cambió
            if (newAvatarUrl !== avatarUrl) {
                updateData.avatar_url = newAvatarUrl;
            }

            if (Object.keys(updateData).length === 0) {
                Alert.alert('Sin cambios', 'No hay cambios para guardar');
                return;
            }

            const { error } = await supabase
                .from('users')
                .update(updateData)
                .eq('id', user.id);

            if (error) throw error;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('¡Listo!', 'Tu perfil se actualizó correctamente', [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]);
        } catch (error) {
            console.error('Error updating profile:', error);
            Alert.alert('Error', 'No se pudo actualizar el perfil');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (date: Date) => {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
            'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return `${date.getDate()} de ${months[date.getMonth()]} de ${date.getFullYear()}`;
    };

    if (loading) {
        return (
            <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
                <SafeAreaView style={styles.safeArea} edges={['top']}>
                    <ActivityIndicator size="large" color="#FFF" />
                </SafeAreaView>
            </LinearGradient>
        );
    }

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backIcon}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Editar Perfil</Text>
                    </View>

                    {/* Formulario */}
                    <View style={styles.form}>
                        {/* Avatar */}
                        <View style={styles.avatarSection}>
                            <Pressable onPress={pickImage} style={styles.avatarContainer}>
                                {newAvatarUri || avatarUrl ? (
                                    <Image
                                        source={{ 
                                            uri: newAvatarUri || avatarService.getAvatarUrl(avatarUrl!) || undefined 
                                        }}
                                        style={styles.avatar}
                                    />
                                ) : (
                                    <View style={styles.avatarPlaceholder}>
                                        <Ionicons name="person" size={60} color="#667eea" />
                                    </View>
                                )}
                                <View style={styles.avatarEditBadge}>
                                    <Ionicons name="camera" size={20} color="#FFF" />
                                </View>
                            </Pressable>
                            <Text style={styles.avatarHint}>Toca para cambiar tu foto</Text>
                        </View>

                        <View style={styles.inputContainer}>
                            <Text style={styles.label}>Nombre</Text>
                            <TextInput
                                style={[
                                    styles.input,
                                    !canChangeName && styles.inputDisabled
                                ]}
                                value={name}
                                onChangeText={setName}
                                placeholder="Tu nombre"
                                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                editable={canChangeName}
                                maxLength={50}
                            />

                            {!canChangeName && (
                                <View style={styles.warningBox}>
                                    <Text style={styles.warningIcon}>🔒</Text>
                                    <View style={styles.warningTextContainer}>
                                        <Text style={styles.warningTitle}>
                                            Cambio de nombre bloqueado
                                        </Text>
                                        <Text style={styles.warningText}>
                                            Podrás cambiar tu nombre nuevamente en {daysUntilChange} días
                                        </Text>
                                        {lastNameChange && (
                                            <Text style={styles.warningSubtext}>
                                                Último cambio: {formatDate(lastNameChange)}
                                            </Text>
                                        )}
                                    </View>
                                </View>
                            )}

                            {canChangeName && lastNameChange === null && (
                                <View style={styles.infoBox}>
                                    <Text style={styles.infoIcon}>✨</Text>
                                    <Text style={styles.infoText}>
                                        Primera vez: Puedes cambiar tu nombre libremente. Después solo podrás cambiarlo una vez cada 60 días.
                                    </Text>
                                </View>
                            )}

                            {canChangeName && lastNameChange !== null && (
                                <View style={styles.successBox}>
                                    <Text style={styles.successIcon}>✅</Text>
                                    <Text style={styles.successText}>
                                        Ya puedes cambiar tu nombre nuevamente
                                    </Text>
                                </View>
                            )}
                        </View>

                        {/* Botón de guardar */}
                        <Pressable
                            style={[
                                styles.saveButton,
                                (saving || uploadingAvatar) && styles.saveButtonDisabled
                            ]}
                            onPress={handleSave}
                            disabled={saving || uploadingAvatar}
                        >
                            {(saving || uploadingAvatar) ? (
                                <ActivityIndicator color="#FFF" />
                            ) : (
                                <Text style={styles.saveButtonText}>
                                    Guardar Cambios
                                </Text>
                            )}
                        </Pressable>
                    </View>
                </View>
            </SafeAreaView>
        </LinearGradient>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 20,
        paddingTop: 60,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 30,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backIcon: {
        fontSize: 24,
        color: '#FFF',
    },
    headerTitle: {
        flex: 1,
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginRight: 40,
    },
    form: {
        flex: 1,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#FFF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 4,
        borderColor: '#FFF',
    },
    avatarEditBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#667eea',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 3,
        borderColor: '#FFF',
    },
    avatarHint: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
    },
    inputContainer: {
        marginBottom: 24,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.35)',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#FFF',
        borderWidth: 2,
        borderColor: 'transparent',
    },
    inputDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        opacity: 0.8,
    },
    warningBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(245, 101, 101, 0.2)',
        borderRadius: 12,
        padding: 16,
        marginTop: 12,
        borderWidth: 1,
        borderColor: 'rgba(245, 101, 101, 0.3)',
    },
    warningIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    warningTextContainer: {
        flex: 1,
    },
    warningTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 4,
    },
    warningText: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.9,
    },
    warningSubtext: {
        fontSize: 12,
        color: '#FFF',
        opacity: 0.7,
        marginTop: 4,
    },
    infoBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(66, 153, 225, 0.2)',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        alignItems: 'center',
    },
    infoIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#FFF',
        opacity: 0.9,
    },
    successBox: {
        flexDirection: 'row',
        backgroundColor: 'rgba(72, 187, 120, 0.2)',
        borderRadius: 12,
        padding: 12,
        marginTop: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: 'rgba(72, 187, 120, 0.3)',
    },
    successIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    successText: {
        flex: 1,
        fontSize: 13,
        color: '#FFF',
        opacity: 0.9,
    },
    saveButton: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 20,
    },
    saveButtonDisabled: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
    },
    saveButtonText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#667eea',
    },
});
