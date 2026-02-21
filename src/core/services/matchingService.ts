import { supabase } from '../config/supabase';
import type { PublicUserProfile, CommonInterests } from '../types/connections';
import type { UserInterests } from '../types/interests';

class MatchingService {
  // ============================================
  // DISCOVERY & MATCHING
  // ============================================

  async findPotentialMatches(
    userId: string,
    limit: number = 20
  ): Promise<PublicUserProfile[]> {
    try {
      // Obtener mis preferencias
      const { data: myPrefs } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Obtener mi ubicación
      const { data: myUser } = await supabase
        .from('users')
        .select('location_lat, location_lng, birth_date')
        .eq('id', userId)
        .single();

      if (!myPrefs || !myUser) return [];

      // Calcular mi edad
      const myAge = this.calculateAge(myUser.birth_date);

      // Obtener usuarios bloqueados
      const { data: blocks } = await supabase
        .from('blocks')
        .select('blocked_user_id')
        .eq('blocker_user_id', userId);

      const blockedIds = (blocks || []).map(b => b.blocked_user_id);

      // Obtener usuarios ya vistos (swipes)
      const { data: swipes } = await supabase
        .from('swipes')
        .select('swiped_user_id')
        .eq('user_id', userId);

      const seenIds = (swipes || []).map(s => s.swiped_user_id);

      // Buscar usuarios potenciales
      let query = supabase
        .from('users')
        .select(`
          id,
          name,
          bio,
          photos,
          avatar_url,
          gender,
          birth_date,
          location_lat,
          location_lng,
          city,
          country,
          is_available,
          is_verified,
          is_premium,
          last_active
        `)
        .eq('is_available', true)
        .eq('is_banned', false)
        .neq('id', userId)
        .not('id', 'in', `(${[...blockedIds, ...seenIds, userId].join(',')})`)
        .limit(limit * 2); // Obtener más para filtrar después

      // Filtrar por género
      if (myPrefs.looking_for_gender !== 'any') {
        query = query.eq('gender', myPrefs.looking_for_gender);
      }

      const { data: users, error } = await query;

      if (error) throw error;
      if (!users) return [];

      // Filtrar por edad y distancia
      const filteredUsers = users
        .map(user => {
          const age = this.calculateAge(user.birth_date);
          const distance = this.calculateDistance(
            myUser.location_lat,
            myUser.location_lng,
            user.location_lat,
            user.location_lng
          );

          return {
            ...user,
            age,
            distance_km: distance,
          };
        })
        .filter(user => {
          // Filtrar por edad
          if (user.age < myPrefs.age_range_min || user.age > myPrefs.age_range_max) {
            return false;
          }

          // Filtrar por distancia
          if (user.distance_km && user.distance_km > myPrefs.distance_max_km) {
            return false;
          }

          return true;
        })
        .slice(0, limit);

      // Calcular compatibilidad para cada usuario
      const usersWithCompatibility = await Promise.all(
        filteredUsers.map(async (user) => {
          const compatibility = await this.calculateCompatibility(userId, user.id);
          return {
            ...user,
            compatibility_score: compatibility.score,
            common_interests: compatibility.common_interests,
          } as PublicUserProfile;
        })
      );

      // Ordenar por compatibilidad
      return usersWithCompatibility.sort((a, b) => 
        (b.compatibility_score || 0) - (a.compatibility_score || 0)
      );
    } catch (error) {
      console.error('Error finding potential matches:', error);
      return [];
    }
  }

  // ============================================
  // COMPATIBILITY CALCULATION
  // ============================================

