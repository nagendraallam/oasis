// Player related types
export interface PlayerData {
  id: string;
  position: [number, number, number];
  shape?: string;
  color: string;
  username?: string;
  isNew?: boolean;
  rotation?: number;
}

// Chat related types
export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
} 