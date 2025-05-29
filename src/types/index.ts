export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  posicao: string;
  nota: number;
  perfil: 'admin' | 'jogador';
  ativo: boolean;
  foto_url?: string;
}

export interface GamePresence {
  id: string;
  user_id: string;
  data_jogo: string;
  status: 'confirmado' | 'fila' | 'desistente';
  users?: UserProfile;
}

export interface Game {
  id: string;
  data: string;
  times: {
    time1: Array<string>;
    time2: Array<string>;
    time3: Array<string>;
  };
  status: 'pendente' | 'finalizado';
}

export interface Statistic {
  id: string;
  jogo_id: string;
  user_id: string;
  tipo: 'gol' | 'assistencia' | 'vitoria' | 'participacao';
  quantidade: number;
  users?: UserProfile;
}

export interface ScoringRule {
  id: string;
  tipo: 'gol' | 'assistencia' | 'vitoria' | 'participacao';
  valor: number;
}

export interface PlayerRanking {
  id: string;
  nome: string;
  pontos: number;
  gols: number;
  assistencias: number;
  vitorias: number;
  participacoes: number;
  foto_url?: string;
}