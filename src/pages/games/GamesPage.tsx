import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getGames, createGame } from '@/config/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Calendar, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';

const GamesPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [games, setGames] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [newGameDate, setNewGameDate] = useState('');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchGames();
  }, []);

  const fetchGames = async () => {
    setIsLoading(true);
    try {
      const data = await getGames();
      // Sort games by date, newest first
      const sortedGames = [...(data || [])].sort((a, b) => 
        new Date(b.data).getTime() - new Date(a.data).getTime()
      );
      setGames(sortedGames);
    } catch (error) {
      console.error('Error fetching games:', error);
      toast({
        title: 'Erro ao carregar jogos',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGame = async () => {
    if (!newGameDate) {
      toast({
        title: 'Data inválida',
        description: 'Por favor, selecione uma data para o jogo.',
        variant: 'destructive',
      });
      return;
    }

    setIsCreatingGame(true);
    try {
      const gameData = {
        data: newGameDate,
        status: 'pendente',
        times: {},
      };

      await createGame(gameData);
      setIsDialogOpen(false);
      setNewGameDate('');
      toast({
        title: 'Jogo criado',
        description: 'O jogo foi criado com sucesso.',
      });
      fetchGames();
    } catch (error) {
      console.error('Error creating game:', error);
      toast({
        title: 'Erro ao criar jogo',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsCreatingGame(false);
    }
  };

  const formatGameDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'finalizado') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
          Finalizado
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300">
        Pendente
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jogos</h1>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="mt-4 sm:mt-0 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="mr-2 h-4 w-4" />
                Novo jogo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Agendar novo jogo</DialogTitle>
                <DialogDescription>
                  Selecione a data para o próximo jogo.
                </DialogDescription>
              </DialogHeader>
              <div className="py-4">
                <label htmlFor="game-date" className="block text-sm font-medium mb-2">
                  Data do jogo
                </label>
                <Input
                  id="game-date"
                  type="date"
                  value={newGameDate}
                  onChange={(e) => setNewGameDate(e.target.value)}
                />
              </div>
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isCreatingGame || !newGameDate}
                  onClick={handleCreateGame}
                >
                  {isCreatingGame ? 'Criando...' : 'Criar jogo'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos os jogos</CardTitle>
          <CardDescription>
            Visualize todos os jogos agendados e seu histórico.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex justify-center">
              <p>Carregando jogos...</p>
            </div>
          ) : games.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Times</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {games.map((game) => (
                    <TableRow key={game.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500 dark:text-gray-400" />
                          <span>{formatGameDate(game.data)}</span>
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(game.status)}</TableCell>
                      <TableCell>
                        {game.times && Object.keys(game.times).length > 0 ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                            Times formados
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                            Aguardando sorteio
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/games/${game.id}`)}
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          Detalhes
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum jogo encontrado. Crie um novo jogo para começar.
              </p>
              {isAdmin && (
                <Button
                  className="mt-4 bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => setIsDialogOpen(true)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Criar jogo
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default GamesPage;