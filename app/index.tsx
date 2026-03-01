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
            console.log('🔍 [INDEX] Verificando estado del usuario...');
            
            if (!user) {
                console.log('❌ [INDEX] No hay usuario válido, redirigiendo a login');
                router.replace('/(auth)/login');
                return;
            }

            console.log('👤 [INDEX] Usuario válido encontrado:', user.id);

            // El usuario ya fue validado en initialize(), solo verificar cuestionarios
            console.log('🔍 [INDEX] Verificando cuestionarios...');
            const { data: interests, error: interestsError } = await supabase
                .from('user_interests')
                .select('music_favorite_artist, entertainment_favorite_movie, sports_favorite_sport, food_favorite_food, lifestyle_favorite_color')
                .eq('user_id', user.id)
                .maybeSingle();

            if (interestsError) {
                console.error('❌ [INDEX] Error obteniendo intereses:', interestsError);
                console.log('📝 [INDEX] Redirigiendo a onboarding por error');
                router.replace('/(onboarding)/pre-registration');
                return;
            }

            console.log('📊 [INDEX] Datos de intereses:', interests);

            // Verificar si todos los cuestionarios están completos
            // Si interests es null, significa que nunca ha completado ningún cuestionario
            const allCompleted = interests !== null &&
                interests.music_favorite_artist !== null &&
                interests.entertainment_favorite_movie !== null &&
                interests.sports_favorite_sport !== null &&
                interests.food_favorite_food !== null &&
                interests.lifestyle_favorite_color !== null;

            console.log('✅ [INDEX] Cuestionarios completos:', allCompleted);
            console.log('📋 [INDEX] Detalles:');
            console.log('  - Música:', interests?.music_favorite_artist ? '✅' : '❌');
            console.log('  - Entretenimiento:', interests?.entertainment_favorite_movie ? '✅' : '❌');
            console.log('  - Deportes:', interests?.sports_favorite_sport ? '✅' : '❌');
            console.log('  - Comida:', interests?.food_favorite_food ? '✅' : '❌');
            console.log('  - Estilo de vida:', interests?.lifestyle_favorite_color ? '✅' : '❌');

            if (!allCompleted) {
                console.log('📝 [INDEX] Cuestionarios incompletos, redirigiendo a onboarding');
                router.replace('/(onboarding)/pre-registration');
            } else {
                console.log('🏠 [INDEX] Todo completo, redirigiendo a home');
                router.replace('/(app)/home');
            }
        } catch (error) {
            console.error('💥 [INDEX] Error verificando estado:', error);
            // En caso de error, ir a onboarding por seguridad
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
