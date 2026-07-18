import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://supabase.imagina.sbs';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MzYyOTYwMCwiZXhwIjo0OTM5MzAzMjAwLCJyb2xlIjoiYW5vbiJ9.b7TFrRAI_mCkJIcM5ToVvRV6WaMFpT8RtUS_WO7namU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
