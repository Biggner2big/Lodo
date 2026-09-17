// Client-side Configuration Loader
// Injected at build time via Vercel environment variables
window.APP_CONFIG = {
  SUPABASE_URL: "https://apxptddbcqnssimwvinj.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable__jXL2-gAa9kI4AT92Y6v-w_UN8xrf8W",
  IS_CONFIGURED: true
};

if (typeof __SUPABASE_URL__ !== 'undefined' && __SUPABASE_URL__ !== '__SUPABASE_URL__') {
  window.APP_CONFIG.SUPABASE_URL = __SUPABASE_URL__;
  window.APP_CONFIG.SUPABASE_ANON_KEY = __SUPABASE_ANON_KEY__;
  window.APP_CONFIG.IS_CONFIGURED = true;
}