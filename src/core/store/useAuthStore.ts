import { create } from 'zustand';
import { supabase, isDemoMode } from '@core/config/supabase';
import type { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, gender: 'male' | 'female') => Promise<void>;
  signOut: () => Promise<void>;
  initialize: () => Promise<void>;
  enterDemoMode: () => void;
  resetPassword: (email: string) => Promise<{ error: any }>;
  verifyOtpAndResetPassword: (email: string, token: string, newPassword: string) => Promise<{ error: any }>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  demoMode: isDemoMode,

  initialize: async () => {
    if (isDemoMode) {
      set({ loading: false, demoMode: true });
      return;
    }

    try {
      const { data: { session } } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, loading: false });

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
      set({ loading: false, demoMode: true });
    }
  },

  signIn: async (email: string, password: string) => {
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },

  signUp: async (email: string, password: string, name: string, gender: 'male' | 'female') => {
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { name, gender } 
      },
    });
    
    if (error) throw error;
    
    // Crear perfil de usuario automáticamente
    if (data.user) {
      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name,
        gender,
      });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
  },

  signOut: async () => {
    if (!isDemoMode) {
      await supabase.auth.signOut();
    }
    set({ user: null });
  },

  enterDemoMode: () => {
    set({ 
      user: { id: 'demo-user', email: 'demo@app.com' } as User,
      demoMode: true 
    });
  },

  resetPassword: async (email: string) => {
    if (isDemoMode) {
      return { error: { message: 'Configura Supabase primero. Ver SETUP.md' } };
    }
    
    // Enviar código OTP de 6 dígitos al email
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        shouldCreateUser: false, // No crear usuario si no existe
        emailRedirectTo: undefined, // No enviar enlace, solo código
      }
    });
    
    return { error };
  },

  verifyOtpAndResetPassword: async (email: string, token: string, newPassword: string) => {
    if (isDemoMode) {
      return { error: { message: 'Configura Supabase primero. Ver SETUP.md' } };
    }

    // Verificar el código OTP
    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email',
    });

    if (verifyError) {
      return { error: verifyError };
    }

    // Cambiar la contraseña
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    return { error: updateError };
  },
}));
