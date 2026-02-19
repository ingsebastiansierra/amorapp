export type EventType = 'anniversary' | 'date' | 'movie' | 'special' | 'other';

export interface CoupleEvent {
    id: string;
    couple_id: string;
    created_by: string;
    title: string;
    description?: string;
    event_date: string;
    event_type: EventType;
    location?: string;
    reminder_enabled: boolean;
    created_at: string;
    updated_at: string;
}

export interface CreateEventData {
    title: string;
    description?: string;
    event_date: string;
    event_type: EventType;
    location?: string;
    reminder_enabled?: boolean;
}

export const EVENT_TYPES = {
    anniversary: {
        label: 'Aniversario',
        emoji: '💕',
        color: '#FF6B9D',
    },
    date: {
        label: 'Cita Romántica',
        emoji: '🍽️',
        color: '#F59E0B',
    },
    movie: {
        label: 'Noche de Pelis',
        emoji: '🎬',
        color: '#8B5CF6',
    },
    special: {
        label: 'Momento Especial',
        emoji: '✨',
        color: '#EC4899',
    },
    other: {
        label: 'Otro',
        emoji: '📅',
        color: '#6B7280',
    },
} as const;
