import { useState, useEffect } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { supabase } from '@/config/supabase';
import { updateScoringRule, getScoringRules } from '@/config/supabase';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Trophy, Award, Users, Star } from 'lucide-react';

const formSchema = z.object({
  gol: z.coerce.number().min(0, { message: 'O valor deve ser um número não negativo' }),
  assistencia: z.coerce.number().min(0, { message: 'O valor deve ser um número não negativo' }),
  vitoria: z.coerce.number().min(0, { message: 'O valor deve ser um número não negativo' }),
  participacao: z.coerce.number().min(0, { message: 'O valor deve ser um número não negativo' }),
});

type FormValues = z.infer<typeof formSchema>;

const SettingsPage = () => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [scoringRules, setScoringRules] = useState<any[]>([]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      gol: 0,
      assistencia: 0,
      vitoria: 0,
      participacao: 0,
    },
  });

  useEffect(() => {
    fetchScoringRules();
  }, []);

  const fetchScoringRules = async () => {
    setIsLoading(true);
    try {
      const data = await getScoringRules();
      setScoringRules(data || []);
      
      // Map rules to form values
      const formValues: Partial<FormValues> = {};
      data?.forEach((rule) => {
        if (rule.tipo === 'gol') formValues.gol = rule.valor;
        if (rule.tipo === 'assistencia') formValues.assistencia = rule.valor;
        if (rule.tipo === 'vitoria') formValues.vitoria = rule.valor;
        if (rule.tipo === 'participacao') formValues.participacao = rule.valor;
      });
      
      form.reset(formValues as FormValues);
    } catch (error) {
      console.error('Error fetching scoring rules:', error);
      toast({
        title: 'Erro ao carregar regras de pontuação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    try {
      // Update each scoring rule
      for (const rule of scoringRules) {
        let newValue = 0;
        
        if (rule.tipo === 'gol') newValue = values.gol;
        if (rule.tipo === 'assistencia') newValue = values.assistencia;
        if (rule.tipo === 'vitoria') newValue = values.vitoria;
        if (rule.tipo === 'participacao') newValue = values.participacao;
        
        await updateScoringRule(rule.id, { valor: newValue });
      }
      
      toast({
        title: 'Configurações salvas',
        description: 'As regras de pontuação foram atualizadas com sucesso.',
      });
      
      // Refresh rules
      fetchScoringRules();
    } catch (error) {
      console.error('Error saving scoring rules:', error);
      toast({
        title: 'Erro ao salvar regras de pontuação',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Initialize rules if they don't exist
  const initializeScoringRules = async () => {
    try {
      const { data, error } = await supabase.from('regras_pontuacao').select('*');
      
      if (error) throw error;
      
      if (data.length === 0) {
        // Create default scoring rules
        const defaultRules = [
          { tipo: 'gol', valor: 3 },
          { tipo: 'assistencia', valor: 1 },
          { tipo: 'vitoria', valor: 2 },
          { tipo: 'participacao', valor: 1 },
        ];
        
        for (const rule of defaultRules) {
          await supabase.from('regras_pontuacao').insert([rule]);
        }
        
        toast({
          title: 'Regras inicializadas',
          description: 'As regras de pontuação padrão foram criadas.',
        });
        
        fetchScoringRules();
      }
    } catch (error) {
      console.error('Error initializing scoring rules:', error);
      toast({
        title: 'Erro ao inicializar regras',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Regras de Pontuação</CardTitle>
          <CardDescription>
            Configure os valores dos pontos para cada tipo de estatística.
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {isLoading ? (
                <div className="py-4 flex justify-center">
                  <p>Carregando configurações...</p>
                </div>
              ) : scoringRules.length > 0 ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="gol"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Trophy className="h-5 w-5 text-amber-500" />
                          <FormLabel>Pontos por gol</FormLabel>
                        </div>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="assistencia"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Award className="h-5 w-5 text-blue-500" />
                          <FormLabel>Pontos por assistência</FormLabel>
                        </div>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="vitoria"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Star className="h-5 w-5 text-emerald-500" />
                          <FormLabel>Pontos por vitória</FormLabel>
                        </div>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="participacao"
                    render={({ field }) => (
                      <FormItem className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Users className="h-5 w-5 text-purple-500" />
                          <FormLabel>Pontos por participação</FormLabel>
                        </div>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              ) : (
                <div className="py-4 text-center">
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    Nenhuma regra de pontuação encontrada. Clique abaixo para inicializar as regras.
                  </p>
                  <Button
                    onClick={initializeScoringRules}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    Inicializar regras
                  </Button>
                </div>
              )}
            </CardContent>
            {scoringRules.length > 0 && (
              <CardFooter>
                <Button 
                  type="submit" 
                  className="bg-emerald-600 hover:bg-emerald-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Salvando...' : 'Salvar configurações'}
                </Button>
              </CardFooter>
            )}
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default SettingsPage;