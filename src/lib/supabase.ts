import { createClient } from '@supabase/supabase-js';

export type Swipe = {
  id: string;
  brand_id: string;
  model_name: string;
  direction: 'left' | 'right';
  created_at: string;
};

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
); 