import '../src/core/config/polyfills';
import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from '@/core/store/useAuthStore';
import { firebaseService } from '@/core/services/firebaseService';
import mobileAds from 'react-native-google-mobile-ads';

export default function RootLayout() {
    const initialize = useAuthStore((state) => state.initialize);

    useEffect(() => {
        // Inicializar Firebase
        firebaseService.initialize().catch((error) => {
            console.log('⚠️ Firebase no disponible:', error);
        });

        initialize();

        // Inicializar AdMob
        mobileAds()
            .initialize()
            .then(() => {
                console.log('✅ AdMob inicializado correctamente');
            })
            .catch((error) => {
                console.warn('⚠️ AdMob initialization failed:', error);
            });
    }, []);

    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(app)" />
            </Stack>
        </GestureHandlerRootView>
    );
}
