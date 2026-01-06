import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/core/store/useAuthStore';

export default function Index() {
    const router = useRouter();
    const { user, loading } = useAuthStore();

    useEffect(() => {
        if (!loading) {
            if (user) {
                router.replace('/(app)/home');
            } else {
                router.replace('/(auth)/login');
            }
        }
    }, [user, loading]);

    return (
        <View style={styles.container}>
            <ActivityIndicator size="large" color="#FF6B9D" />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFF',
    },
});
