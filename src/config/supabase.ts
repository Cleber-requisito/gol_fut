import { createClient } from '@supabase/supabase-js';

// Initialize the Supabase client
export const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper functions for database operations
export const getUsers = async () => {
  const { data, error } = await supabase.from('users').select('*');
  if (error) throw error;
  return data;
};

export const getUserById = async (id: string) => {
  const { data, error } = await supabase.from('users').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const createUser = async (userData: any) => {
  const { data, error } = await supabase.from('users').insert([userData]).select();
  if (error) throw error;
  return data;
};

export const updateUser = async (id: string, userData: any) => {
  const { data, error } = await supabase.from('users').update(userData).eq('id', id).select();
  if (error) throw error;
  return data;
};

export const deleteUser = async (id: string) => {
  const { error } = await supabase.from('users').delete().eq('id', id);
  if (error) throw error;
  return true;
};

// Game presence management
export const getPresences = async (gameDate: string) => {
  const { data, error } = await supabase
    .from('presencas')
    .select('*, users(*)')
    .eq('data_jogo', gameDate);
  if (error) throw error;
  return data;
};

export const confirmPresence = async (userId: string, gameDate: string, status: string) => {
  // Check if presence already exists
  const { data: existingPresence } = await supabase
    .from('presencas')
    .select('*')
    .eq('user_id', userId)
    .eq('data_jogo', gameDate)
    .single();

  if (existingPresence) {
    const { data, error } = await supabase
      .from('presencas')
      .update({ status })
      .eq('id', existingPresence.id)
      .select();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('presencas')
      .insert([{ user_id: userId, data_jogo: gameDate, status }])
      .select();
    if (error) throw error;
    return data;
  }
};

// Games management
export const getGames = async () => {
  const { data, error } = await supabase.from('jogos').select('*');
  if (error) throw error;
  return data;
};

export const getGameById = async (id: string) => {
  const { data, error } = await supabase.from('jogos').select('*').eq('id', id).single();
  if (error) throw error;
  return data;
};

export const createGame = async (gameData: any) => {
  const { data, error } = await supabase.from('jogos').insert([gameData]).select();
  if (error) throw error;
  return data;
};

export const updateGame = async (id: string, gameData: any) => {
  const { data, error } = await supabase.from('jogos').update(gameData).eq('id', id).select();
  if (error) throw error;
  return data;
};

// Statistics management
export const getStatistics = async (gameId: string) => {
  const { data, error } = await supabase
    .from('estatisticas')
    .select('*, users(*)')
    .eq('jogo_id', gameId);
  if (error) throw error;
  return data;
};

export const addStatistic = async (statisticData: any) => {
  const { data, error } = await supabase.from('estatisticas').insert([statisticData]).select();
  if (error) throw error;
  return data;
};

export const updateStatistic = async (id: string, statisticData: any) => {
  const { data, error } = await supabase
    .from('estatisticas')
    .update(statisticData)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
};

// Scoring rules management
export const getScoringRules = async () => {
  const { data, error } = await supabase.from('regras_pontuacao').select('*');
  if (error) throw error;
  return data;
};

export const updateScoringRule = async (id: string, ruleData: any) => {
  const { data, error } = await supabase
    .from('regras_pontuacao')
    .update(ruleData)
    .eq('id', id)
    .select();
  if (error) throw error;
  return data;
};