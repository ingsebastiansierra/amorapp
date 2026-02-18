# 📱 Palpitos - Documento de Proyección y Monetización

## 🎯 Resumen Ejecutivo

**Palpitos** es una aplicación móvil innovadora diseñada exclusivamente para parejas, enfocada en fortalecer la conexión emocional a través de micro-interacciones, comunicación no verbal y rituales diarios compartidos.

---

## 💪 Fortalezas Actuales de la App

### 1. **Propuesta de Valor Única**
- **Comunicación Emocional en Tiempo Real**: Sistema de estados emocionales sincronizados entre parejas
- **Micro-interacciones Significativas**: Corazones interactivos con presión, emojis animados
- **Privacidad Total**: Imágenes y mensajes de voz efímeros y privados
- **Gamificación de la Relación**: Sistema de rachas y días juntos

### 2. **Funcionalidades Implementadas**
✅ Estados emocionales en tiempo real con 8 emociones diferentes
✅ Detección automática de sincronización emocional
✅ Sistema de mensajes contextuales cuando ambos sienten lo mismo
✅ Imágenes privadas efímeras con protección contra capturas de pantalla
✅ Mensajes de voz privados
✅ Notificaciones push inteligentes
✅ Perfiles personalizados con avatares
✅ Contador de días juntos y rachas de sincronización
✅ Sistema anti-spam (límite de 3 mensajes por emoción cada 6 horas)

### 3. **Stack Tecnológico Robusto**
- **Frontend**: React Native + Expo (multiplataforma iOS/Android)
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage)
- **Animaciones**: Reanimated, Gesture Handler
- **Notificaciones**: Expo Notifications + Firebase Cloud Messaging

### 4. **Ventajas Competitivas**
- 🎭 **Comunicación sin texto**: Enfoque en emociones, no en palabras
- 🔒 **Privacidad extrema**: Contenido efímero y protegido
- ⚡ **Tiempo real**: Sincronización instantánea de estados
- 💑 **Exclusividad**: Solo para parejas comprometidas (1 pareja por usuario)
- 🎯 **Simplicidad**: Interfaz minimalista y fácil de usar

---

## 💰 Integración de Google AdMob

### Estrategia de Monetización con Anuncios

#### 1. **Modelo Freemium con Anuncios**
```
Versión Gratuita (con anuncios)
├── Anuncios intersticiales cada 5 sincronizaciones
├── Banner en pantalla de historial emocional
└── Anuncio recompensado para desbloquear funciones premium temporalmente

Versión Premium (sin anuncios) - $2.99/mes
├── Sin anuncios
├── Mensajes ilimitados
├── Stickers y emojis exclusivos
└── Temas personalizados
```

#### 2. **Implementación Técnica de AdMob**

**Paso 1: Instalación de Dependencias**
```bash
# Instalar el plugin de AdMob para Expo
npx expo install expo-ads-admob

# O usar react-native-google-mobile-ads para mayor control
npm install react-native-google-mobile-ads
```

**Paso 2: Configuración en app.json**
```json
{
  "expo": {
    "plugins": [
      [
        "expo-ads-admob",
        {
          "androidAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX",
          "iosAppId": "ca-app-pub-XXXXXXXXXXXXXXXX~XXXXXXXXXX"
        }
      ]
    ]
  }
}
```

**Paso 3: Crear Servicio de Anuncios**
```typescript
// src/core/services/adService.ts
import { AdMobBanner, AdMobInterstitial, AdMobRewarded } from 'expo-ads-admob';

export const adService = {
  // IDs de prueba (reemplazar con IDs reales)
  BANNER_ID: 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL_ID: 'ca-app-pub-3940256099942544/1033173712',
  REWARDED_ID: 'ca-app-pub-3940256099942544/5224354917',

  async showInterstitial() {
    await AdMobInterstitial.setAdUnitID(this.INTERSTITIAL_ID);
    await AdMobInterstitial.requestAdAsync();
    await AdMobInterstitial.showAdAsync();
  },

  async showRewarded(onReward: () => void) {
    await AdMobRewarded.setAdUnitID(this.REWARDED_ID);
    await AdMobRewarded.requestAdAsync();
    await AdMobRewarded.showAdAsync();
    
    AdMobRewarded.addEventListener('rewardedVideoUserDidEarnReward', onReward);
  }
};
```

#### 3. **Ubicaciones Estratégicas de Anuncios**

**A. Banner en Historial Emocional**
```typescript
// En la pantalla de historial
<AdMobBanner
  bannerSize="smartBannerPortrait"
  adUnitID={adService.BANNER_ID}
  style={styles.adBanner}
/>
```

**B. Intersticial después de Sincronizaciones**
```typescript
// En home.tsx, después de detectar sincronización
useEffect(() => {
  if (isSynced && syncCount % 5 === 0) {
    // Mostrar anuncio cada 5 sincronizaciones
    adService.showInterstitial();
  }
}, [isSynced, syncCount]);
```

