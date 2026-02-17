// Types para tracking de relación y sincronización

export interface SyncStreak {
    id: string;
    couple_id: string;
    current_streak: number;
    best_streak: number;
    last_sync_date: string | null;
    total_syncs: number;
    created_at: string;
    updated_at: string;
}

export interface EmotionalSync {
    id: string;
    couple_id: string;
    emotion: string;
    synced_at: string;
    ended_at: string | null;
    duration_seconds: number | null;
    resulted_in_message: boolean;
}

export interface SyncStats {
    days_together: number;
    current_streak: number;
    best_streak: number;
    total_syncs: number;
    most_synced_emotion: string | null;
    syncs_this_week: number;
}

export interface RelationshipInfo {
    couple_id: string;
    relationship_start_date: string;
    days_together: number;
    sync_stats: SyncStats;
}
