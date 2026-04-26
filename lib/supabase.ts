import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn('[Supabase] Missing environment variables. Journaling will be disabled.');
}

/**
 * Standardized Supabase client for backend operations.
 * Uses service_role key to bypass RLS for the Bot/Server.
 */
export const supabase = (supabaseUrl && supabaseKey) 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

/**
 * Saves a trade analysis to the chartforge schema.
 */
export async function saveJournalEntry(entry: {
  pair: string;
  style: string;
  system: string;
  consensus: string;
  confidence: number;
  action: string | null;
  entry_price: string | null;
  stop_loss: string | null;
  take_profit: string | null;
  explanation: string;
  chat_id: string;
}) {
  if (!supabase) return null;

  const { data, error } = await supabase
    .schema('chartforge')
    .from('journal_entries')
    .insert([entry])
    .select();

  if (error) {
    console.error('[Supabase] Error saving journal entry:', error);
    return null;
  }

  return data?.[0];
}

/**
 * Clears the journal for a specific user.
 */
export async function clearJournal(chatId: string) {
  if (!supabase) return false;

  const { error } = await supabase
    .schema('chartforge')
    .from('journal_entries')
    .delete()
    .eq('chat_id', chatId);

  if (error) {
    console.error('[Supabase] Error clearing journal:', error);
    return false;
  }

  return true;
}

/**
 * Gets recent lessons for a specific pair.
 * Used for "Reflexive Learning" so the AI doesn't repeat mistakes.
 */
export async function getPairSpecificLessons(pair: string, limit: number = 3) {
  if (!supabase) return "";

  const { data, error } = await supabase
    .schema('chartforge')
    .from('journal_entries')
    .select('consensus, action, explanation, timestamp')
    .eq('pair', pair)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error || !data || data.length === 0) return "No recent history for this pair. Proceed with fresh logic.";

  return data.map(d => {
    return `[${d.timestamp}] VERDICT: ${d.consensus} | ACTION: ${d.action}\nLESSON: ${d.explanation.substring(0, 200)}...`;
  }).join('\n\n');
}

/**
 * Gets recent journals for a user.
 */
export async function getRecentJournals(chatId: string, limit: number = 5) {
  if (!supabase) return [];

  const { data, error } = await supabase
    .schema('chartforge')
    .from('journal_entries')
    .select('*')
    .eq('chat_id', chatId)
    .order('timestamp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[Supabase] Error fetching journals:', error);
    return [];
  }

  return data || [];
}