**C. Anuncio Recompensado para Funciones Premium**
```typescript
// Desbloquear mensajes ilimitados por 24h
const unlockUnlimitedMessages = async () => {
  await adService.showRewarded(() => {
    // Dar acceso temporal a mensajes ilimitados
    setPremiumAccess(true, 24); // 24 horas
  });
};
```

#### 4. **Mejores Prácticas**
- ⏱️ **Timing**: Mostrar anuncios en momentos naturales (después de acciones, no durante)
- 🎯 **Frecuencia**: Máximo 1 intersticial cada 5 minutos
- 💎 **Valor**: Ofrecer recompensas reales por ver anuncios
- 🚫 **Respeto**: Nunca interrumpir momentos íntimos (envío de fotos, mensajes)

#### 5. **Proyección de Ingresos**
```
Escenario Conservador (1,000 usuarios activos):
- 70% usuarios gratuitos = 700 usuarios
- 5 impresiones/día/usuario = 3,500 impresiones/día
- CPM promedio: $2.00
- Ingresos diarios: $7.00
- Ingresos mensuales: $210

Escenario Optimista (10,000 usuarios activos):
- 70% usuarios gratuitos = 7,000 usuarios
- 5 impresiones/día/usuario = 35,000 impresiones/día
- CPM promedio: $3.00
- Ingresos diarios: $105
- Ingresos mensuales: $3,150

+ Suscripciones Premium (30% usuarios):
- 3,000 usuarios × $2.99/mes = $8,970/mes

TOTAL MENSUAL (10K usuarios): ~$12,000
```

---

## 🚀 Proyección Futura - Roadmap de Funcionalidades

### Fase 1: Consolidación (Meses 1-3)
**Objetivo**: Perfeccionar funcionalidades actuales y monetización

#### 1.1 Sistema de Retos Diarios
```typescript
interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'photo' | 'voice' | 'sync' | 'activity';
  reward_points: number;
  expires_at: Date;
}

// Ejemplos:
- "Envíen una foto juntos hoy" (50 puntos)
- "Sincronicen 3 veces en el mismo día" (100 puntos)
- "Graben un mensaje de voz de 30 segundos" (30 puntos)
```

#### 1.2 Modo Pelea Inteligente
```typescript
interface FightMode {
  active: boolean;
  started_at: Date;
  resolution_suggestions: string[];
  cooldown_timer: number;
}

// Características:
- Detecta cuando ambos están "enojados" o "tristes"
- Bloquea mensajes agresivos
- Sugiere actividades de reconciliación
- Timer de enfriamiento antes de poder enviar mensajes
```

#### 1.3 Indicador de Conexión Emocional
```typescript
interface ConnectionScore {
  daily_score: number; // 0-100
  weekly_average: number;
  factors: {
    sync_frequency: number;
    message_exchange: number;
    photo_sharing: number;
    voice_notes: number;
  };
}

// Visualización:
- Gráfico de línea semanal
- Comparación con semanas anteriores
- Insights personalizados
```

### Fase 2: Expansión Social (Meses 4-6)
**Objetivo**: Crear comunidad sin perder privacidad

#### 2.1 Parejas Múltiples (Poliamorosas)
```typescript
interface MultiPartnerSupport {
  user_id: string;
  relationships: Array<{
    partner_id: string;
    relationship_type: 'primary' | 'secondary';
    started_at: Date;
    privacy_level: 'separate' | 'shared';
  }>;
}

// Características:
- Gestión de múltiples relaciones simultáneas
- Estados emocionales independientes por pareja
- Privacidad configurable entre relaciones
- Dashboard unificado con tabs por pareja
```

#### 2.2 Descubrimiento de Parejas (Dating Mode)
```typescript
interface DiscoveryMode {
  enabled: boolean;
  profile: {
    bio: string;
    interests: string[];
    relationship_goals: string[];
    photos: string[];
  };
  preferences: {
    age_range: [number, number];
    distance_km: number;
    looking_for: 'monogamous' | 'polyamorous' | 'open';
  };
}

// Características:
- Modo "Buscar Pareja" opcional
- Perfil público separado del privado
- Matching basado en compatibilidad emocional
- Chat previo antes de conectar estados emocionales
- Verificación de identidad
```

#### 2.3 Comunidad Anónima
```typescript
interface CommunityFeatures {
  anonymous_stories: {
    emotion: EmotionalState;
    story: string;
    reactions: number;
    comments: Array<{ text: string; anonymous: boolean }>;
  };
  couple_challenges: {
    global_leaderboard: boolean;
    weekly_challenges: DailyChallenge[];
  };
}

// Características:
- Historias anónimas de parejas
- Consejos de relación compartidos
- Leaderboard de parejas más sincronizadas
- Eventos globales (Día del Amor, etc.)
```

### Fase 3: Inteligencia Artificial (Meses 7-12)
**Objetivo**: Asistente de relación inteligente

#### 3.1 Coach de Relación con IA
```typescript
interface AICoach {
  analyze_patterns(): RelationshipInsights;
  suggest_activities(): Activity[];
  predict_conflicts(): ConflictPrediction;
  generate_conversation_starters(): string[];
}

// Características:
- Análisis de patrones emocionales
- Predicción de conflictos antes de que ocurran
- Sugerencias personalizadas de actividades
- Recordatorios inteligentes (aniversarios, fechas especiales)
```

