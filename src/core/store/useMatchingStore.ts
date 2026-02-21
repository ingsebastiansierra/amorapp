import { create } from 'zustand';
import { matchingService } from '../services/matchingService';
import { connectionsService } from '../services/connectionsService';
import type { PublicUserProfile, Match } from '../types/connections';

interface MatchingState {
  // Estado
  potentialMatches: PublicUserProfile[];
  currentMatchIndex: number;
  matches: Match[];
  loading: boolean;
  hasMore: boolean;

  // Acciones - Discovery
  loadPotentialMatches: (userId: string, limit?: number) => Promise<void>;
  nextMatch: () => void;
  previousMatch: () => void;
  getCurrentMatch: () => PublicUserProfile | null;

  // Acciones - Matches
  loadMatches: (userId: string, status?: string) => Promise<void>;
  acceptMatch: (matchId: string) => Promise<boolean>;
  rejectMatch: (matchId: string) => Promise<boolean>;

  // Acciones - Compatibility
  calculateCompatibility: (user1Id: string, user2Id: string) => Promise<{
    score: number;
    common_interests: any;
  }>;

  // Helpers
  reset: () => void;
  removeCurrentMatch: () => void;
}

export const useMatchingStore = create<MatchingState>((set, get) => ({
  // Estado inicial
  potentialMatches: [],
  currentMatchIndex: 0,
  matches: [],
  loading: false,
  hasMore: true,

  // ============================================
  // DISCOVERY
  // ============================================

  loadPotentialMatches: async (userId: string, limit: number = 20) => {
    try {
      set({ loading: true });
      const matches = await matchingService.findPotentialMatches(userId, limit);
      
      set({
        potentialMatches: matches,
        currentMatchIndex: 0,
        hasMore: matches.length >= limit,
        loading: false,
      });
    } catch (error) {
      console.error('Error loading potential matches:', error);
      set({ loading: false });
    }
  },

  nextMatch: () => {
    set((state) => {
      const nextIndex = state.currentMatchIndex + 1;
      
      // Si llegamos al final, no hay más matches
      if (nextIndex >= state.potentialMatches.length) {
        return { hasMore: false };
      }
      
      return { currentMatchIndex: nextIndex };
    });
  },

  previousMatch: () => {
    set((state) => {
      const prevIndex = Math.max(0, state.currentMatchIndex - 1);
      return { currentMatchIndex: prevIndex };
    });
  },

  getCurrentMatch: () => {
    const state = get();
    return state.potentialMatches[state.currentMatchIndex] || null;
  },

  removeCurrentMatch: () => {
    set((state) => {
      const newMatches = state.potentialMatches.filter(
        (_, index) => index !== state.currentMatchIndex
      );
      
      return {
        potentialMatches: newMatches,
        currentMatchIndex: Math.min(state.currentMatchIndex, newMatches.length - 1),
        hasMore: newMatches.length > 0,
      };
    });
  },

  // ============================================
  // MATCHES
  // ============================================

  loadMatches: async (userId: string, status?: string) => {
    try {
      set({ loading: true });
      const matches = await connectionsService.getMyMatches(userId, status);
      set({ matches, loading: false });
    } catch (error) {
      console.error('Error loading matches:', error);
      set({ loading: false });
    }
  },

  acceptMatch: async (matchId: string) => {
    try {
      const success = await connectionsService.acceptMatch(matchId);
      
      if (success) {
        // Remover de la lista de matches pendientes
        set((state) => ({
          matches: state.matches.filter((match) => match.id !== matchId),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error accepting match:', error);
      return false;
    }
  },

  rejectMatch: async (matchId: string) => {
    try {
      const success = await connectionsService.rejectMatch(matchId);
      
      if (success) {
        // Remover de la lista
        set((state) => ({
          matches: state.matches.filter((match) => match.id !== matchId),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error rejecting match:', error);
      return false;
    }
  },

  // ============================================
  // COMPATIBILITY
  // ============================================

  calculateCompatibility: async (user1Id: string, user2Id: string) => {
    try {
      return await matchingService.calculateCompatibility(user1Id, user2Id);
    } catch (error) {
      console.error('Error calculating compatibility:', error);
      return { score: 0, common_interests: { total_count: 0 } };
    }
  },

  // ============================================
  // HELPERS
  // ============================================

  reset: () => {
    set({
      potentialMatches: [],
      currentMatchIndex: 0,
      matches: [],
      loading: false,
      hasMore: true,
    });
  },
}));
