import { create } from 'zustand';
import { connectionsService } from '../services/connectionsService';
import type {
  Connection,
  Message,
  ConnectionStatus,
  SwipeAction,
} from '../types/connections';

interface ConnectionsState {
  // Estado
  connections: Connection[];
  activeConnection: Connection | null;
  messages: Record<string, Message[]>; // connectionId -> messages
  unreadCount: number;
  loading: boolean;

  // Acciones - Connections
  loadConnections: (userId: string, status?: ConnectionStatus) => Promise<void>;
  loadConnection: (connectionId: string) => Promise<void>;
  createConnectionRequest: (
    fromUserId: string,
    toUserId: string,
    initialMessage?: string,
    intention?: string
  ) => Promise<Connection | null>;
  acceptConnection: (connectionId: string) => Promise<boolean>;
  rejectConnection: (connectionId: string) => Promise<boolean>;
  muteConnection: (connectionId: string) => Promise<boolean>;
  unmuteConnection: (connectionId: string) => Promise<boolean>;
  endConnection: (connectionId: string) => Promise<boolean>;
  setActiveConnection: (connection: Connection | null) => void;

  // Acciones - Messages
  loadMessages: (connectionId: string, limit?: number) => Promise<void>;
  sendMessage: (
    connectionId: string,
    fromUserId: string,
    toUserId: string,
    message: string,
    replyToId?: string
  ) => Promise<Message | null>;
  markMessageAsRead: (messageId: string) => Promise<boolean>;
  markAllMessagesAsRead: (connectionId: string, userId: string) => Promise<boolean>;
  loadUnreadCount: (userId: string) => Promise<void>;

  // Acciones - Swipes
  recordSwipe: (userId: string, swipedUserId: string, action: SwipeAction) => Promise<boolean>;

  // Acciones - Blocks
  blockUser: (blockerId: string, blockedId: string) => Promise<boolean>;
  unblockUser: (blockerId: string, blockedId: string) => Promise<boolean>;

  // Acciones - Reports
  reportUser: (
    reporterId: string,
    reportedId: string,
    reason: string,
    description: string,
    evidence?: string[]
  ) => Promise<boolean>;

  // Helpers
  getPartnerId: (connection: Connection, myUserId: string) => string;
  reset: () => void;
}

