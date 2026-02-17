// Script para borrar TODOS los datos de prueba
// Ejecutar desde la app o consola de desarrollo

import { supabase } from '@/core/config/supabase';

export async function deleteAllData() {
  console.log('🗑️ Iniciando limpieza completa...');

  try {
    // 1. BORRAR ARCHIVOS DE VOZ DEL STORAGE
    console.log('\n📁 Borrando archivos de voz del storage...');
    const { data: voiceFiles, error: voiceListError } = await supabase.storage
      .from('voice-notes')
      .list();

    if (voiceListError) {
      console.error('❌ Error listando archivos de voz:', voiceListError);
    } else if (voiceFiles && voiceFiles.length > 0) {
      const voicePaths = voiceFiles.map(file => file.name);
      console.log(`   Encontrados ${voicePaths.length} archivos de voz`);
      
      const { error: voiceDeleteError } = await supabase.storage
        .from('voice-notes')
        .remove(voicePaths);
      
      if (voiceDeleteError) {
        console.error('❌ Error borrando archivos de voz:', voiceDeleteError);
      } else {
        console.log(`   ✅ ${voicePaths.length} archivos de voz borrados`);
      }
    } else {
      console.log('   ℹ️ No hay archivos de voz para borrar');
    }

    // 2. BORRAR ARCHIVOS DE IMÁGENES DEL STORAGE
    console.log('\n📁 Borrando archivos de imágenes del storage...');
    const { data: imageFiles, error: imageListError } = await supabase.storage
      .from('private-images')
      .list();

    if (imageListError) {
      console.error('❌ Error listando archivos de imágenes:', imageListError);
    } else if (imageFiles && imageFiles.length > 0) {
      const imagePaths = imageFiles.map(file => file.name);
      console.log(`   Encontrados ${imagePaths.length} archivos de imagen`);
      
      const { error: imageDeleteError } = await supabase.storage
        .from('private-images')
        .remove(imagePaths);
      
      if (imageDeleteError) {
        console.error('❌ Error borrando archivos de imágenes:', imageDeleteError);
      } else {
        console.log(`   ✅ ${imagePaths.length} archivos de imagen borrados`);
      }
    } else {
      console.log('   ℹ️ No hay archivos de imagen para borrar');
    }

    // 3. BORRAR REGISTROS DE NOTAS DE VOZ DE LA BD
    console.log('\n💾 Borrando registros de notas de voz de la BD...');
    const { error: voiceDbError } = await supabase
      .from('voice_notes')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todos

    if (voiceDbError) {
      console.error('❌ Error borrando notas de voz de BD:', voiceDbError);
    } else {
      console.log('   ✅ Notas de voz borradas de BD');
    }

    // 4. BORRAR REGISTROS DE IMÁGENES DE LA BD
    console.log('\n💾 Borrando registros de imágenes de la BD...');
    const { error: imageDbError } = await supabase
      .from('images_private')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todos

    if (imageDbError) {
      console.error('❌ Error borrando imágenes de BD:', imageDbError);
    } else {
      console.log('   ✅ Imágenes borradas de BD');
    }

    // 5. BORRAR MENSAJES
    console.log('\n💾 Borrando mensajes...');
    const { error: messagesError } = await supabase
      .from('sync_messages')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Borrar todos

    if (messagesError) {
      console.error('❌ Error borrando mensajes:', messagesError);
    } else {
      console.log('   ✅ Mensajes borrados');
    }

    // 6. LIMPIAR HISTORIAL DE ESTADOS EMOCIONALES (mantener solo el actual)
    console.log('\n💾 Limpiando historial de estados emocionales...');
    
    // Obtener el estado más reciente de cada usuario
    const { data: latestStates } = await supabase
      .from('emotional_states')
      .select('id, user_id, created_at')
      .order('created_at', { ascending: false });

    if (latestStates) {
      // Agrupar por usuario y mantener solo el más reciente
      const latestByUser = new Map();
      latestStates.forEach(state => {
        if (!latestByUser.has(state.user_id)) {
          latestByUser.set(state.user_id, state.id);
        }
      });

      const idsToKeep = Array.from(latestByUser.values());
      
      // Borrar todos excepto los más recientes
      const { error: emotionsError } = await supabase
        .from('emotional_states')
        .delete()
        .not('id', 'in', `(${idsToKeep.map(id => `'${id}'`).join(',')})`);

      if (emotionsError) {
        console.error('❌ Error limpiando estados emocionales:', emotionsError);
      } else {
        console.log('   ✅ Historial de estados emocionales limpiado');
      }
    }

    // 7. VERIFICAR RESULTADOS
    console.log('\n📊 Verificando resultados...');
    
    const { count: messagesCount } = await supabase
      .from('sync_messages')
      .select('*', { count: 'exact', head: true });
    
    const { count: voiceCount } = await supabase
      .from('voice_notes')
      .select('*', { count: 'exact', head: true });
    
    const { count: imagesCount } = await supabase
      .from('images_private')
      .select('*', { count: 'exact', head: true });
    
    const { count: emotionsCount } = await supabase
      .from('emotional_states')
      .select('*', { count: 'exact', head: true });

    const { data: voiceStorageFiles } = await supabase.storage
      .from('voice-notes')
      .list();
    
    const { data: imageStorageFiles } = await supabase.storage
      .from('private-images')
      .list();

    console.log('\n✅ LIMPIEZA COMPLETADA');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`   Mensajes restantes: ${messagesCount || 0}`);
    console.log(`   Notas de voz (BD): ${voiceCount || 0}`);
    console.log(`   Imágenes (BD): ${imagesCount || 0}`);
    console.log(`   Estados emocionales: ${emotionsCount || 0}`);
    console.log(`   Archivos de voz (storage): ${voiceStorageFiles?.length || 0}`);
    console.log(`   Archivos de imagen (storage): ${imageStorageFiles?.length || 0}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    return {
      success: true,
      remaining: {
        messages: messagesCount || 0,
        voiceNotes: voiceCount || 0,
        images: imagesCount || 0,
        emotions: emotionsCount || 0,
        voiceFiles: voiceStorageFiles?.length || 0,
        imageFiles: imageStorageFiles?.length || 0,
      }
    };

  } catch (error) {
    console.error('❌ Error en limpieza:', error);
    return {
      success: false,
      error
    };
  }
}

// Para ejecutar desde la consola de desarrollo:
// import { deleteAllData } from '@/scripts/deleteAllData';
// deleteAllData();
