import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { usePrivateImages } from '@/shared/hooks/usePrivateImages';
import { PrivateImageCard } from '@/shared/components/PrivateImageCard';
import { SendPrivateImageButton } from '@/shared/components/SendPrivateImageButton';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';

export function PrivateMediaScreen() {
    const user = useAuthStore((state) => state.user);
    const router = useRouter();
    const { pendingImages, isLoading, loadPendingImages } = usePrivateImages();
    const [partnerId, setPartnerId] = useState<string | null>(null);

    useEffect(() => {
        loadPartnerInfo();
    }, [user]);

    const loadPartnerInfo = async () => {
        if (!user) return;

        try {
            // Obtener mi couple_id
            const { data: myData } = await supabase
                .from('users')
                .select('couple_id')
                .eq('id', user.id)
                .maybeSingle();

            if (!myData?.couple_id) return;

            // Obtener la pareja
            const { data: coupleData } = await supabase
                .from('couples')
                .select('user1_id, user2_id')
                .eq('id', myData.couple_id)
                .maybeSingle();

            if (!coupleData) return;

            // Determinar el ID de la pareja
            const partnerUserId = coupleData.user1_id === user.id
                ? coupleData.user2_id
                : coupleData.user1_id;

            setPartnerId(partnerUserId);
        } catch (error) {
            console.error('Error loading partner:', error);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header con botón de volver */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Imágenes Privadas</Text>
                    <Text style={styles.subtitle}>
                        {pendingImages.length > 0
                            ? `${pendingImages.length} imagen${pendingImages.length > 1 ? 'es' : ''} pendiente${pendingImages.length > 1 ? 's' : ''}`
                            : 'No hay imágenes pendientes'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={pendingImages}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <PrivateImageCard image={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>📭</Text>
                        <Text style={styles.emptyText}>No hay imágenes pendientes</Text>
                        <Text style={styles.emptySubtext}>
                            Las imágenes que te envíe tu pareja aparecerán aquí
                        </Text>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadPendingImages} />
                }
            />

            {partnerId && (
                <SendPrivateImageButton
                    toUserId={partnerId}
                    onSent={loadPendingImages}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: '#FFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    backIcon: {
        fontSize: 24,
        color: '#000',
    },
    headerContent: {
        flex: 1,
    },
    title: {
        fontSize: 24,
        fontWeight: '700',
        color: '#000',
        marginBottom: 2,
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
    },
    listContent: {
        paddingVertical: 8,
        flexGrow: 1,
    },
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 40,
        paddingVertical: 60,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        color: '#000',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        color: '#666',
        textAlign: 'center',
        lineHeight: 20,
    },
});
