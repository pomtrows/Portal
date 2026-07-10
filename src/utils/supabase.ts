import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://supabase.imagina.sbs';
const supabaseAnonKey = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTc4MzYyOTYwMCwiZXhwIjo0OTM5MzAzMjAwLCJyb2xlIjoiYW5vbiJ9.b7TFrRAI_mCkJIcM5ToVvRV6WaMFpT8RtUS_WO7namU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
