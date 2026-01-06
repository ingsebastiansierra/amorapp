import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Pressable, TextInput, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';
import * as Clipboard from 'expo-clipboard';

export default function LinkPartnerScreen() {
    const { user } = useAuthStore();
    const router = useRouter();
    const [myCode, setMyCode] = useState('');
    const [partnerCode, setPartnerCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [hasPartner, setHasPartner] = useState(false);

    useEffect(() => {
        loadMyCode();
        checkIfHasPartner();
    }, []);

    const loadMyCode = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from('users')
                .select('id')
                .eq('id', user.id)
                .single();

            if (error) {
                console.error('Error loading code:', error);
                return;
            }

            if (data) {
                // Usar los primeros 8 caracteres del UUID como código
                const code = data.id.substring(0, 8).toUpperCase();
                setMyCode(code);
                console.log('Mi código:', code, 'UUID completo:', data.id);
            }
        } catch (error) {
            console.error('Error loading code:', error);
        }
    };

    const checkIfHasPartner = async () => {
        if (!user) return;

        try {
            const { data } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .single();

            if (data?.couple_id) {
                setHasPartner(true);
            }
        } catch (error) {
            console.error('Error checking partner:', error);
        }
    };

    const handleCopyCode = async () => {
        await Clipboard.setStringAsync(myCode);
        Alert.alert('¡Copiado!', 'Código copiado al portapapeles');
    };

    const handleLinkPartner = async () => {
        if (!partnerCode.trim()) {
            Alert.alert('Error', 'Ingresa el código de tu pareja');
            return;
        }

        if (partnerCode.toUpperCase() === myCode) {
            Alert.alert('Error', 'No puedes vincularte contigo mismo');
            return;
        }

        setLoading(true);

        try {
            // Buscar pareja por código (primeros 8 caracteres del UUID)
            // Convertir UUID a texto para poder buscar
            const { data: partners, error: searchError } = await supabase
                .rpc('search_user_by_code', { code_prefix: partnerCode.toLowerCase() });

            console.log('Búsqueda de pareja:', { partnerCode, partners, searchError });

            if (searchError) {
                console.error('Error buscando pareja:', searchError);
                Alert.alert('Error', 'Error al buscar pareja: ' + searchError.message);
                setLoading(false);
                return;
            }

            if (!partners || partners.length === 0) {
                Alert.alert('Error', `Código inválido: ${partnerCode.toUpperCase()}. Verifica el código de tu pareja.`);
                setLoading(false);
                return;
            }

            const partner = partners[0];

            if (partner.couple_id) {
                Alert.alert('Error', `${partner.name} ya está vinculado con alguien más.`);
                setLoading(false);
                return;
            }

            // Crear pareja
            const { data: couple, error: coupleError } = await supabase
                .from('couples')
                .insert({
                    user1_id: user!.id,
                    user2_id: partner.id,
                })
                .select()
                .single();

            if (coupleError) {
                console.error('Error creando pareja:', coupleError);
                throw coupleError;
            }

            console.log('Pareja creada:', couple);

            // Actualizar ambos usuarios con el couple_id
            const { error: updateError } = await supabase
                .from('users')
                .update({ couple_id: couple.id })
                .in('id', [user!.id, partner.id]);

            if (updateError) {
                console.error('Error actualizando usuarios:', updateError);
                throw updateError;
            }

            Alert.alert(
                '¡Vinculados! 💕',
                `Ahora estás conectado con ${partner.name}`,
                [
                    {
                        text: 'OK',
                        onPress: () => router.back(),
                    },
                ]
            );
        } catch (error: any) {
            console.error('Error linking partner:', error);
            Alert.alert('Error', 'No se pudo vincular: ' + (error.message || 'Error desconocido'));
        } finally {
            setLoading(false);
        }
    };

    const handleUnlink = async () => {
        Alert.alert(
            'Desvincular Pareja',
            '¿Estás seguro? Esto eliminará la conexión con tu pareja.',
            [
                { text: 'Cancelar', style: 'cancel' },
                {
                    text: 'Desvincular',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            const { data: userData } = await supabase
                                .from('users')
                                .select('couple_id')
                                .eq('id', user!.id)
                                .single();

                            if (userData?.couple_id) {
                                // Eliminar couple
                                await supabase
                                    .from('couples')
                                    .delete()
                                    .eq('id', userData.couple_id);

                                // Actualizar usuarios
                                await supabase
                                    .from('users')
                                    .update({ couple_id: null })
                                    .eq('couple_id', userData.couple_id);

                                setHasPartner(false);
                                Alert.alert('Desvinculado', 'Ya no estás conectado con tu pareja.');
                            }
                        } catch (error) {
                            Alert.alert('Error', 'No se pudo desvincular.');
                        }
                    },
                },
            ]
        );
    };

    return (
        <LinearGradient colors={['#667eea', '#764ba2']} style={styles.container}>
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.content}>
                    {/* Header */}
                    <View style={styles.header}>
                        <Pressable style={styles.backButton} onPress={() => router.back()}>
                            <Text style={styles.backIcon}>←</Text>
                        </Pressable>
                        <Text style={styles.headerTitle}>Vincular Pareja</Text>
                    </View>

                    {!hasPartner ? (
                        <>
                            {/* Mi Código */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Tu Código</Text>
                                <Text style={styles.sectionSubtitle}>
                                    Comparte este código con tu pareja
                                </Text>
                                <Pressable style={styles.codeContainer} onPress={handleCopyCode}>
                                    <Text style={styles.code}>{myCode}</Text>
                                    <Text style={styles.copyHint}>👆 Toca para copiar</Text>
                                </Pressable>
                            </View>

                            {/* Vincular */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Código de tu Pareja</Text>
                                <Text style={styles.sectionSubtitle}>
                                    Ingresa el código que te compartió
                                </Text>
                                <TextInput
                                    style={styles.input}
                                    placeholder="Ej: AB12CD34"
                                    placeholderTextColor="rgba(255, 255, 255, 0.5)"
                                    value={partnerCode}
                                    onChangeText={setPartnerCode}
                                    autoCapitalize="characters"
                                    maxLength={8}
                                />
                                <Pressable
                                    style={[styles.button, loading && styles.buttonDisabled]}
                                    onPress={handleLinkPartner}
                                    disabled={loading}
                                >
                                    <Text style={styles.buttonText}>
                                        {loading ? 'Vinculando...' : '💕 Vincular Pareja'}
                                    </Text>
                                </Pressable>
                            </View>
                        </>
                    ) : (
                        <View style={styles.section}>
                            <Text style={styles.linkedTitle}>✅ Ya estás vinculado</Text>
                            <Text style={styles.linkedSubtitle}>
                                Tienes una pareja conectada
                            </Text>
                            <Pressable style={styles.unlinkButton} onPress={handleUnlink}>
                                <Text style={styles.unlinkButtonText}>Desvincular Pareja</Text>
                            </Pressable>
                        </View>
                    )}
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
        marginBottom: 40,
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
    section: {
        marginBottom: 40,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#FFF',
        marginBottom: 8,
    },
    sectionSubtitle: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
        marginBottom: 16,
    },
    codeContainer: {
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#FFF',
        borderStyle: 'dashed',
    },
    code: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFF',
        letterSpacing: 4,
        marginBottom: 8,
    },
    copyHint: {
        fontSize: 14,
        color: '#FFF',
        opacity: 0.8,
    },
    input: {
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        borderRadius: 12,
        padding: 16,
        fontSize: 24,
        color: '#FFF',
        textAlign: 'center',
        letterSpacing: 4,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    button: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#667eea',
    },
    linkedTitle: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#FFF',
        textAlign: 'center',
        marginBottom: 8,
    },
    linkedSubtitle: {
        fontSize: 16,
        color: '#FFF',
        opacity: 0.9,
        textAlign: 'center',
        marginBottom: 32,
    },
    unlinkButton: {
        backgroundColor: 'rgba(229, 62, 62, 0.3)',
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#E53E3E',
    },
    unlinkButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFF',
    },
});
