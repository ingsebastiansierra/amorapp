export enum EmotionalState {
  LOVING = 'loving',
  NORMAL = 'normal',
  SAD = 'sad',
  ANGRY = 'angry',
  NEEDY = 'needy',
  SPICY = 'spicy',
  DISTANT = 'distant',
}

export interface EmotionalStateConfig {
  emoji: string;
  label: string;
  color: string;
  gradient: [string, string];
  vibrationPattern: number[];
}

export const EMOTIONAL_STATES: Record<EmotionalState, EmotionalStateConfig> = {
  [EmotionalState.LOVING]: {
    emoji: '❤️',
    label: 'Cariño',
    color: '#FF6B9D',
    gradient: ['#FF6B9D', '#FFA8C5'],
    vibrationPattern: [0, 100, 50, 100],
  },
  [EmotionalState.NORMAL]: {
    emoji: '😐',
    label: 'Normal',
    color: '#A0AEC0',
    gradient: ['#A0AEC0', '#CBD5E0'],
    vibrationPattern: [0, 50],
  },
  [EmotionalState.SAD]: {
    emoji: '😔',
    label: 'Triste',
    color: '#4299E1',
    gradient: ['#4299E1', '#90CDF4'],
    vibrationPattern: [0, 200],
  },
  [EmotionalState.ANGRY]: {
    emoji: '😡',
    label: 'Molesto',
    color: '#F56565',
    gradient: ['#F56565', '#FC8181'],
    vibrationPattern: [0, 100, 100, 100],
  },
  [EmotionalState.NEEDY]: {
    emoji: '🥺',
    label: 'Necesito atención',
    color: '#ED8936',
    gradient: ['#ED8936', '#F6AD55'],
    vibrationPattern: [0, 50, 50, 50, 50, 50],
  },
  [EmotionalState.SPICY]: {
    emoji: '😈',
    label: 'Picante',
    color: '#9F7AEA',
    gradient: ['#9F7AEA', '#B794F4'],
    vibrationPattern: [0, 100, 50, 100, 50, 100],
  },
  [EmotionalState.DISTANT]: {
    emoji: '🤍',
    label: 'Distante',
    color: '#718096',
    gradient: ['#718096', '#A0AEC0'],
    vibrationPattern: [0, 300],
  },
};
