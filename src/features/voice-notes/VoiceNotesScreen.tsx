// Pantalla para ver y gestionar notas de voz
import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    RefreshControl,
    SafeAreaView,
    Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useVoiceNotes } from '@/shared/hooks/useVoiceNotes';
import { VoiceNoteCard } from '@/shared/components/VoiceNoteCard';

export function VoiceNotesScreen() {
    const router = useRouter();
    const { pendingNotes, isLoading, loadPendingNotes } = useVoiceNotes();

    useEffect(() => {
        loadPendingNotes();
    }, []);

    return (
        <SafeAreaView style={styles.container}>
            {/* Header con botón de volver */}
            <View style={styles.header}>
                <Pressable
                    style={styles.backButton}
                    onPress={() => router.back()}
                >
                    <Text style={styles.backIcon}>←</Text>
                </Pressable>
                <View style={styles.headerContent}>
                    <Text style={styles.title}>Notas de Voz</Text>
                    <Text style={styles.subtitle}>
                        {pendingNotes.length > 0
                            ? `${pendingNotes.length} nota${pendingNotes.length > 1 ? 's' : ''} pendiente${pendingNotes.length > 1 ? 's' : ''}`
                            : 'No hay notas pendientes'}
                    </Text>
                </View>
            </View>

            <FlatList
                data={pendingNotes}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => <VoiceNoteCard note={item} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Text style={styles.emptyIcon}>🎤</Text>
                        <Text style={styles.emptyText}>No hay notas de voz pendientes</Text>
                        <Text style={styles.emptySubtext}>
                            Las notas de voz que te envíe tu pareja aparecerán aquí
                        </Text>
                        <View style={styles.infoBox}>
                            <Text style={styles.infoIcon}>🔥</Text>
                            <Text style={styles.infoText}>
                                Las notas se autodestruyen después de escucharlas
                            </Text>
                        </View>
                    </View>
                }
                refreshControl={
                    <RefreshControl refreshing={isLoading} onRefresh={loadPendingNotes} />
                }
            />
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
        marginBottom: 24,
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFF3CD',
        borderRadius: 12,
        padding: 16,
        gap: 12,
    },
    infoIcon: {
        fontSize: 24,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
        color: '#856404',
        lineHeight: 18,
    },
});
