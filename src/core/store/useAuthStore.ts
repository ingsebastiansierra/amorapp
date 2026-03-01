import { create } from 'zustand';
import { supabase, isDemoMode } from '@core/config/supabase';
import type { User } from '@supabase/supabase-js';
import { autoCleanupManager } from '@/core/services/autoCleanupManager';
import { uploadAvatar, updateUserAvatar } from '@core/utils/avatarUpload';
import { logger } from '@core/utils/logger';

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
      console.log('🔄 [INIT] Inicializando autenticación...');
      
      const { data: { session }, error } = await supabase.auth.getSession();
      
      // Si hay error de refresh token, limpiar sesión
      if (error?.message?.includes('Refresh Token')) {
        console.log('❌ [INIT] Token expirado, limpiando sesión');
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      if (!session?.user) {
        console.log('❌ [INIT] No hay sesión activa');
        set({ user: null, loading: false });
        return;
      }
      
      console.log('👤 [INIT] Sesión encontrada:', session.user.id);
      console.log('📧 [INIT] Email confirmado:', !!session.user.email_confirmed_at);
      
      // VALIDACIÓN 1: Email debe estar confirmado
      if (!session.user.email_confirmed_at) {
        console.log('⚠️ [INIT] Email no confirmado, cerrando sesión');
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      // VALIDACIÓN 2: Verificar que el usuario existe en auth.users
      console.log('🔍 [INIT] Verificando usuario en auth...');
      const { data: authUser, error: authError } = await supabase.auth.getUser();
      
      if (authError || !authUser.user) {
        console.log('❌ [INIT] Usuario no válido en auth, cerrando sesión');
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      // VALIDACIÓN 3: Verificar que existe perfil en public.users
      console.log('🔍 [INIT] Verificando perfil en base de datos...');
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('id, name, email')
        .eq('id', session.user.id)
        .maybeSingle();
      
      if (profileError) {
        console.error('❌ [INIT] Error verificando perfil:', profileError);
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      if (!profile) {
        console.log('⚠️ [INIT] Perfil no existe en base de datos, cerrando sesión');
        await supabase.auth.signOut();
        set({ user: null, loading: false });
        return;
      }
      
      console.log('✅ [INIT] Usuario válido:', profile.name);
      set({ user: session.user, loading: false });

      // Iniciar limpieza automática si hay sesión válida
      autoCleanupManager.start(60, 7); // Cada 60 min, mantener 7 días

      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          // Validar también en los cambios de estado
          const { data: currentProfile } = await supabase
            .from('users')
            .select('id')
            .eq('id', session.user.id)
            .maybeSingle();
            
          if (currentProfile && session.user.email_confirmed_at) {
            set({ user: session.user });
            autoCleanupManager.start(60, 7);
          } else {
            console.log('⚠️ [AUTH_CHANGE] Usuario inválido, cerrando sesión');
            await supabase.auth.signOut();
            set({ user: null });
            autoCleanupManager.stop();
          }
        } else {
          set({ user: null });
          autoCleanupManager.stop();
        }
      });
    } catch (error) {
      console.error('💥 [INIT] Error inicializando auth:', error);
      await supabase.auth.signOut();
      set({ user: null, loading: false });
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
    console.log('🚀 [REGISTRO] Iniciando registro con verificación OTP...');
    
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    
    try {
      console.log('📝 [PASO 1] Registrando usuario en auth (sin confirmar)...');
      
      // PASO 1: Solo crear usuario en auth, SIN crear perfil ni subir avatar
      // El email NO se confirma automáticamente, requiere OTP
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          // NO crear perfil aquí, solo metadata temporal
          data: {
            temp_name: name,
            temp_gender: gender,
            temp_birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
            temp_avatar_uri: avatarUri,
          }
        }
      });
      
      if (authError) {
        console.error('❌ [AUTH] Error en registro:', authError);
        throw new Error(authError.message);
      }
      
      if (!authData.user) {
        throw new Error('No se pudo crear el usuario');
      }
      
      console.log('✅ [PASO 1] Usuario creado en auth (pendiente verificación):', authData.user.id);
      console.log('📧 [PASO 1] Código OTP enviado al email:', email);
      
      // NO crear perfil ni subir avatar aquí
      // Eso se hará en completeSignUp después de verificar OTP
      
    } catch (err: any) {
      console.error('💥 [REGISTRO] Error:', err.message);
      throw new Error(err.message || 'Error al registrar usuario');
    }
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
    console.log('🎯 [COMPLETE] Completando registro después de verificar OTP...');
    
    if (isDemoMode) {
      throw new Error('Configura Supabase primero. Ver SETUP.md');
    }
    
    try {
      // PASO 1: Obtener el usuario actual (ya debería estar autenticado después del OTP)
      console.log('🔍 [COMPLETE] Obteniendo usuario actual...');
      let { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        console.log('⚠️ [COMPLETE] No hay usuario autenticado, intentando iniciar sesión...');
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError || !signInData.user) {
          console.error('❌ [COMPLETE] Error iniciando sesión:', signInError);
          throw new Error('No se pudo iniciar sesión después de verificar el email.');
        }
        
        user = signInData.user;
        console.log('✅ [COMPLETE] Sesión iniciada:', user.id);
      } else {
        console.log('✅ [COMPLETE] Usuario ya autenticado:', user.id);
      }
      
      // PASO 2: Verificar que el email esté confirmado
      if (!user.email_confirmed_at) {
        console.error('❌ [COMPLETE] Email no confirmado:', user.email_confirmed_at);
        throw new Error('El email no ha sido verificado correctamente.');
      }
      
      console.log('✅ [COMPLETE] Email confirmado correctamente');
      
      // PASO 3: Verificar si ya existe el perfil (por si acaso)
      console.log('🔍 [COMPLETE] Verificando si ya existe perfil...');
      const { data: existingProfile, error: checkError } = await supabase
        .from('users')
        .select('id, name, email, gender, birth_date, avatar_url')
        .eq('id', user.id)
        .maybeSingle();
      
      if (checkError) {
        console.error('❌ [COMPLETE] Error verificando perfil existente:', checkError);
      }
      
      if (existingProfile) {
        console.log('⚠️ [COMPLETE] El perfil ya existe:', existingProfile);
        console.log('⚠️ [COMPLETE] Actualizando datos...');
        const { error: updateError } = await supabase
          .from('users')
          .update({
            name,
            gender,
            birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
          })
          .eq('id', user.id);
          
        if (updateError) {
          console.error('❌ [COMPLETE] Error actualizando perfil:', updateError);
          throw new Error(`Error actualizando perfil: ${updateError.message}`);
        }
        
        console.log('✅ [COMPLETE] Perfil actualizado exitosamente');
      } else {
        // PASO 4: Crear perfil en la tabla users
        console.log('📝 [COMPLETE] Creando perfil de usuario...');
        console.log('📊 [COMPLETE] Datos del perfil:');
        console.log('  - ID:', user.id);
        console.log('  - Email:', user.email);
        console.log('  - Nombre:', name);
        console.log('  - Género:', gender);
        console.log('  - Fecha nacimiento:', birthDate ? birthDate.toISOString().split('T')[0] : null);
        
        const profileData = {
          id: user.id,
          email: user.email!,
          name,
          gender,
          birth_date: birthDate ? birthDate.toISOString().split('T')[0] : null,
          avatar_url: null, // Se actualizará después si hay avatar
        };
        
        console.log('📤 [COMPLETE] Insertando perfil:', JSON.stringify(profileData, null, 2));
        
        const { data: insertedProfile, error: profileError } = await supabase
          .from('users')
          .insert(profileData)
          .select();
        
        if (profileError) {
          console.error('❌ [COMPLETE] Error creando perfil:', profileError);
          console.error('❌ [COMPLETE] Código de error:', profileError.code);
          console.error('❌ [COMPLETE] Mensaje:', profileError.message);
          console.error('❌ [COMPLETE] Detalles:', profileError.details);
          console.error('❌ [COMPLETE] Hint:', profileError.hint);
          throw new Error(`Error creando perfil: ${profileError.message}`);
        }
        
        console.log('✅ [COMPLETE] Perfil creado exitosamente:', insertedProfile);
      }
      
      // PASO 5: Subir avatar si se proporcionó
      if (avatarUri) {
        console.log('📸 [COMPLETE] Subiendo avatar...');
        
        const result = await uploadAvatar(user.id, avatarUri);
        
        if (result.success && result.fileName) {
          const updated = await updateUserAvatar(user.id, result.fileName);
          if (updated) {
            console.log('✅ [COMPLETE] Avatar subido y perfil actualizado');
          } else {
            console.warn('⚠️ [COMPLETE] Avatar subido pero no se pudo actualizar perfil');
          }
        } else {
          console.warn('⚠️ [COMPLETE] No se pudo subir avatar:', result.error);
          console.warn('⚠️ [COMPLETE] El usuario puede subir avatar más tarde desde su perfil');
        }
      }
      
      // PASO 6: Actualizar estado de la sesión
      set({ user });
      
      console.log('🎉 [COMPLETE] Registro completado exitosamente');
      
    } catch (err: any) {
      console.error('💥 [COMPLETE] Error:', err.message);
      console.error('💥 [COMPLETE] Stack:', err.stack);
      throw new Error(err.message || 'Error completando el registro');
    }
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
