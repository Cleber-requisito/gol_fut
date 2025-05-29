import { UserProfile } from '@/types';

// Team generation algorithm
export const generateTeams = (confirmedPlayers: UserProfile[]) => {
  // Filter players by position
  const goalkeepers = confirmedPlayers.filter(player => player.posicao === 'Goleiro');
  const defenders = confirmedPlayers.filter(player => 
    player.posicao === 'Zagueiro' || player.posicao === 'Lateral');
  const midfielders = confirmedPlayers.filter(player => player.posicao === 'Meio-campo');
  const forwards = confirmedPlayers.filter(player => player.posicao === 'Atacante');
  
  // Shuffle each position group
  const shuffledGoalkeepers = shuffle([...goalkeepers]);
  const shuffledDefenders = shuffle([...defenders]);
  const shuffledMidfielders = shuffle([...midfielders]);
  const shuffledForwards = shuffle([...forwards]);
  
  // Create three balanced teams based on positions and skill ratings
  const teams: UserProfile[][] = [[], [], []];
  const teamRatings = [0, 0, 0];
  
  // Distribute goalkeepers (one per team)
  for (let i = 0; i < shuffledGoalkeepers.length && i < 3; i++) {
    teams[i].push(shuffledGoalkeepers[i]);
    teamRatings[i] += shuffledGoalkeepers[i].nota;
  }
  
  // Helper function to find the team with the lowest rating
  const getLowestRatedTeamIndex = () => {
    return teamRatings.indexOf(Math.min(...teamRatings));
  };
  
  // Distribute defenders
  shuffledDefenders.forEach(player => {
    const teamIndex = getLowestRatedTeamIndex();
    teams[teamIndex].push(player);
    teamRatings[teamIndex] += player.nota;
  });
  
  // Distribute midfielders
  shuffledMidfielders.forEach(player => {
    const teamIndex = getLowestRatedTeamIndex();
    teams[teamIndex].push(player);
    teamRatings[teamIndex] += player.nota;
  });
  
  // Distribute forwards
  shuffledForwards.forEach(player => {
    const teamIndex = getLowestRatedTeamIndex();
    teams[teamIndex].push(player);
    teamRatings[teamIndex] += player.nota;
  });
  
  // Format the result for the database
  return {
    time1: teams[0].map(player => player.id),
    time2: teams[1].map(player => player.id),
    time3: teams[2].map(player => player.id),
  };
};

// Helper function to shuffle an array (Fisher-Yates algorithm)
function shuffle<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}