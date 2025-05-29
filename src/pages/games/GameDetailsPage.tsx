import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  getGameById,
  updateGame,
  getPresences,
  getUsers,
  addStatistic,
  getUserById,
} from '@/config/supabase';
import { generateTeams } from '@/utils/teamGenerator';
import { useAuth } from '@/context/AuthContext';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ArrowLeft, RefreshCw, Trophy, Users, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { UserProfile, GamePresence } from '@/types';

const GameDetailsPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [game, setGame] = useState<any>(null);
  const [presences, setPresences] = useState<GamePresence[]>([]);
  const [allPlayers, setAllPlayers] = useState<UserProfile[]>([]);
  const [teams, setTeams] = useState<Record<string, UserProfile[]>>({
    time1: [],
    time2: [],
    time3: [],
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingTeams, setIsGeneratingTeams] = useState(false);
  const [isAddingStats, setIsAddingStats] = useState(false);
  const [isFinishingGame, setIsFinishingGame] = useState(false);
  const [statForm, setStatForm] = useState({
    playerIds: [] as string[],
    tipo: 'gol',
    winningTeam: 'time1',
  });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [winningTeamDialogOpen, setWinningTeamDialogOpen] = useState(false);

  useEffect(() => {
    if (id) {
      fetchGameData();
      fetchAllPlayers();
    }
  }, [id]);

  const fetchGameData = async () => {
    setIsLoading(true);
    try {
      if (!id) return;

      const gameData = await getGameById(id);
      setGame(gameData);
      
      if (gameData?.data) {
        const presenceData = await getPresences(gameData.data);
        setPresences(presenceData || []);
      }
      
      // If teams are already formed, fetch player details
      if (gameData?.times && Object.keys(gameData.times).length > 0) {
        await loadTeams(gameData.times);
      }
    } catch (error) {
      console.error('Error fetching game data:', error);
      toast({
        title: 'Erro ao carregar dados do jogo',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllPlayers = async () => {
    try {
      const data = await getUsers();
      setAllPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
    }
  };

  const loadTeams = async (teamData: Record<string, string[]>) => {
    const teamPlayers: Record<string, UserProfile[]> = {
      time1: [],
      time2: [],
      time3: [],
    };

    try {
      for (const teamKey of Object.keys(teamData)) {
        const playerIds = teamData[teamKey];
        if (!playerIds || !Array.isArray(playerIds)) continue;

        const players = await Promise.all(
          playerIds.map(async (playerId) => {
            try {
              return await getUserById(playerId);
            } catch {
              return null;
            }
          })
        );

        teamPlayers[teamKey] = players.filter(Boolean) as UserProfile[];
      }

      setTeams(teamPlayers);
    } catch (error) {
      console.error('Error loading team players:', error);
    }
  };

  const handleGenerateTeams = async () => {
    if (!id || !game) return;

    setIsGeneratingTeams(true);
    try {
      const confirmedPresences = presences.filter((p) => p.status === 'confirmado');
      
      if (confirmedPresences.length < 6) {
        toast({
          title: 'Jogadores insuficientes',
          description: 'É necessário pelo menos 6 jogadores confirmados para formar os times.',
          variant: 'destructive',
        });
        return;
      }

      // Get full player data for each confirmed presence
      const confirmedPlayers = await Promise.all(
        confirmedPresences.map(async (presence) => {
          try {
            return await getUserById(presence.user_id);
          } catch {
            return null;
          }
        })
      );

      const validPlayers = confirmedPlayers.filter(Boolean) as UserProfile[];
      
      if (validPlayers.length < 6) {
        toast({
          title: 'Jogadores insuficientes',
          description: 'É necessário pelo menos 6 jogadores confirmados para formar os times.',
          variant: 'destructive',
        });
        return;
      }

      // Generate balanced teams
      const teamData = generateTeams(validPlayers);
      
      // Update game with team information
      await updateGame(id, { times: teamData });
      
      // Load the teams with player details
      await loadTeams(teamData);
      
      toast({
        title: 'Times formados',
        description: 'Os times foram sorteados com sucesso.',
      });
      
      // Refresh game data
      fetchGameData();
    } catch (error) {
      console.error('Error generating teams:', error);
      toast({
        title: 'Erro ao formar times',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingTeams(false);
    }
  };

  const handleAddStatistic = async () => {
    if (!id || !game) return;
    
    setIsAddingStats(true);
    try {
      const { playerIds, tipo } = statForm;
      
      // Add statistics for each selected player
      for (const playerId of playerIds) {
        await addStatistic({
          jogo_id: id,
          user_id: playerId,
          tipo,
          quantidade: 1,
        });
      }
      
      setDialogOpen(false);
      setStatForm({
        playerIds: [],
        tipo: 'gol',
        winningTeam: 'time1',
      });
      
      toast({
        title: 'Estatísticas adicionadas',
        description: 'As estatísticas foram registradas com sucesso.',
      });
    } catch (error) {
      console.error('Error adding statistics:', error);
      toast({
        title: 'Erro ao adicionar estatísticas',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsAddingStats(false);
    }
  };

  const handleFinishGame = async () => {
    if (!id || !game) return;
    
    setIsFinishingGame(true);
    try {
      // Update game status to finished
      await updateGame(id, { status: 'finalizado' });
      
      // Add victory statistics for the winning team
      const winningTeamPlayers = teams[statForm.winningTeam];
      
      for (const player of winningTeamPlayers) {
        await addStatistic({
          jogo_id: id,
          user_id: player.id,
          tipo: 'vitoria',
          quantidade: 1,
        });
      }
      
      // Add participation statistics for all players in all teams
      const allTeamPlayers = [
        ...teams.time1,
        ...teams.time2,
        ...teams.time3,
      ];
      
      for (const player of allTeamPlayers) {
        await addStatistic({
          jogo_id: id,
          user_id: player.id,
          tipo: 'participacao',
          quantidade: 1,
        });
      }
      
      setWinningTeamDialogOpen(false);
      
      toast({
        title: 'Jogo finalizado',
        description: 'O jogo foi marcado como finalizado e as estatísticas foram registradas.',
      });
      
      // Refresh game data
      fetchGameData();
    } catch (error) {
      console.error('Error finishing game:', error);
      toast({
        title: 'Erro ao finalizar jogo',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsFinishingGame(false);
    }
  };

  const formatGameDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getPositionBadge = (position: string) => {
    const badgeClasses = {
      Goleiro: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      Zagueiro: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
      Lateral: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300',
      'Meio-campo': 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300',
      Atacante: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badgeClasses[position as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        {position}
      </span>
    );
  };

  const getStatusBadge = (status: string) => {
    const badgeClasses = {
      confirmado: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
      fila: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
      desistente: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    };

    const statusLabels = {
      confirmado: 'Confirmado',
      fila: 'Fila de espera',
      desistente: 'Desistiu',
    };

    return (
      <span
        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          badgeClasses[status as keyof typeof badgeClasses] || 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
        }`}
      >
        {statusLabels[status as keyof typeof statusLabels] || status}
      </span>
    );
  };

  const getTeamColor = (teamName: string) => {
    switch (teamName) {
      case 'time1':
        return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'time2':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'time3':
        return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300 border-amber-200 dark:border-amber-800';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700';
    }
  };

  const getTeamNameTranslated = (teamName: string) => {
    switch (teamName) {
      case 'time1':
        return 'Time Verde';
      case 'time2':
        return 'Time Azul';
      case 'time3':
        return 'Time Amarelo';
      default:
        return teamName;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/games')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Detalhes do Jogo</h1>
      </div>

      {isLoading ? (
        <div className="py-8 flex justify-center">
          <p>Carregando dados do jogo...</p>
        </div>
      ) : game ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Jogo de {formatGameDate(game.data)}</CardTitle>
              <CardDescription>
                Status: {game.status === 'finalizado' ? 'Finalizado' : 'Pendente'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {game.times && Object.keys(game.times).length > 0
                      ? 'Times já formados'
                      : 'Times ainda não formados'}
                  </p>
                </div>
                {isAdmin && game.status !== 'finalizado' && (
                  <div className="mt-4 sm:mt-0 flex space-x-2">
                    {game.times && Object.keys(game.times).length > 0 ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleGenerateTeams}
                          disabled={isGeneratingTeams}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          {isGeneratingTeams ? 'Reformando times...' : 'Refazer times'}
                        </Button>
                        <Button
                          onClick={() => setWinningTeamDialogOpen(true)}
                          className="bg-emerald-600 hover:bg-emerald-700"
                        >
                          <Trophy className="mr-2 h-4 w-4" />
                          Finalizar jogo
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleGenerateTeams}
                        disabled={isGeneratingTeams}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {isGeneratingTeams ? 'Formando times...' : 'Formar times'}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Tabs defaultValue={game.times && Object.keys(game.times).length > 0 ? 'teams' : 'presences'}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="presences">Lista de Presença</TabsTrigger>
              <TabsTrigger value="teams">Times</TabsTrigger>
            </TabsList>

            <TabsContent value="presences" className="space-y-4 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Lista de Presença</CardTitle>
                  <CardDescription>
                    Jogadores confirmados e na fila de espera.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {presences.length > 0 ? (
                    <div className="border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Jogador</TableHead>
                            <TableHead>Posição</TableHead>
                            <TableHead>Nota</TableHead>
                            <TableHead>Status</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {presences
                            .sort((a, b) => {
                              // Sort by status first (confirmado, fila, desistente)
                              const statusOrder = { confirmado: 0, fila: 1, desistente: 2 };
                              const statusA = statusOrder[a.status as keyof typeof statusOrder] || 3;
                              const statusB = statusOrder[b.status as keyof typeof statusOrder] || 3;
                              if (statusA !== statusB) return statusA - statusB;
                              
                              // Then sort by position (goleiro first, then others)
                              const isGoalkeeperA = a.users?.posicao === 'Goleiro';
                              const isGoalkeeperB = b.users?.posicao === 'Goleiro';
                              if (isGoalkeeperA !== isGoalkeeperB) return isGoalkeeperA ? -1 : 1;
                              
                              // Finally sort by name
                              return (a.users?.nome || '').localeCompare(b.users?.nome || '');
                            })
                            .map((presence) => (
                              <TableRow key={presence.id}>
                                <TableCell className="font-medium">
                                  <div className="flex items-center">
                                    <Avatar className="h-8 w-8 mr-2">
                                      <AvatarImage src={presence.users?.foto_url} alt={presence.users?.nome} />
                                      <AvatarFallback>{presence.users?.nome?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <span>{presence.users?.nome}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getPositionBadge(presence.users?.posicao || '')}</TableCell>
                                <TableCell>
                                  <div className="flex items-center">
                                    <Star className="h-4 w-4 text-amber-500 mr-1" />
                                    <span>{presence.users?.nota}</span>
                                  </div>
                                </TableCell>
                                <TableCell>{getStatusBadge(presence.status)}</TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                      </Table>
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum jogador confirmou presença para este jogo ainda.
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="teams" className="space-y-4 mt-6">
              {game.times && Object.keys(game.times).length > 0 ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {Object.keys(teams).map((teamKey) => (
                    <Card key={teamKey} className={`border-2 ${getTeamColor(teamKey)}`}>
                      <CardHeader className={getTeamColor(teamKey)}>
                        <CardTitle>{getTeamNameTranslated(teamKey)}</CardTitle>
                        <CardDescription className="text-gray-800 dark:text-gray-200">
                          {teams[teamKey].length} jogadores
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="pt-4">
                        <ul className="space-y-2">
                          {teams[teamKey].sort((a, b) => {
                            // Sort by position (goalkeepers first)
                            const isGoalkeeperA = a.posicao === 'Goleiro';
                            const isGoalkeeperB = b.posicao === 'Goleiro';
                            if (isGoalkeeperA !== isGoalkeeperB) return isGoalkeeperA ? -1 : 1;
                            return a.nome.localeCompare(b.nome);
                          }).map((player) => (
                            <li key={player.id} className="flex items-center justify-between p-2 border rounded-md">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8 mr-2">
                                  <AvatarImage src={player.foto_url} alt={player.nome} />
                                  <AvatarFallback>{player.nome.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <p className="font-medium">{player.nome}</p>
                                  <div className="flex items-center space-x-1 mt-1">
                                    {getPositionBadge(player.posicao)}
                                    <div className="flex items-center ml-2">
                                      <Star className="h-3 w-3 text-amber-500" />
                                      <span className="text-xs ml-0.5">{player.nota}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                      {isAdmin && game.status !== 'finalizado' && (
                        <CardFooter>
                          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                              <Button 
                                variant="outline" 
                                className="w-full"
                              >
                                Adicionar estatísticas
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Adicionar estatísticas</DialogTitle>
                                <DialogDescription>
                                  Selecione o tipo de estatística e os jogadores.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="py-4 space-y-4">
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Tipo de estatística
                                  </label>
                                  <Select
                                    value={statForm.tipo}
                                    onValueChange={(value) => setStatForm({ ...statForm, tipo: value })}
                                  >
                                    <SelectTrigger>
                                      <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="gol">Gol</SelectItem>
                                      <SelectItem value="assistencia">Assistência</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                  <label className="block text-sm font-medium mb-2">
                                    Selecione os jogadores
                                  </label>
                                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-md p-2">
                                    {teams[teamKey].map((player) => (
                                      <div key={player.id} className="flex items-center">
                                        <Input
                                          type="checkbox"
                                          id={`player-${player.id}`}
                                          className="mr-2 h-4 w-4"
                                          checked={statForm.playerIds.includes(player.id)}
                                          onChange={(e) => {
                                            if (e.target.checked) {
                                              setStatForm({
                                                ...statForm,
                                                playerIds: [...statForm.playerIds, player.id],
                                              });
                                            } else {
                                              setStatForm({
                                                ...statForm,
                                                playerIds: statForm.playerIds.filter(id => id !== player.id),
                                              });
                                            }
                                          }}
                                        />
                                        <label htmlFor={`player-${player.id}`} className="flex items-center">
                                          <Avatar className="h-6 w-6 mr-2">
                                            <AvatarImage src={player.foto_url} alt={player.nome} />
                                            <AvatarFallback>{player.nome.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                          <span>{player.nome}</span>
                                        </label>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <DialogFooter>
                                <Button
                                  variant="outline"
                                  onClick={() => setDialogOpen(false)}
                                >
                                  Cancelar
                                </Button>
                                <Button
                                  className="bg-emerald-600 hover:bg-emerald-700"
                                  disabled={isAddingStats || statForm.playerIds.length === 0}
                                  onClick={handleAddStatistic}
                                >
                                  {isAddingStats ? 'Adicionando...' : 'Adicionar'}
                                </Button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        </CardFooter>
                      )}
                    </Card>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Times não formados</CardTitle>
                    <CardDescription>
                      Os times ainda não foram sorteados para este jogo.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isAdmin && (
                      <Button
                        onClick={handleGenerateTeams}
                        disabled={isGeneratingTeams}
                        className="bg-emerald-600 hover:bg-emerald-700"
                      >
                        <Users className="mr-2 h-4 w-4" />
                        {isGeneratingTeams ? 'Formando times...' : 'Formar times'}
                      </Button>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>

          {/* Dialog for selecting winning team */}
          <Dialog open={winningTeamDialogOpen} onOpenChange={setWinningTeamDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Finalizar jogo</DialogTitle>
                <DialogDescription>
                  Selecione o time vencedor para finalizar o jogo e registrar as estatísticas.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label className="block text-sm font-medium mb-2">
                  Time vencedor
                </label>
                <Select
                  value={statForm.winningTeam}
                  onValueChange={(value) => setStatForm({ ...statForm, winningTeam: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time1">Time Verde</SelectItem>
                    <SelectItem value="time2">Time Azul</SelectItem>
                    <SelectItem value="time3">Time Amarelo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setWinningTeamDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isFinishingGame}
                  onClick={handleFinishGame}
                >
                  {isFinishingGame ? 'Finalizando...' : 'Finalizar jogo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Jogo não encontrado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-500 dark:text-gray-400">
              O jogo solicitado não foi encontrado. Verifique se o ID está correto.
            </p>
            <Button
              onClick={() => navigate('/games')}
              className="mt-4"
            >
              Voltar para a lista de jogos
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GameDetailsPage;