  async calculateCompatibility(
    user1Id: string,
    user2Id: string
  ): Promise<{ score: number; common_interests: CommonInterests }> {
    try {
      // Verificar cache
      const cached = await this.getCompatibilityFromCache(user1Id, user2Id);
      if (cached) {
        return {
          score: cached.compatibility_score,
          common_interests: cached.common_interests || { total_count: 0 },
        };
      }

      // Obtener intereses de ambos usuarios
      const [interests1, interests2] = await Promise.all([
        this.getUserInterests(user1Id),
        this.getUserInterests(user2Id),
      ]);

      if (!interests1 || !interests2) {
        return { score: 0, common_interests: { total_count: 0 } };
      }

      let score = 0;
      const commonInterests: CommonInterests = {
        music: [],
        hobbies: [],
        sports: [],
        food: [],
        values: [],
        total_count: 0,
      };

      // === MÚSICA (20 puntos) ===
      if (interests1.music_favorite_artist === interests2.music_favorite_artist && interests1.music_favorite_artist) {
        score += 10;
        commonInterests.music?.push(interests1.music_favorite_artist);
      }

      const commonGenres = interests1.music_genres.filter(g => 
        interests2.music_genres.includes(g)
      );
      score += Math.min(commonGenres.length * 2, 10);
      commonInterests.music?.push(...commonGenres);

      // === HOBBIES (15 puntos) ===
      const commonHobbies = interests1.entertainment_hobbies.filter(h =>
        interests2.entertainment_hobbies.includes(h)
      );
      score += Math.min(commonHobbies.length * 3, 15);
      commonInterests.hobbies = commonHobbies;

      // === DEPORTES (15 puntos) ===
      if (interests1.sports_favorite_sport === interests2.sports_favorite_sport && interests1.sports_favorite_sport) {
        score += 8;
        commonInterests.sports?.push(interests1.sports_favorite_sport);
      }

      if (interests1.sports_activity_level === interests2.sports_activity_level) {
        score += 7;
      }

      // === COMIDA (10 puntos) ===
      if (interests1.food_favorite_food === interests2.food_favorite_food && interests1.food_favorite_food) {
        score += 5;
        commonInterests.food?.push(interests1.food_favorite_food);
      }

      const commonDietary = interests1.food_dietary.filter(d =>
        interests2.food_dietary.includes(d)
      );
      if (commonDietary.length > 0) {
        score += 5;
        commonInterests.food?.push(...commonDietary);
      }

      // === ESTILO DE VIDA (15 puntos) ===
      if (interests1.lifestyle_favorite_color === interests2.lifestyle_favorite_color && interests1.lifestyle_favorite_color) {
        score += 5;
      }

      if (interests1.lifestyle_rhythm === interests2.lifestyle_rhythm) {
        score += 5;
      }

      if (interests1.lifestyle_zodiac_sign && interests2.lifestyle_zodiac_sign) {
        if (this.areZodiacSignsCompatible(interests1.lifestyle_zodiac_sign, interests2.lifestyle_zodiac_sign)) {
          score += 5;
        }
      }

      // === VIAJES (10 puntos) ===
      if (interests1.travel_frequency === interests2.travel_frequency) {
        score += 5;
      }

      if (interests1.travel_dream_destination === interests2.travel_dream_destination && interests1.travel_dream_destination) {
        score += 5;
      }

      // === VALORES (15 puntos) ===
      if (interests1.values_relationship_goal === interests2.values_relationship_goal) {
        score += 8;
        commonInterests.values?.push(`Objetivo: ${interests1.values_relationship_goal}`);
      }

      if (interests1.values_wants_kids === interests2.values_wants_kids) {
        score += 7;
        commonInterests.values?.push(`Hijos: ${interests1.values_wants_kids}`);
      }

      // Calcular total de intereses en común
      commonInterests.total_count = 
        (commonInterests.music?.length || 0) +
        (commonInterests.hobbies?.length || 0) +
        (commonInterests.sports?.length || 0) +
        (commonInterests.food?.length || 0) +
        (commonInterests.values?.length || 0);

      // Guardar en cache
      await this.saveCompatibilityToCache(user1Id, user2Id, score, commonInterests);

      return { score, common_interests: commonInterests };
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return { score: 0, common_interests: { total_count: 0 } };
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private async getUserInterests(userId: string): Promise<UserInterests | null> {
    try {
      const { data, error } = await supabase
        .from('user_interests')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting user interests:', error);
      return null;
    }
  }

  private calculateAge(birthDate: string | null): number {
    if (!birthDate) return 0;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  private calculateDistance(
    lat1: number | null,
    lng1: number | null,
    lat2: number | null,
    lng2: number | null
  ): number | null {
    if (!lat1 || !lng1 || !lat2 || !lng2) return null;

    const R = 6371; // Radio de la Tierra en km
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  private areZodiacSignsCompatible(sign1: string, sign2: string): boolean {
    // Compatibilidad básica de signos zodiacales
    const compatibility: Record<string, string[]> = {
      'Aries': ['Leo', 'Sagitario', 'Géminis', 'Acuario'],
      'Tauro': ['Virgo', 'Capricornio', 'Cáncer', 'Piscis'],
      'Géminis': ['Libra', 'Acuario', 'Aries', 'Leo'],
      'Cáncer': ['Escorpio', 'Piscis', 'Tauro', 'Virgo'],
      'Leo': ['Aries', 'Sagitario', 'Géminis', 'Libra'],
      'Virgo': ['Tauro', 'Capricornio', 'Cáncer', 'Escorpio'],
      'Libra': ['Géminis', 'Acuario', 'Leo', 'Sagitario'],
      'Escorpio': ['Cáncer', 'Piscis', 'Virgo', 'Capricornio'],
      'Sagitario': ['Aries', 'Leo', 'Libra', 'Acuario'],
      'Capricornio': ['Tauro', 'Virgo', 'Escorpio', 'Piscis'],
      'Acuario': ['Géminis', 'Libra', 'Aries', 'Sagitario'],
      'Piscis': ['Cáncer', 'Escorpio', 'Tauro', 'Capricornio'],
    };

    return compatibility[sign1]?.includes(sign2) || false;
  }

  // ============================================
  // CACHE
  // ============================================

  private async getCompatibilityFromCache(user1Id: string, user2Id: string) {
    try {
      const { data, error } = await supabase
        .from('compatibility_cache')
        .select('*')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      return null;
    }
  }

  private async saveCompatibilityToCache(
    user1Id: string,
    user2Id: string,
    score: number,
    commonInterests: CommonInterests
  ) {
    try {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7); // Cache por 7 días

      await supabase.from('compatibility_cache').upsert({
        user1_id: user1Id,
        user2_id: user2Id,
        compatibility_score: score,
        common_interests: commonInterests,
        expires_at: expiresAt.toISOString(),
      });
    } catch (error) {
      console.error('Error saving compatibility to cache:', error);
    }
  }
}

export const matchingService = new MatchingService();
