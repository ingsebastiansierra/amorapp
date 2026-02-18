import { MessageColorTheme } from '@/core/store/useChatBackgroundStore';

export interface MessageThemeColors {
  sentBackground: string;
  sentText: string;
  receivedBackground: string;
  receivedText: string;
  gradient: string[];
}

export const MESSAGE_THEMES: Record<MessageColorTheme, MessageThemeColors> = {
  'classic-pink': {
    sentBackground: '#E91E63',
    sentText: '#FFFFFF',
    receivedBackground: '#F5F5F5',
    receivedText: '#333333',
    gradient: ['#E91E63', '#F06292'],
  },
  'ocean-blue': {
    sentBackground: '#2196F3',
    sentText: '#FFFFFF',
    receivedBackground: '#F5F5F5',
    receivedText: '#333333',
    gradient: ['#2196F3', '#64B5F6'],
  },
  'midnight-purple': {
    sentBackground: '#6A1B9A',
    sentText: '#FFFFFF',
    receivedBackground: '#F5F5F5',
    receivedText: '#333333',
    gradient: ['#6A1B9A', '#9C27B0'],
  },
  'soft-green': {
    sentBackground: '#388E3C',
    sentText: '#FFFFFF',
    receivedBackground: '#F5F5F5',
    receivedText: '#333333',
    gradient: ['#388E3C', '#66BB6A'],
  },
};

export const getMessageThemeColors = (theme: MessageColorTheme): MessageThemeColors => {
  return MESSAGE_THEMES[theme] || MESSAGE_THEMES['classic-pink'];
};
