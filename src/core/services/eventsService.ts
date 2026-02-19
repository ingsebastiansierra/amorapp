import { supabase } from '@/core/config/supabase';
import { CoupleEvent, CreateEventData } from '@/core/types/events';

class EventsService {
    async getEvents(coupleId: string): Promise<CoupleEvent[]> {
        const { data, error } = await supabase
            .from('couple_events')
            .select('*')
            .eq('couple_id', coupleId)
            .order('event_date', { ascending: true });

        if (error) throw error;
        return data || [];
    }

    async getUpcomingEvents(coupleId: string, limit: number = 5): Promise<CoupleEvent[]> {
        const now = new Date().toISOString();
        
        const { data, error } = await supabase
            .from('couple_events')
            .select('*')
            .eq('couple_id', coupleId)
            .gte('event_date', now)
            .order('event_date', { ascending: true })
            .limit(limit);

        if (error) throw error;
        return data || [];
    }

    async createEvent(coupleId: string, userId: string, eventData: CreateEventData): Promise<CoupleEvent> {
        const { data, error } = await supabase
            .from('couple_events')
            .insert({
                couple_id: coupleId,
                created_by: userId,
                ...eventData,
            })
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async updateEvent(eventId: string, eventData: Partial<CreateEventData>): Promise<CoupleEvent> {
        const { data, error } = await supabase
            .from('couple_events')
            .update({
                ...eventData,
                updated_at: new Date().toISOString(),
            })
            .eq('id', eventId)
            .select()
            .single();

        if (error) throw error;
        return data;
    }

    async deleteEvent(eventId: string): Promise<void> {
        const { error } = await supabase
            .from('couple_events')
            .delete()
            .eq('id', eventId);

        if (error) throw error;
    }

    getDaysUntil(eventDate: string): number {
        const now = new Date();
        const event = new Date(eventDate);
        const diffTime = event.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }

    formatEventDate(eventDate: string): string {
        const date = new Date(eventDate);
        const options: Intl.DateTimeFormatOptions = {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return date.toLocaleDateString('es-ES', options);
    }
}

export const eventsService = new EventsService();
