import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bddnovbebqcbliqsoxxa.supabase.co';
const supabaseAnonKey = 'sb_publishable_hh0h-uyKHeqh5F6K5ckMAw_dVrcTkhj';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;