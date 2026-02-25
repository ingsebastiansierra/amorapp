import { useEffect, useState } from 'react';
import { useRouter, useSegments } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/core/store/useAuthStore';
import { supabase } from '@/core/config/supabase';

export default function Index() {
    const router = useRouter();
    const segments = useSegments();
    const { user, loading } = useAuthStore();
    const [checking, setChecking] = useState(true);

    useEffect(() => {
        if (!loading) {
            checkUserStatus();
        }
    }, [user, loading]);

    const checkUserStatus = async () => {
        try {
            if (!user) {
                router.replace('/(auth)/login');
                return;
            }

            // Verificar si el usuario ha completado los cuestionarios
            const { data: interests } = await supabase
                .from('user_interests')
                .select('music_favorite_artist, entertainment_favorite_movie, sports_favorite_sport, food_favorite_food, lifestyle_favorite_color')
                .eq('user_id', user.id)
                .maybeSingle();

            // Verificar si todos los cuestionarios están completos
            const allCompleted = interests &&
                interests.music_favorite_artist &&
                interests.entertainment_favorite_movie &&
                interests.sports_favorite_sport &&
                interests.food_favorite_food &&
                interests.lifestyle_favorite_color;

            if (!allCompleted) {
                // Si no ha completado los cuestionarios, enviarlo a pre-registro
                router.replace('/(onboarding)/pre-registration');
            } else {
                // Si ya completó todo, enviarlo a home
                router.replace('/(app)/home');
            }
        } catch (error) {
            console.error('Error checking user status:', error);
            // En caso de error, enviar a pre-registro por seguridad
            router.replace('/(onboarding)/pre-registration');
        } finally {
            setChecking(false);
        }
    };

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
