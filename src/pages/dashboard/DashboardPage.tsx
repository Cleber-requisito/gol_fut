import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/config/supabase';
import { confirmPresence } from '@/config/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Users, Trophy } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const DashboardPage = () => {
  const { user, profile, isAdmin } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [nextGameDate, setNextGameDate] = useState<string | null>(null);
  const [presenceStatus, setPresenceStatus] = useState<string | null>(null);
  const [confirmedCount, setConfirmedCount] = useState({ players: 0, goalkeepers: 0 });
  const [recentGames, setRecentGames] = useState<any[]>([]);
  const [personalStats, setPersonalStats] = useState({
    gols: 0,
    assistencias: 0,
    vitorias: 0,
    participacoes: 0,
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Fetch next game date
    const fetchNextGame = async () => {
      const today = new Date();
      const { data, error } = await supabase
        .from('jogos')
        .select('*')
        .gte('data', today.toISOString().split('T')[0])
        .order('data', { ascending: true })
        .limit(1);

      if (error) {
        console.error('Error fetching next game:', error);
        return;
      }

      if (data && data.length > 0) {
        setNextGameDate(data[0].data);
        fetchPresenceStatus(data[0].data);
        countConfirmedPlayers(data[0].data);
      } else {
        // If no future game exists, create one for next weekend
        const nextSaturday = new Date();
        nextSaturday.setDate(today.getDate() + (6 - today.getDay() + 7) % 7);
        nextSaturday.setHours(0, 0, 0, 0);
        
        if (isAdmin) {
          const { data: newGame, error: createError } = await supabase
            .from('jogos')
            .insert([
              {
                data: nextSaturday.toISOString().split('T')[0],
                status: 'pendente',
                times: {},
              },
            ])
            .select();

          if (createError) {
            console.error('Error creating next game:', createError);
            return;
          }

          if (newGame && newGame.length > 0) {
            setNextGameDate(newGame[0].data);
          }
        }
      }
    };

    // Fetch user's presence status for the next game
    const fetchPresenceStatus = async (gameDate: string) => {
      if (!user) return;

      const { data, error } = await supabase
        .from('presencas')
        .select('status')
        .eq('user_id', profile?.id)
        .eq('data_jogo', gameDate)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error fetching presence status:', error);
        return;
      }

      setPresenceStatus(data?.status || null);
    };

    // Count confirmed players for the next game
    const countConfirmedPlayers = async (gameDate: string) => {
      const { data, error } = await supabase
        .from('presencas')
        .select('*, users(posicao)')
        .eq('data_jogo', gameDate)
        .eq('status', 'confirmado');

      if (error) {
        console.error('Error counting confirmed players:', error);
        return;
      }

      const players = data.filter(p => p.users.posicao !== 'Goleiro').length;
      const goalkeepers = data.filter(p => p.users.posicao === 'Goleiro').length;

      setConfirmedCount({
        players,
        goalkeepers,
      });
    };

    // Fetch recent games
    const fetchRecentGames = async () => {
      const { data, error } = await supabase
        .from('jogos')
        .select('*')
        .order('data', { ascending: false })
        .limit(5);

      if (error) {
        console.error('Error fetching recent games:', error);
        return;
      }

      setRecentGames(data || []);
    };

    // Fetch personal statistics
    const fetchPersonalStats = async () => {
      if (!profile?.id) return;

      const { data, error } = await supabase
        .from('estatisticas')
        .select('tipo, quantidade')
        .eq('user_id', profile.id);

      if (error) {
        console.error('Error fetching personal stats:', error);
        return;
      }

      const stats = {
        gols: 0,
        assistencias: 0,
        vitorias: 0,
        participacoes: 0,
      };

      data.forEach(stat => {
        switch (stat.tipo) {
          case 'gol':
            stats.gols += stat.quantidade;
            break;
          case 'assistencia':
            stats.assistencias += stat.quantidade;
            break;
          case 'vitoria':
            stats.vitorias += stat.quantidade;
            break;
          case 'participacao':
            stats.participacoes += stat.quantidade;
            break;
        }
      });

      setPersonalStats(stats);
    };

    fetchNextGame();
    fetchRecentGames();
    if (profile?.id) {
      fetchPersonalStats();
    }
  }, [user, profile, isAdmin]);

  const handleConfirmPresence = async () => {
    if (!user || !nextGameDate || !profile?.id) return;

    setIsLoading(true);
    try {
      await confirmPresence(profile.id, nextGameDate, 'confirmado');
      setPresenceStatus('confirmado');
      
      // Update confirmed count
      setConfirmedCount(prev => ({
        players: profile.posicao !== 'Goleiro' ? prev.players + 1 : prev.players,
        goalkeepers: profile.posicao === 'Goleiro' ? prev.goalkeepers + 1 : prev.goalkeepers,
      }));

      toast({
        title: 'Presença confirmada!',
        description: 'Você está confirmado para o próximo jogo.',
      });
    } catch (error) {
      console.error('Error confirming presence:', error);
      toast({
        title: 'Erro ao confirmar presença',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelPresence = async () => {
    if (!user || !nextGameDate || !profile?.id) return;

    setIsLoading(true);
    try {
      await confirmPresence(profile.id, nextGameDate, 'desistente');
      setPresenceStatus('desistente');
      
      // Update confirmed count
      setConfirmedCount(prev => ({
        players: profile.posicao !== 'Goleiro' ? prev.players - 1 : prev.players,
        goalkeepers: profile.posicao === 'Goleiro' ? prev.goalkeepers - 1 : prev.goalkeepers,
      }));

      toast({
        title: 'Presença cancelada',
        description: 'Você não está mais confirmado para o próximo jogo.',
      });
    } catch (error) {
      console.error('Error canceling presence:', error);
      toast({
        title: 'Erro ao cancelar presença',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, dd 'de' MMMM", { locale: ptBR });
  };

  const getPresenceStatusText = () => {
    if (!presenceStatus) return 'Não confirmado';
    
    switch (presenceStatus) {
      case 'confirmado':
        return 'Confirmado';
      case 'fila':
        return 'Na fila de espera';
      case 'desistente':
        return 'Desistiu';
      default:
        return 'Não confirmado';
    }
  };

  const getPresenceStatusColor = () => {
    if (!presenceStatus) return 'text-gray-500';
    
    switch (presenceStatus) {
      case 'confirmado':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'fila':
        return 'text-amber-600 dark:text-amber-400';
      case 'desistente':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-gray-500';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Painel</h1>
        {isAdmin && (
          <div className="mt-4 md:mt-0">
            <Button
              onClick={() => navigate('/games')}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              Gerenciar Jogos
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Gols</CardTitle>
            <Trophy className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalStats.gols}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assistências</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalStats.assistencias}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Vitórias</CardTitle>
            <Trophy className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalStats.vitorias}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participações</CardTitle>
            <Calendar className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{personalStats.participacoes}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="next-game" className="space-y-4">
        <TabsList>
          <TabsTrigger value="next-game">Próximo Jogo</TabsTrigger>
          <TabsTrigger value="recent-games">Jogos Recentes</TabsTrigger>
        </TabsList>
        
        <TabsContent value="next-game" className="space-y-4">
          {nextGameDate ? (
            <Card>
              <CardHeader>
                <CardTitle>Próximo Jogo</CardTitle>
                <CardDescription>
                  {formatGameDate(nextGameDate)}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Jogadores confirmados
                    </p>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xl font-bold">
                        {confirmedCount.players}/18
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      Goleiros confirmados
                    </p>
                    <div className="flex items-center">
                      <Users className="h-5 w-5 mr-2 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-xl font-bold">
                        {confirmedCount.goalkeepers}/3
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium mb-2">Seu status:</p>
                  <div className="flex items-center justify-between">
                    <p className={`text-lg font-semibold ${getPresenceStatusColor()}`}>
                      {getPresenceStatusText()}
                    </p>
                    
                    <div className="space-x-2">
                      {presenceStatus !== 'confirmado' && (
                        <Button
                          onClick={handleConfirmPresence}
                          disabled={isLoading}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          {isLoading ? 'Confirmando...' : 'Confirmar presença'}
                        </Button>
                      )}
                      {presenceStatus === 'confirmado' && (
                        <Button
                          onClick={handleCancelPresence}
                          disabled={isLoading}
                          variant="outline"
                        >
                          {isLoading ? 'Cancelando...' : 'Cancelar presença'}
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Próximo Jogo</CardTitle>
                <CardDescription>
                  Nenhum jogo agendado no momento
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAdmin && (
                  <Button
                    onClick={() => navigate('/games')}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Agendar jogo
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="recent-games" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Jogos Recentes</CardTitle>
              <CardDescription>
                Últimos 5 jogos realizados
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentGames.length > 0 ? (
                <div className="space-y-4">
                  {recentGames.map((game) => (
                    <div
                      key={game.id}
                      className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-md"
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatGameDate(game.data)}
                        </span>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          Status: {game.status === 'finalizado' ? 'Finalizado' : 'Pendente'}
                        </span>
                      </div>
                      <Button
                        variant="ghost"
                        onClick={() => navigate(`/games/${game.id}`)}
                      >
                        Ver detalhes
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">
                  Nenhum jogo realizado recentemente.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;