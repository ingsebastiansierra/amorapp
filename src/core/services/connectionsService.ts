import { supabase } from '../config/supabase';
import type {
  Connection,
  Match,
  Message,
  Swipe,
  PublicUserProfile,
  ChatPreview,
  ConnectionStatus,
  SwipeAction,
} from '../types/connections';

class ConnectionsService {
  // ============================================
  // CONNECTIONS
  // ============================================

  async getMyConnections(userId: string, status?: ConnectionStatus): Promise<Connection[]> {
    try {
      let query = supabase
        .from('connections')
        .select('*')
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting connections:', error);
      return [];
    }
  }

  async getConnection(connectionId: string): Promise<Connection | null> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting connection:', error);
      return null;
    }
  }

  async createConnectionRequest(
    fromUserId: string,
    toUserId: string,
    initialMessage?: string,
    intention?: string
  ): Promise<Connection | null> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .insert({
          user1_id: fromUserId,
          user2_id: toUserId,
          initiated_by: fromUserId,
          status: 'pending',
          initial_message: initialMessage,
          initial_intention: intention,
          can_see_emotions: true,
          can_send_messages: true,
          can_see_location: false,
          can_send_media: true,
          messages_count: 0,
          syncs_count: 0,
          daily_message_limit: 50,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating connection request:', error);
      return null;
    }
  }

  async acceptConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          status: 'active',
          accepted_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error accepting connection:', error);
      return false;
    }
  }

  async rejectConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting connection:', error);
      return false;
    }
  }

  async muteConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'muted' })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error muting connection:', error);
      return false;
    }
  }

  async unmuteConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({ status: 'active' })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unmuting connection:', error);
      return false;
    }
  }

  async endConnection(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('connections')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error ending connection:', error);
      return false;
    }
  }

  async incrementSyncCount(connectionId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_sync_count', {
        connection_id: connectionId,
      });

      if (error) {
        // Fallback si la función no existe
        const connection = await this.getConnection(connectionId);
        if (connection) {
          await supabase
            .from('connections')
            .update({ syncs_count: connection.syncs_count + 1 })
            .eq('id', connectionId);
        }
      }
      return true;
    } catch (error) {
      console.error('Error incrementing sync count:', error);
      return false;
    }
  }

  // ============================================
  // MESSAGES
  // ============================================

  async getMessages(connectionId: string, limit: number = 50): Promise<Message[]> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []).reverse();
    } catch (error) {
      console.error('Error getting messages:', error);
      return [];
    }
  }

  async sendMessage(
    connectionId: string,
    fromUserId: string,
    toUserId: string,
    message: string,
    replyToId?: string
  ): Promise<Message | null> {
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          connection_id: connectionId,
          from_user_id: fromUserId,
          to_user_id: toUserId,
          message,
          message_type: 'text',
          read: false,
          reply_to_message_id: replyToId,
        })
        .select()
        .single();

      if (error) throw error;

      // Actualizar contador de mensajes y última actividad
      await supabase
        .from('connections')
        .update({
          messages_count: supabase.sql`messages_count + 1`,
          last_message_at: new Date().toISOString(),
        })
        .eq('id', connectionId);

      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  }

  async markMessageAsRead(messageId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', messageId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  }

  async markAllMessagesAsRead(connectionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('messages')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('connection_id', connectionId)
        .eq('to_user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  }

  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('to_user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unread count:', error);
      return 0;
    }
  }

  // ============================================
  // SWIPES
  // ============================================

  async recordSwipe(
    userId: string,
    swipedUserId: string,
    action: SwipeAction
  ): Promise<Swipe | null> {
    try {
      const { data, error } = await supabase
        .from('swipes')
        .insert({
          user_id: userId,
          swiped_user_id: swipedUserId,
          action,
        })
        .select()
        .single();

      if (error) throw error;

      // Si es un like, verificar si hay match mutuo
      if (action === 'like' || action === 'super_like') {
        await this.checkForMutualMatch(userId, swipedUserId);
      }

      return data;
    } catch (error) {
      console.error('Error recording swipe:', error);
      return null;
    }
  }

  async checkForMutualMatch(userId: string, otherUserId: string): Promise<boolean> {
    try {
      // Verificar si el otro usuario también dio like
      const { data: mutualLike } = await supabase
        .from('swipes')
        .select('*')
        .eq('user_id', otherUserId)
        .eq('swiped_user_id', userId)
        .in('action', ['like', 'super_like'])
        .maybeSingle();

      if (mutualLike) {
        // Crear match
        await this.createMatch(userId, otherUserId);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking for mutual match:', error);
      return false;
    }
  }

  // ============================================
  // MATCHES
  // ============================================

  async createMatch(userId: string, matchedUserId: string): Promise<Match | null> {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24);

      const { data, error } = await supabase
        .from('matches')
        .insert({
          user_id: userId,
          matched_user_id: matchedUserId,
          compatibility_score: 0, // Se calculará después
          status: 'pending',
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating match:', error);
      return null;
    }
  }

  async getMyMatches(userId: string, status?: string): Promise<Match[]> {
    try {
      let query = supabase
        .from('matches')
        .select('*')
        .or(`user_id.eq.${userId},matched_user_id.eq.${userId}`)
        .order('matched_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting matches:', error);
      return [];
    }
  }

  async acceptMatch(matchId: string): Promise<boolean> {
    try {
      const { data: match, error: matchError } = await supabase
        .from('matches')
        .select('*')
        .eq('id', matchId)
        .single();

      if (matchError) throw matchError;

      // Actualizar match
      await supabase
        .from('matches')
        .update({
          status: 'accepted',
          responded_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      // Crear conexión
      await this.createConnectionRequest(
        match.user_id,
        match.matched_user_id,
        undefined,
        match.intention_at_match
      );

      return true;
    } catch (error) {
      console.error('Error accepting match:', error);
      return false;
    }
  }

  async rejectMatch(matchId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('matches')
        .update({
          status: 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', matchId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error rejecting match:', error);
      return false;
    }
  }

  // ============================================
  // BLOCKS
  // ============================================

  async blockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      // Crear bloqueo
      await supabase.from('blocks').insert({
        blocker_user_id: blockerId,
        blocked_user_id: blockedId,
      });

      // Terminar cualquier conexión existente
      await supabase
        .from('connections')
        .update({
          status: 'blocked',
          ended_at: new Date().toISOString(),
        })
        .or(`user1_id.eq.${blockerId},user2_id.eq.${blockerId}`)
        .or(`user1_id.eq.${blockedId},user2_id.eq.${blockedId}`);

      return true;
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('blocks')
        .delete()
        .eq('blocker_user_id', blockerId)
        .eq('blocked_user_id', blockedId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  }

  async getBlockedUsers(userId: string): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('blocks')
        .select('blocked_user_id')
        .eq('blocker_user_id', userId);

      if (error) throw error;
      return (data || []).map(b => b.blocked_user_id);
    } catch (error) {
      console.error('Error getting blocked users:', error);
      return [];
    }
  }

  // ============================================
  // REPORTS
  // ============================================

  async reportUser(
    reporterId: string,
    reportedId: string,
    reason: string,
    description: string,
    evidence?: string[]
  ): Promise<boolean> {
    try {
      const { error } = await supabase.from('reports').insert({
        reported_user_id: reportedId,
        reported_by: reporterId,
        reason,
        description,
        evidence,
        status: 'pending',
      });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reporting user:', error);
      return false;
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  getPartnerId(connection: Connection, myUserId: string): string {
    return connection.user1_id === myUserId ? connection.user2_id : connection.user1_id;
  }

  async getConnectionBetweenUsers(user1Id: string, user2Id: string): Promise<Connection | null> {
    try {
      const { data, error } = await supabase
        .from('connections')
        .select('*')
        .or(`and(user1_id.eq.${user1Id},user2_id.eq.${user2Id}),and(user1_id.eq.${user2Id},user2_id.eq.${user1Id})`)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error getting connection between users:', error);
      return null;
    }
  }
}

export const connectionsService = new ConnectionsService();
