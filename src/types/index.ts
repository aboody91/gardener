export interface Plant {
  id: string;
  user_id: string;
  name: string;
  quantity: number;
  image_url: string;
  watering_days: number;
  watering_hours: number;
  last_watered: string;
  created_at: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  country: string;
  is_admin: boolean;
  created_at: string;
  last_login: string | null;
  isOnline?: boolean;
  plants?: Plant[];
}

export interface ContactMessage {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  message: string;
  created_at: string;
}

export interface TermsAndConditions {
  id: string;
  content: string;
  updated_at: string;
  updated_by: string;
}
