export interface BirthdayWishConfig {
  name: string;
  dob?: string; // Date of Birth: YYYY-MM-DD
  message: string;
  creatorName: string;
  relation: string;
  cakeType: CakeType;
  theme: CelebrationTheme;
  music: MusicTheme;
  gifId: string; // Built-in card/gif selection
  showAgeTicker: boolean;
  customTitle?: string; // e.g. "Happy 21st!", "Happy Anniversary!"
  recipientPhoto?: string; // Base64 compressed image
}

export type CakeType = 'chocolate' | 'strawberry' | 'rainbow' | 'cyberpunk' | 'space';

export type CelebrationTheme = 'cosmic' | 'neon' | 'rose_gold' | 'playful';

export type MusicTheme = 'classic' | 'pop' | 'synthwave' | 'lofi';

export interface BuiltInCard {
  id: string;
  name: string;
  title: string;
  gradient: string;
  textColor: string;
  emoji: string;
  description: string;
}
