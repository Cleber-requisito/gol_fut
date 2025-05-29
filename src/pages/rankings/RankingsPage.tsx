import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, subMonths, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getUsers, getGames } from '@/config/supabase';
import { calculatePlayerRankings, filterStatisticsByDate } from '@/utils/rankingCalculator';
import { supabase } from '@/config/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trophy, ArrowUp, ArrowDown, Medal } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlayerRanking, ScoringRule } from '@/types';

const RankingsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [players, setPlayers] = useState<any[]>([]);
  const [games, setGames] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any[]>([]);
  const [scoringRules, setScoringRules] = useState<ScoringRule[]>([]);
  
  const [monthlyRankings, setMonthlyRankings] = useState<PlayerRanking[]>([]);
  const [yearlyRankings, setYearlyRankings] = useState<PlayerRanking[]>([]);
  const [allTimeRankings, setAllTimeRankings] = useState<PlayerRanking[]>([]);
  
  const [selectedMonth, setSelectedMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());

  const months = Array(12)
    .fill(0)
    .map((_, i) => {
      const date = subMonths(new Date(), i);
      return {
        value: format(date, 'yyyy-MM'),
        label: format(date, 'MMMM yyyy', { locale: ptBR }),
      };
    });

  const years = Array(5)
    .fill(0)
    .map((_, i) => {
      const year = new Date().getFullYear() - i;
      return {
        value: year.toString(),
        label: year.toString(),
      };
    });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (players.length > 0 && statistics.length > 0 && scoringRules.length > 0 && games.length > 0) {
      calculateRankings();
    }
  }, [players, statistics, scoringRules, games, selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all required data
      const [playersData, gamesData, statisticsData, rulesData] = await Promise.all([
        getUsers(),
        getGames(),
        fetchAllStatistics(),
        fetchScoringRules(),
      ]);

      setPlayers(playersData || []);
      setGames(gamesData || []);
      setStatistics(statisticsData || []);
      setScoringRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Erro ao carregar dados',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAllStatistics = async () => {
    const { data, error } = await supabase.from('estatisticas').select('*');
    if (error) throw error;
    return data;
  };

  const fetchScoringRules = async () => {
    const { data, error } = await supabase.from('regras_pontuacao').select('*');
    if (error) throw error;
    return data;
  };

  const calculateRankings = () => {
    // Calculate monthly rankings
    const monthDate = new Date(selectedMonth);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const monthlyStats = filterStatisticsByDate(statistics, monthStart, monthEnd, games);
    const monthlyRanks = calculatePlayerRankings(monthlyStats, scoringRules, players);
    setMonthlyRankings(monthlyRanks);

    // Calculate yearly rankings
    const yearStart = startOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearEnd = endOfYear(new Date(parseInt(selectedYear), 0, 1));
    const yearlyStats = filterStatisticsByDate(statistics, yearStart, yearEnd, games);
    const yearlyRanks = calculatePlayerRankings(yearlyStats, scoringRules, players);
    setYearlyRankings(yearlyRanks);

    // Calculate all-time rankings
    const allTimeRanks = calculatePlayerRankings(statistics, scoringRules, players);
    setAllTimeRankings(allTimeRanks);
  };

  const getMedalColor = (position: number) => {
    switch (position) {
      case 0:
        return 'text-yellow-500';
      case 1:
        return 'text-gray-400';
      case 2:
        return 'text-amber-700';
      default:
        return 'text-gray-300';
    }
  };

  const renderRankingTable = (rankings: PlayerRanking[]) => {
    return (
      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Jogador</TableHead>
              <TableHead className="text-center">Pontos</TableHead>
              <TableHead className="text-center">Gols</TableHead>
              <TableHead className="text-center">Assistências</TableHead>
              <TableHead className="text-center">Vitórias</TableHead>
              <TableHead className="text-center">Participações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rankings.map((player, index) => (
              <TableRow key={player.id}>
                <TableCell className="font-medium">
                  {index < 3 ? (
                    <Medal className={`h-5 w-5 ${getMedalColor(index)}`} />
                  ) : (
                    index + 1
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center">
                    <Avatar className="h-8 w-8 mr-2">
                      <AvatarImage src={player.foto_url} alt={player.nome} />
                      <AvatarFallback>{player.nome.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span>{player.nome}</span>
                  </div>
                </TableCell>
                <TableCell className="text-center font-bold">{player.pontos}</TableCell>
                <TableCell className="text-center">{player.gols}</TableCell>
                <TableCell className="text-center">{player.assistencias}</TableCell>
                <TableCell className="text-center">{player.vitorias}</TableCell>
                <TableCell className="text-center">{player.participacoes}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Classificação</h1>
      </div>

      <Tabs defaultValue="monthly" className="space-y-4">
        <TabsList className="grid grid-cols-3">
          <TabsTrigger value="monthly">Mensal</TabsTrigger>
          <TabsTrigger value="yearly">Anual</TabsTrigger>
          <TabsTrigger value="all-time">Geral</TabsTrigger>
        </TabsList>

        <TabsContent value="monthly">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Classificação Mensal</CardTitle>
                  <CardDescription>
                    Desempenho dos jogadores no mês selecionado.
                  </CardDescription>
                </div>
                <div className="mt-4 sm:mt-0 w-full sm:w-48">
                  <Select
                    value={selectedMonth}
                    onValueChange={setSelectedMonth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o mês" />
                    </SelectTrigger>
                    <SelectContent>
                      {months.map((month) => (
                        <SelectItem key={month.value} value={month.value}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <p>Carregando classificação...</p>
                </div>
              ) : monthlyRankings.length > 0 ? (
                renderRankingTable(monthlyRankings)
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum dado disponível para o mês selecionado.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="yearly">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <CardTitle>Classificação Anual</CardTitle>
                  <CardDescription>
                    Desempenho dos jogadores no ano selecionado.
                  </CardDescription>
                </div>
                <div className="mt-4 sm:mt-0 w-full sm:w-48">
                  <Select
                    value={selectedYear}
                    onValueChange={setSelectedYear}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ano" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.value} value={year.value}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <p>Carregando classificação...</p>
                </div>
              ) : yearlyRankings.length > 0 ? (
                renderRankingTable(yearlyRankings)
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum dado disponível para o ano selecionado.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all-time">
          <Card>
            <CardHeader>
              <CardTitle>Classificação Geral</CardTitle>
              <CardDescription>
                Desempenho dos jogadores desde o início.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="py-8 flex justify-center">
                  <p>Carregando classificação...</p>
                </div>
              ) : allTimeRankings.length > 0 ? (
                renderRankingTable(allTimeRankings)
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum dado disponível.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Card>
        <CardHeader>
          <CardTitle>Sistema de Pontuação</CardTitle>
          <CardDescription>
            Como os pontos são calculados para o ranking.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
            {scoringRules.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-4 border rounded-md bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center">
                  {rule.tipo === 'gol' && <Trophy className="h-5 w-5 mr-2 text-amber-500" />}
                  {rule.tipo === 'assistencia' && <ArrowUp className="h-5 w-5 mr-2 text-blue-500" />}
                  {rule.tipo === 'vitoria' && <Trophy className="h-5 w-5 mr-2 text-emerald-500" />}
                  {rule.tipo === 'participacao' && <ArrowDown className="h-5 w-5 mr-2 text-purple-500" />}
                  <div>
                    <p className="font-medium">
                      {rule.tipo === 'gol' && 'Gol'}
                      {rule.tipo === 'assistencia' && 'Assistência'}
                      {rule.tipo === 'vitoria' && 'Vitória'}
                      {rule.tipo === 'participacao' && 'Participação'}
                    </p>
                  </div>
                </div>
                <span className="text-xl font-bold">{rule.valor}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RankingsPage;