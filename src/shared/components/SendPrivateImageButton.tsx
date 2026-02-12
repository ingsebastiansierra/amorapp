// Componente para enviar imágenes privadas
import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    Modal,
    TextInput,
    ActivityIndicator,
    Alert,
} from 'react-native';
import { usePrivateImages } from '../hooks/usePrivateImages';

interface Props {
    toUserId: string;
    onSent?: () => void;
}

export function SendPrivateImageButton({ toUserId, onSent }: Props) {
    const [showOptions, setShowOptions] = useState(false);
    const [showCaptionModal, setShowCaptionModal] = useState(false);
    const [caption, setCaption] = useState('');
    const [selectedMode, setSelectedMode] = useState<'camera' | 'gallery' | null>(null);
    const [viewMode, setViewMode] = useState<1 | 3 | null>(1); // 1 = ver una vez, 3 = ver 3 veces, null = ilimitado
    const { pickAndSendImage, takeAndSendPhoto, isLoading } = usePrivateImages();

    const handleOpenOptions = () => {
        setShowOptions(true);
    };

    const handleSelectMode = (mode: 'camera' | 'gallery') => {
        setSelectedMode(mode);
        setShowOptions(false);
        setShowCaptionModal(true);
    };

    const handleSend = async () => {
        if (!selectedMode) return;

        setShowCaptionModal(false);

        try {
            const options = {
                caption: caption.trim() || undefined,
                maxViews: viewMode,
            };

            if (selectedMode === 'camera') {
                await takeAndSendPhoto(toUserId, options);
            } else {
                await pickAndSendImage(toUserId, options);
            }

            // Reset
            setCaption('');
            setViewMode(1);
            setSelectedMode(null);
            onSent?.();
        } catch (error) {
            console.error('Error enviando imagen:', error);
        }
    };

    const handleCancel = () => {
        setShowCaptionModal(false);
        setCaption('');
        setViewMode(1);
        setSelectedMode(null);
    };

    return (
        <>
            <TouchableOpacity
                style={styles.mainButton}
                onPress={handleOpenOptions}
                disabled={isLoading}
            >
                {isLoading ? (
                    <ActivityIndicator color="#FFF" />
                ) : (
                    <>
                        <Text style={styles.mainButtonIcon}>📸</Text>
                        <Text style={styles.mainButtonText}>Enviar imagen privada</Text>
                    </>
                )}
            </TouchableOpacity>

            {/* Modal de opciones: Cámara o Galería */}
            <Modal
                visible={showOptions}
                transparent
                animationType="fade"
                onRequestClose={() => setShowOptions(false)}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={() => setShowOptions(false)}
                >
                    <View style={styles.optionsContainer}>
                        <Text style={styles.optionsTitle}>Selecciona una opción</Text>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handleSelectMode('camera')}
                        >
                            <Text style={styles.optionIcon}>📷</Text>
                            <Text style={styles.optionText}>Tomar foto</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.optionButton}
                            onPress={() => handleSelectMode('gallery')}
                        >
                            <Text style={styles.optionIcon}>🖼️</Text>
                            <Text style={styles.optionText}>Elegir de galería</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={[styles.optionButton, styles.cancelButton]}
                            onPress={() => setShowOptions(false)}
                        >
                            <Text style={styles.cancelText}>Cancelar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            {/* Modal de caption y opciones de vista */}
            <Modal
                visible={showCaptionModal}
                transparent
                animationType="slide"
                onRequestClose={handleCancel}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPress={handleCancel}
                >
                    <View style={styles.captionContainer}>
                        <Text style={styles.captionTitle}>Configurar imagen</Text>

                        <TextInput
                            style={styles.captionInput}
                            placeholder="Agregar un mensaje (opcional)"
                            placeholderTextColor="#999"
                            value={caption}
                            onChangeText={setCaption}
                            maxLength={200}
                            multiline
                        />

                        <Text style={styles.sectionTitle}>¿Cuántas veces se puede ver?</Text>

                        <View style={styles.viewModeContainer}>
                            <TouchableOpacity
                                style={[
                                    styles.viewModeButton,
                                    viewMode === 1 && styles.viewModeButtonActive,
                                ]}
                                onPress={() => setViewMode(1)}
                            >
                                <Text
                                    style={[
                                        styles.viewModeText,
                                        viewMode === 1 && styles.viewModeTextActive,
                                    ]}
                                >
                                    👁️ Una vez
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.viewModeButton,
                                    viewMode === 3 && styles.viewModeButtonActive,
                                ]}
                                onPress={() => setViewMode(3)}
                            >
                                <Text
                                    style={[
                                        styles.viewModeText,
                                        viewMode === 3 && styles.viewModeTextActive,
                                    ]}
                                >
                                    👁️ 3 veces
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[
                                    styles.viewModeButton,
                                    viewMode === null && styles.viewModeButtonActive,
                                ]}
                                onPress={() => setViewMode(null)}
                            >
                                <Text
                                    style={[
                                        styles.viewModeText,
                                        viewMode === null && styles.viewModeTextActive,
                                    ]}
                                >
                                    ♾️ Ilimitado
                                </Text>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.buttonRow}>
                            <TouchableOpacity style={styles.cancelActionButton} onPress={handleCancel}>
                                <Text style={styles.cancelActionText}>Cancelar</Text>
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
                                <Text style={styles.sendButtonText}>Enviar</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    mainButton: {
        flexDirection: 'row',
        backgroundColor: '#007AFF',
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        marginHorizontal: 16,
        marginVertical: 8,
    },
    mainButtonIcon: {
        fontSize: 20,
        marginRight: 8,
    },
    mainButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    optionsContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
    },
    optionsTitle: {
        fontSize: 18,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#000',
    },
    optionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        marginBottom: 12,
    },
    optionIcon: {
        fontSize: 24,
        marginRight: 12,
    },
    optionText: {
        fontSize: 16,
        color: '#000',
        fontWeight: '500',
    },
    cancelButton: {
        backgroundColor: '#FFF',
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    cancelText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '500',
        textAlign: 'center',
        flex: 1,
    },
    captionContainer: {
        backgroundColor: '#FFF',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        padding: 20,
        maxHeight: '80%',
    },
    captionTitle: {
        fontSize: 20,
        fontWeight: '600',
        textAlign: 'center',
        marginBottom: 20,
        color: '#000',
    },
    captionInput: {
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: '#000',
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
        marginBottom: 12,
    },
    viewModeContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    viewModeButton: {
        flex: 1,
        padding: 12,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        marginHorizontal: 4,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    viewModeButtonActive: {
        backgroundColor: '#E3F2FF',
        borderColor: '#007AFF',
    },
    viewModeText: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        fontWeight: '500',
    },
    viewModeTextActive: {
        color: '#007AFF',
        fontWeight: '600',
    },
    buttonRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    cancelActionButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#F8F8F8',
        borderRadius: 12,
        marginRight: 8,
    },
    cancelActionText: {
        fontSize: 16,
        color: '#666',
        fontWeight: '600',
        textAlign: 'center',
    },
    sendButton: {
        flex: 1,
        padding: 16,
        backgroundColor: '#007AFF',
        borderRadius: 12,
        marginLeft: 8,
    },
    sendButtonText: {
        fontSize: 16,
        color: '#FFF',
        fontWeight: '600',
        textAlign: 'center',
    },
});