#### 3.2 Generación de Contenido Personalizado
```typescript
interface AIContent {
  generate_love_letter(): string;
  create_couple_playlist(): Song[];
  suggest_date_ideas(): DateIdea[];
  generate_couple_art(): Image;
}

// Características:
- Cartas de amor generadas por IA
- Playlists basadas en estados emocionales
- Ideas de citas personalizadas
- Arte generativo de la pareja
```

### Fase 4: Ecosistema Completo (Año 2+)
**Objetivo**: Plataforma integral de relaciones

#### 4.1 Integración con Wearables
```typescript
interface WearableIntegration {
  heart_rate_sync: boolean;
  activity_tracking: boolean;
  sleep_patterns: boolean;
  stress_levels: boolean;
}

// Características:
- Sincronización de ritmo cardíaco en tiempo real
- Notificación cuando tu pareja está estresada
- Análisis de patrones de sueño compartidos
- Alertas de salud emocional
```

#### 4.2 Terapia de Pareja Virtual
```typescript
interface VirtualTherapy {
  therapist_matching: boolean;
  video_sessions: boolean;
  homework_assignments: Exercise[];
  progress_tracking: TherapyProgress;
}

// Características:
- Conexión con terapeutas certificados
- Sesiones de video integradas
- Ejercicios de pareja guiados
- Seguimiento de progreso terapéutico
```

#### 4.3 Marketplace de Experiencias
```typescript
interface ExperienceMarketplace {
  date_packages: DatePackage[];
  gift_suggestions: Gift[];
  event_tickets: Event[];
  couple_retreats: Retreat[];
}

// Características:
- Paquetes de citas pre-organizados
- Sugerencias de regalos basadas en IA
- Compra de tickets para eventos
- Retiros de parejas
```

---

## 📊 Modelo de Negocio Completo

### Fuentes de Ingreso

#### 1. **Suscripción Premium** ($2.99 - $9.99/mes)
```
Tier 1: Basic Premium ($2.99/mes)
├── Sin anuncios
├── Mensajes ilimitados
└── Stickers básicos

Tier 2: Plus ($4.99/mes)
├── Todo lo de Basic
├── Temas personalizados
├── Análisis de relación avanzado
└── Backup en la nube

Tier 3: Ultimate ($9.99/mes)
├── Todo lo de Plus
├── Coach de IA ilimitado
├── Sesiones de terapia con descuento
└── Acceso anticipado a funciones
```

#### 2. **Publicidad** (Usuarios gratuitos)
- Banners: $0.50 CPM
- Intersticiales: $3.00 CPM
- Recompensados: $10.00 CPM

#### 3. **Marketplace** (Comisión 15-20%)
- Paquetes de citas
- Regalos
- Experiencias
- Terapia

#### 4. **Partnerships**
- Restaurantes
- Hoteles
- Marcas de regalos
- Servicios de terapia

### Proyección de Crecimiento

```
Año 1:
- Usuarios: 10,000
- Ingresos: $150,000
- Fuente principal: Suscripciones + Ads

Año 2:
- Usuarios: 100,000
- Ingresos: $1,500,000
- Fuente principal: Suscripciones + Marketplace

Año 3:
- Usuarios: 500,000
- Ingresos: $7,500,000
- Fuente principal: Suscripciones + Marketplace + Partnerships

Año 5:
- Usuarios: 2,000,000
- Ingresos: $30,000,000
- Fuente principal: Ecosistema completo
```

---

## 🎯 Plan de Acción Inmediato

### Próximos 30 Días
1. ✅ Integrar Google AdMob
2. ✅ Implementar sistema de suscripción premium
3. ✅ Crear pantalla de historial emocional
4. ✅ Añadir retos diarios básicos
5. ✅ Lanzar beta cerrada con 100 parejas

### Próximos 90 Días
1. ✅ Modo pelea inteligente
2. ✅ Indicador de conexión emocional
3. ✅ Sistema de puntos y recompensas
4. ✅ Lanzamiento público en App Store y Google Play
5. ✅ Campaña de marketing inicial

### Próximos 6 Meses
1. ✅ Soporte para parejas múltiples
2. ✅ Modo de descubrimiento de parejas
3. ✅ Comunidad anónima
4. ✅ Primeras integraciones con IA
5. ✅ Alcanzar 10,000 usuarios activos

---

## 🔥 Conclusión

**Palpitos** tiene el potencial de convertirse en la aplicación líder para parejas en Latinoamérica y el mundo. Su enfoque único en la comunicación emocional, combinado con funcionalidades innovadoras y un modelo de negocio sólido, la posiciona para un crecimiento exponencial.

La integración de Google AdMob permitirá monetizar desde el día uno, mientras que las funcionalidades futuras (parejas múltiples, descubrimiento, IA) abrirán nuevos mercados y oportunidades de ingresos.

**El futuro de las relaciones es digital, emocional y conectado. Palpitos está liderando esa revolución.** 💕

---

*Documento creado: Febrero 2026*
*Versión: 1.0*
