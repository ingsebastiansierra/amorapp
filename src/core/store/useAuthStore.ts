import { create } from 'zustand';
import { supabase, isDemoMode } from '@core/config/supabase';
import type { User } from '@supabase/supabase-js';
import { autoCleanupManager } from '@/core/services/autoCleanupManager';

interface AuthState {
  user: User | null;
  loading: boolean;
  demoMode: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => Promise<void>;
  signUpWithOtp: (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<{ error: any }>;
  completeSignUp: (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => Promise<void>;
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
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Si hay error de refresh token, limpiar sesión
      if (error?.message?.includes('Refresh Token')) {
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      set({ user: session?.user ?? null, loading: false });

      // Iniciar limpieza automática si hay sesión
      if (session?.user) {
        autoCleanupManager.start(60, 7); // Cada 60 min, mantener 7 días
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        set({ user: session?.user ?? null });
        
        // Iniciar/detener limpieza según el estado de sesión
        if (session?.user) {
          autoCleanupManager.start(60, 7);
        } else {
          autoCleanupManager.stop();
        }
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

  signUpWithOtp: async (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => {
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    
    // Registrar usuario - Supabase enviará email con código OTP
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { 
        emailRedirectTo: undefined, // Esto fuerza a Supabase a enviar email de confirmación
        data: { 
          name, 
          gender,
          birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
          avatar_uri: avatarUri || null
        }
      },
    });
    
    if (error) throw error;
    
    // NO crear perfil aún, esperar verificación del código
    console.log('✅ Usuario registrado, esperando verificación OTP');
    console.log('📧 Email de confirmación enviado a:', email);
    
    return data;
  },

  verifyEmailOtp: async (email: string, token: string) => {
    if (isDemoMode) {
      return { error: { message: 'Configura Supabase primero. Ver SETUP.md' } };
    }

    // Verificar el código OTP para confirmar el email
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email', // Usar 'email' para verificación de signup
    });

    return { data, error };
  },

  completeSignUp: async (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => {
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    
    // Obtener el usuario actual (ya verificado con OTP)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('Usuario no encontrado. Por favor verifica tu email primero.');
    }
    
    // Crear perfil de usuario
    let avatarUrl: string | null = null;

    // Subir avatar si se proporcionó
    if (avatarUri) {
      try {
        const fileExt = avatarUri.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        
        // Convertir URI a blob
        const response = await fetch(avatarUri);
        const blob = await response.blob();
        
        // Subir a Supabase Storage
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, blob, {
            contentType: `image/${fileExt}`,
            upsert: false,
          });

        if (uploadError) {
          console.error('Error uploading avatar:', uploadError);
        } else {
          avatarUrl = fileName;
        }
      } catch (uploadError) {
        console.error('Error processing avatar:', uploadError);
      }
    }

    // Crear perfil en la tabla users
    const { error: profileError } = await supabase.from('users').insert({
      id: user.id,
      email: user.email!,
      name,
      gender,
      birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
      avatar_url: avatarUrl,
    });
    
    if (profileError) {
      console.error('Error creating profile:', profileError);
      throw profileError;
    }

    console.log('✅ Perfil de usuario creado exitosamente');
  },

  signUp: async (email: string, password: string, name: string, gender: 'male' | 'female', birthDate?: Date | null, avatarUri?: string | null) => {
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
      let avatarUrl: string | null = null;

      // Subir avatar si se proporcionó
      if (avatarUri) {
        try {
          const fileExt = avatarUri.split('.').pop();
          const fileName = `${data.user.id}-${Date.now()}.${fileExt}`;
          
          // Convertir URI a blob
          const response = await fetch(avatarUri);
          const blob = await response.blob();
          
          // Subir a Supabase Storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, blob, {
              contentType: `image/${fileExt}`,
              upsert: false,
            });

          if (uploadError) {
            console.error('Error uploading avatar:', uploadError);
          } else {
            avatarUrl = fileName;
          }
        } catch (uploadError) {
          console.error('Error processing avatar:', uploadError);
        }
      }

      const { error: profileError } = await supabase.from('users').insert({
        id: data.user.id,
        email: data.user.email!,
        name,
        gender,
        birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
        avatar_url: avatarUrl,
      });
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
      }
    }
  },

  signOut: async () => {
    if (!isDemoMode) {
      // Obtener user antes de cerrar sesión
      const { data: { user } } = await supabase.auth.getUser();
      
      // Limpiar datos antes de cerrar sesión (OPCIONAL - comentar si no quieres borrar al logout)
      // if (user) {
      //   await autoCleanupManager.cleanupOnLogout(user.id);
      // }
      
      await supabase.auth.signOut();
      
      // Detener limpieza automática
      autoCleanupManager.stop();
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
