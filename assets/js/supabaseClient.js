// Configuração otimizada SEM confirmação de email
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://pjvgzbnqnwrqxwlbndkr.supabase.co";
const supabaseKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqdmd6Ym5xbndycXh3bGJuZGtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTEyOTU3OTYsImV4cCI6MjA2Njg3MTc5Nn0.tfOu-q0HTCtWTa8wOKWHfgoAl3LBdWULV5O3R2eV4vE";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    flowType: "pkce",
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Não requer confirmação de email
  },
});
