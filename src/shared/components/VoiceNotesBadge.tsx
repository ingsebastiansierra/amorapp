// Badge para mostrar contador de notas de voz pendientes
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useVoiceNotes } from '../hooks/useVoiceNotes';

export function VoiceNotesBadge() {
    const { pendingNotes } = useVoiceNotes();
    const count = pendingNotes.length;

    if (count === 0) return null;

    return (
        <View style={styles.badge}>
            <Text style={styles.badgeText}>{count > 9 ? '9+' : count}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    badge: {
        position: 'absolute',
        top: -4,
        right: -4,
        backgroundColor: '#FF3B30',
        borderRadius: 10,
        minWidth: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 6,
        borderWidth: 2,
        borderColor: '#FFF',
    },
    badgeText: {
        color: '#FFF',
        fontSize: 11,
        fontWeight: '700',
    },
});
