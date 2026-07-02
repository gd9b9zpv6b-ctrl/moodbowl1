export type Emotion = {
  key: string;
  label: string;
  description: string;
  icon: string; // Feather icon name
  color: string;
};

export const EMOTIONS: Emotion[] = [
  { key: 'happy', label: 'Happy', description: "I'm feeling light and joyful", icon: 'smile', color: '#FDFD96' },
  { key: 'content', label: 'Content', description: 'A quiet satisfaction inside', icon: 'check-circle', color: '#C8E6C9' },
  { key: 'grateful', label: 'Grateful', description: 'Thankful for something today', icon: 'heart', color: '#FFC8DD' },
  { key: 'hopeful', label: 'Hopeful', description: 'A small light ahead', icon: 'sun', color: '#D6E5D8' },
  { key: 'calm', label: 'Calm', description: 'Gentle and settled', icon: 'coffee', color: '#A3C4BC' },
  { key: 'peaceful', label: 'Peaceful', description: 'Everything feels okay', icon: 'moon', color: '#E0EAFC' },
  { key: 'loved', label: 'Loved', description: 'Held and cared for', icon: 'heart', color: '#FFB6C1' },
  { key: 'proud', label: 'Proud', description: 'I did something good', icon: 'award', color: '#FFD700' },
  { key: 'sad', label: 'Sad', description: 'A soft heaviness inside', icon: 'cloud-rain', color: '#A2D2FF' },
  { key: 'lonely', label: 'Lonely', description: 'I wish someone was here', icon: 'user', color: '#BDE0FE' },
  { key: 'empty', label: 'Empty', description: "I can't feel much right now", icon: 'circle', color: '#EEEEEE' },
  { key: 'numb', label: 'Numb', description: 'Distant from myself', icon: 'minus', color: '#D3D3D3' },
  { key: 'exhausted', label: 'Exhausted', description: 'Drained and tired', icon: 'battery', color: '#CDB4DB' },
  { key: 'restless', label: 'Restless', description: "I can't sit still", icon: 'activity', color: '#FFDEAD' },
  { key: 'anxious', label: 'Anxious', description: 'Something feels wrong', icon: 'wind', color: '#FFD6A5' },
  { key: 'worried', label: 'Worried', description: "Thoughts won't quiet", icon: 'alert-circle', color: '#FFE4B5' },
  { key: 'overwhelmed', label: 'Overwhelmed', description: 'Too much to hold', icon: 'layers', color: '#E8A598' },
  { key: 'insecure', label: 'Insecure', description: 'Not enough today', icon: 'shield-off', color: '#E0BBE4' },
  { key: 'frustrated', label: 'Frustrated', description: 'Stuck and blocked', icon: 'x-octagon', color: '#F08080' },
  { key: 'angry', label: 'Angry', description: 'A hot fire inside', icon: 'zap', color: '#FFAAA5' },
];

export const EMOTION_BY_KEY: Record<string, Emotion> = EMOTIONS.reduce(
  (acc, e) => ({ ...acc, [e.key]: e }),
  {},
);
