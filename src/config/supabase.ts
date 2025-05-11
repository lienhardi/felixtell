import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gzlaxsumaorevaxyswoc.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd6bGF4c3VtYW9yZXZheHlzd29jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY4ODAzMjQsImV4cCI6MjA2MjQ1NjMyNH0.3yVwPjm4wDpHPCvVbKoG-8-Tr_pw8vz0XZ8hkMxMKa8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey); 