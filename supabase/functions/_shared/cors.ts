// CORS-Header fuer alle Edge Functions.
// Wird in OPTIONS-Preflights und in Antworten gesetzt.
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