export const useConnectionsStore = create<ConnectionsState>((set, get) => ({
  // Estado inicial
  connections: [],
  activeConnection: null,
  messages: {},
  unreadCount: 0,
  loading: false,

  // ============================================
  // CONNECTIONS
  // ============================================

  loadConnections: async (userId: string, status?: ConnectionStatus) => {
    try {
      set({ loading: true });
      const connections = await connectionsService.getMyConnections(userId, status);
      set({ connections, loading: false });
    } catch (error) {
      console.error('Error loading connections:', error);
      set({ loading: false });
    }
  },

  loadConnection: async (connectionId: string) => {
    try {
      const connection = await connectionsService.getConnection(connectionId);
      if (connection) {
        set({ activeConnection: connection });
      }
    } catch (error) {
      console.error('Error loading connection:', error);
    }
  },

  createConnectionRequest: async (
    fromUserId: string,
    toUserId: string,
    initialMessage?: string,
    intention?: string
  ) => {
    try {
      set({ loading: true });
      const connection = await connectionsService.createConnectionRequest(
        fromUserId,
        toUserId,
        initialMessage,
        intention
      );
      
      if (connection) {
        // Agregar a la lista de conexiones
        set((state) => ({
          connections: [connection, ...state.connections],
          loading: false,
        }));
      } else {
        set({ loading: false });
      }
      
      return connection;
    } catch (error) {
      console.error('Error creating connection request:', error);
      set({ loading: false });
      return null;
    }
  },

  acceptConnection: async (connectionId: string) => {
    try {
      const success = await connectionsService.acceptConnection(connectionId);
      
      if (success) {
        // Actualizar el estado de la conexión
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId
              ? { ...conn, status: 'active' as ConnectionStatus, accepted_at: new Date().toISOString() }
              : conn
          ),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error accepting connection:', error);
      return false;
    }
  },

  rejectConnection: async (connectionId: string) => {
    try {
      const success = await connectionsService.rejectConnection(connectionId);
      
      if (success) {
        // Remover de la lista
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error rejecting connection:', error);
      return false;
    }
  },

  muteConnection: async (connectionId: string) => {
    try {
      const success = await connectionsService.muteConnection(connectionId);
      
      if (success) {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId ? { ...conn, status: 'muted' as ConnectionStatus } : conn
          ),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error muting connection:', error);
      return false;
    }
  },

  unmuteConnection: async (connectionId: string) => {
    try {
      const success = await connectionsService.unmuteConnection(connectionId);
      
      if (success) {
        set((state) => ({
          connections: state.connections.map((conn) =>
            conn.id === connectionId ? { ...conn, status: 'active' as ConnectionStatus } : conn
          ),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error unmuting connection:', error);
      return false;
    }
  },

  endConnection: async (connectionId: string) => {
    try {
      const success = await connectionsService.endConnection(connectionId);
      
      if (success) {
        set((state) => ({
          connections: state.connections.filter((conn) => conn.id !== connectionId),
        }));
      }
      
      return success;
    } catch (error) {
      console.error('Error ending connection:', error);
      return false;
    }
  },

  setActiveConnection: (connection: Connection | null) => {
    set({ activeConnection: connection });
  },

  // ============================================
  // MESSAGES
  // ============================================

  loadMessages: async (connectionId: string, limit: number = 50) => {
    try {
      const messages = await connectionsService.getMessages(connectionId, limit);
      set((state) => ({
        messages: {
          ...state.messages,
          [connectionId]: messages,
        },
      }));
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  },

  sendMessage: async (
    connectionId: string,
    fromUserId: string,
    toUserId: string,
    message: string,
    replyToId?: string
  ) => {
    try {
      const newMessage = await connectionsService.sendMessage(
        connectionId,
        fromUserId,
        toUserId,
        message,
        replyToId
      );
      
      if (newMessage) {
        // Agregar mensaje a la lista
        set((state) => ({
          messages: {
            ...state.messages,
            [connectionId]: [...(state.messages[connectionId] || []), newMessage],
          },
          // Actualizar last_message_at en la conexión
          connections: state.connections.map((conn) =>
            conn.id === connectionId
              ? {
                  ...conn,
                  last_message_at: newMessage.created_at,
                  messages_count: conn.messages_count + 1,
                }
              : conn
          ),
        }));
      }
      
      return newMessage;
    } catch (error) {
      console.error('Error sending message:', error);
      return null;
    }
  },

  markMessageAsRead: async (messageId: string) => {
    try {
      return await connectionsService.markMessageAsRead(messageId);
    } catch (error) {
      console.error('Error marking message as read:', error);
      return false;
    }
  },

  markAllMessagesAsRead: async (connectionId: string, userId: string) => {
    try {
      const success = await connectionsService.markAllMessagesAsRead(connectionId, userId);
      
      if (success) {
        // Actualizar mensajes en el estado
        set((state) => ({
          messages: {
            ...state.messages,
            [connectionId]: (state.messages[connectionId] || []).map((msg) =>
              msg.to_user_id === userId ? { ...msg, read: true, read_at: new Date().toISOString() } : msg
            ),
          },
        }));
        
        // Recargar contador de no leídos
        await get().loadUnreadCount(userId);
      }
      
      return success;
    } catch (error) {
      console.error('Error marking all messages as read:', error);
      return false;
    }
  },

  loadUnreadCount: async (userId: string) => {
    try {
      const count = await connectionsService.getUnreadCount(userId);
      set({ unreadCount: count });
    } catch (error) {
      console.error('Error loading unread count:', error);
    }
  },

  // ============================================
  // SWIPES
  // ============================================

  recordSwipe: async (userId: string, swipedUserId: string, action: SwipeAction) => {
    try {
      const swipe = await connectionsService.recordSwipe(userId, swipedUserId, action);
      return !!swipe;
    } catch (error) {
      console.error('Error recording swipe:', error);
      return false;
    }
  },

  // ============================================
  // BLOCKS
  // ============================================

  blockUser: async (blockerId: string, blockedId: string) => {
    try {
      return await connectionsService.blockUser(blockerId, blockedId);
    } catch (error) {
      console.error('Error blocking user:', error);
      return false;
    }
  },

  unblockUser: async (blockerId: string, blockedId: string) => {
    try {
      return await connectionsService.unblockUser(blockerId, blockedId);
    } catch (error) {
      console.error('Error unblocking user:', error);
      return false;
    }
  },

  // ============================================
  // REPORTS
  // ============================================

  reportUser: async (
    reporterId: string,
    reportedId: string,
    reason: string,
    description: string,
    evidence?: string[]
  ) => {
    try {
      return await connectionsService.reportUser(reporterId, reportedId, reason, description, evidence);
    } catch (error) {
      console.error('Error reporting user:', error);
      return false;
    }
  },

  // ============================================
  // HELPERS
  // ============================================

  getPartnerId: (connection: Connection, myUserId: string) => {
    return connectionsService.getPartnerId(connection, myUserId);
  },

  reset: () => {
    set({
      connections: [],
      activeConnection: null,
      messages: {},
      unreadCount: 0,
      loading: false,
    });
  },
}));
