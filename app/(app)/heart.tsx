import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function HeartScreen() {
    return (
        <View style={styles.container}>
            <Text style={styles.emoji}>💕</Text>
            <Text style={styles.text}>Coming Soon</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F6F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    emoji: {
        fontSize: 80,
        marginBottom: 16,
    },
    text: {
        fontSize: 18,
        fontWeight: '600',
        color: '#6B7280',
    },
});
