import React from 'react';
import { Modal, View, StyleSheet, Pressable, Text } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { ADMOB_BANNER_ID } from '@/core/config/admob';
import { Ionicons } from '@expo/vector-icons';

interface InterstitialFallbackModalProps {
    visible: boolean;
    onClose: () => void;
}

export const InterstitialFallbackModal: React.FC<InterstitialFallbackModalProps> = ({
    visible,
    onClose,
}) => {
    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Pressable style={styles.closeButton} onPress={onClose}>
                        <Ionicons name="close-circle" size={32} color="#666" />
                    </Pressable>

                    <BannerAd
                        unitId={ADMOB_BANNER_ID}
                        size={BannerAdSize.MEDIUM_RECTANGLE}
                        requestOptions={{
                            requestNonPersonalizedAdsOnly: false,
                        }}
                        onAdLoaded={() => {
                            console.log('✅ Banner fallback cargado');
                        }}
                        onAdFailedToLoad={(error) => {
                            console.log('❌ Banner fallback también falló:', error);
                            // Cerrar modal si el banner también falla
                            setTimeout(onClose, 1000);
                        }}
                    />

                    <Text style={styles.fallbackText}>Toca para cerrar</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFF',
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    closeButton: {
        position: 'absolute',
        top: -16,
        right: -16,
        zIndex: 10,
        backgroundColor: '#FFF',
        borderRadius: 16,
    },
    fallbackText: {
        marginTop: 12,
        fontSize: 14,
        color: '#999',
        textAlign: 'center',
    },
});
