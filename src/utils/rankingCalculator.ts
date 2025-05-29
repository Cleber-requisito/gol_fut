import { Statistic, ScoringRule, PlayerRanking } from '@/types';

export const calculatePlayerRankings = (
  statistics: Statistic[],
  scoringRules: ScoringRule[],
  playerData: any[]
): PlayerRanking[] => {
  // Create a map of scoring rule values
  const ruleValues: Record<string, number> = {};
  scoringRules.forEach(rule => {
    ruleValues[rule.tipo] = rule.valor;
  });

  // Group statistics by player
  const playerStats: Record<string, { 
    gols: number; 
    assistencias: number; 
    vitorias: number; 
    participacoes: number;
  }> = {};

  // Initialize stats for each player
  playerData.forEach(player => {
    playerStats[player.id] = {
      gols: 0,
      assistencias: 0,
      vitorias: 0,
      participacoes: 0
    };
  });

  // Accumulate statistics
  statistics.forEach(stat => {
    if (!playerStats[stat.user_id]) return;
    
    switch (stat.tipo) {
      case 'gol':
        playerStats[stat.user_id].gols += stat.quantidade;
        break;
      case 'assistencia':
        playerStats[stat.user_id].assistencias += stat.quantidade;
        break;
      case 'vitoria':
        playerStats[stat.user_id].vitorias += stat.quantidade;
        break;
      case 'participacao':
        playerStats[stat.user_id].participacoes += stat.quantidade;
        break;
    }
  });

  // Calculate total points and create ranking objects
  const rankings: PlayerRanking[] = playerData.map(player => {
    const stats = playerStats[player.id];
    const totalPoints = 
      (stats.gols * (ruleValues['gol'] || 0)) +
      (stats.assistencias * (ruleValues['assistencia'] || 0)) +
      (stats.vitorias * (ruleValues['vitoria'] || 0)) +
      (stats.participacoes * (ruleValues['participacao'] || 0));

    return {
      id: player.id,
      nome: player.nome,
      pontos: totalPoints,
      gols: stats.gols,
      assistencias: stats.assistencias,
      vitorias: stats.vitorias,
      participacoes: stats.participacoes,
      foto_url: player.foto_url
    };
  });

  // Sort by total points (descending)
  return rankings.sort((a, b) => b.pontos - a.pontos);
};

export const filterStatisticsByDate = (
  statistics: Statistic[],
  startDate: Date,
  endDate: Date,
  games: any[]
): Statistic[] => {
  // Create a map of game dates
  const gameDates: Record<string, Date> = {};
  games.forEach(game => {
    gameDates[game.id] = new Date(game.data);
  });

  // Filter statistics by date range
  return statistics.filter(stat => {
    const gameDate = gameDates[stat.jogo_id];
    if (!gameDate) return false;
    
    return gameDate >= startDate && gameDate <= endDate;
  });
};