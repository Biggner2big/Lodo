const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, 'config.js');
let configContent = fs.readFileSync(configPath, 'utf8');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_ANON_KEY environment variables are required');
  process.exit(1);
}

// Replace placeholder tokens injected by Vercel/CI at build time.
// Use replaceAll + regex so multiple occurrences are handled safely.
configContent = configContent
  .replace(/__SUPABASE_URL__/g, JSON.stringify(supabaseUrl))
  .replace(/__SUPABASE_ANON_KEY__/g, JSON.stringify(supabaseAnonKey));

// Ensure IS_CONFIGURED is always set to true in the built output
// (covers both the template default of false and any stale hard-coded value)
configContent = configContent.replace(/IS_CONFIGURED:\s*(false|true)/, 'IS_CONFIGURED: true');

fs.writeFileSync(configPath, configContent);
console.log(`Build complete: config.js updated`);
console.log(`  SUPABASE_URL      = ${supabaseUrl}`);
console.log(`  SUPABASE_ANON_KEY = ${supabaseAnonKey.slice(0, 12)}...`);