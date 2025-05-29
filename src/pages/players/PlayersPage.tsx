import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUsers, deleteUser } from '@/config/supabase';
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { UserProfile } from '@/types';
import { Pencil, Trash2, UserPlus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const PlayersPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [players, setPlayers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState('all');
  const [playerToDelete, setPlayerToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    setIsLoading(true);
    try {
      const data = await getUsers();
      setPlayers(data || []);
    } catch (error) {
      console.error('Error fetching players:', error);
      toast({
        title: 'Erro ao carregar jogadores',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (id: string) => {
    navigate(`/players/${id}`);
  };

  const handleDelete = async () => {
    if (!playerToDelete) return;

    try {
      await deleteUser(playerToDelete);
      setPlayers(players.filter(player => player.id !== playerToDelete));
      toast({
        title: 'Jogador excluído',
        description: 'O jogador foi excluído com sucesso.',
      });
    } catch (error) {
      console.error('Error deleting player:', error);
      toast({
        title: 'Erro ao excluir jogador',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setPlayerToDelete(null);
    }
  };

  const filteredPlayers = players.filter(player => {
    const matchesSearch = player.nome.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPosition = positionFilter === 'all' || player.posicao === positionFilter;
    return matchesSearch && matchesPosition;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Jogadores</h1>
        <Button
          onClick={() => navigate('/players/new')}
          className="mt-4 sm:mt-0 bg-emerald-600 hover:bg-emerald-700"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Adicionar jogador
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Lista de jogadores</CardTitle>
          <CardDescription>
            Gerencie todos os jogadores cadastrados no sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500 dark:text-gray-400" />
              <Input
                placeholder="Buscar jogador..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-64">
              <Select
                value={positionFilter}
                onValueChange={setPositionFilter}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Filtrar por posição" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as posições</SelectItem>
                  <SelectItem value="Goleiro">Goleiro</SelectItem>
                  <SelectItem value="Zagueiro">Zagueiro</SelectItem>
                  <SelectItem value="Lateral">Lateral</SelectItem>
                  <SelectItem value="Meio-campo">Meio-campo</SelectItem>
                  <SelectItem value="Atacante">Atacante</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="py-8 flex justify-center">
              <p>Carregando jogadores...</p>
            </div>
          ) : filteredPlayers.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jogador</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Nota</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPlayers.map((player) => (
                    <TableRow key={player.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center">
                          <Avatar className="h-8 w-8 mr-2">
                            <AvatarImage src={player.foto_url} alt={player.nome} />
                            <AvatarFallback>{player.nome.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{player.nome}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">{player.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{player.posicao}</TableCell>
                      <TableCell>{player.nota}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.ativo
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                          }`}
                        >
                          {player.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            player.perfil === 'admin'
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                          }`}
                        >
                          {player.perfil === 'admin' ? 'Administrador' : 'Jogador'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(player.id)}
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Editar</span>
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-red-600 hover:text-red-700 dark:text-red-500 dark:hover:text-red-400"
                                onClick={() => setPlayerToDelete(player.id)}
                              >
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Excluir</span>
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir jogador</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Esta ação não pode ser desfeita. Isso excluirá permanentemente o jogador
                                  "{player.nome}" e removerá seus dados do sistema.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={handleDelete}
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                Nenhum jogador encontrado. Tente ajustar os filtros ou adicione um novo jogador.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PlayersPage;