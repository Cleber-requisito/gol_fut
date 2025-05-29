import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById, createUser, updateUser } from '@/config/supabase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const formSchema = z.object({
  nome: z.string().min(3, { message: 'Nome deve ter pelo menos 3 caracteres' }),
  email: z.string().email({ message: 'E-mail inválido' }),
  posicao: z.enum(['Goleiro', 'Zagueiro', 'Lateral', 'Meio-campo', 'Atacante']),
  nota: z.coerce.number().min(1).max(10),
  perfil: z.enum(['admin', 'jogador']),
  ativo: z.boolean(),
  foto_url: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const PlayerFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const isEditMode = !!id;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: '',
      email: '',
      posicao: 'Meio-campo',
      nota: 5,
      perfil: 'jogador',
      ativo: true,
      foto_url: '',
    },
  });

  useEffect(() => {
    if (isEditMode) {
      fetchPlayerData();
    }
  }, [id]);

  const fetchPlayerData = async () => {
    if (!id) return;

    setIsLoading(true);
    try {
      const playerData = await getUserById(id);
      if (playerData) {
        form.reset({
          nome: playerData.nome,
          email: playerData.email,
          posicao: playerData.posicao,
          nota: playerData.nota,
          perfil: playerData.perfil,
          ativo: playerData.ativo,
          foto_url: playerData.foto_url || '',
        });
      }
    } catch (error) {
      console.error('Error fetching player data:', error);
      toast({
        title: 'Erro ao carregar dados do jogador',
        description: 'Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    try {
      if (isEditMode && id) {
        await updateUser(id, values);
        toast({
          title: 'Jogador atualizado',
          description: 'Os dados do jogador foram atualizados com sucesso.',
        });
      } else {
        await createUser(values);
        toast({
          title: 'Jogador criado',
          description: 'O jogador foi criado com sucesso.',
        });
      }
      navigate('/players');
    } catch (error) {
      console.error('Error saving player:', error);
      toast({
        title: 'Erro ao salvar jogador',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/players')}
          className="mr-2"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="sr-only">Voltar</span>
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
          {isEditMode ? 'Editar Jogador' : 'Adicionar Jogador'}
        </h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Editar Jogador' : 'Novo Jogador'}</CardTitle>
          <CardDescription>
            {isEditMode
              ? 'Edite as informações do jogador existente.'
              : 'Preencha as informações para adicionar um novo jogador.'}
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nome"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome do jogador" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>E-mail</FormLabel>
                      <FormControl>
                        <Input placeholder="email@exemplo.com" type="email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="posicao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Posição</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a posição" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Goleiro">Goleiro</SelectItem>
                          <SelectItem value="Zagueiro">Zagueiro</SelectItem>
                          <SelectItem value="Lateral">Lateral</SelectItem>
                          <SelectItem value="Meio-campo">Meio-campo</SelectItem>
                          <SelectItem value="Atacante">Atacante</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="nota"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nota de habilidade (1-10)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="10" {...field} />
                      </FormControl>
                      <FormDescription>
                        Avalie a habilidade do jogador de 1 a 10.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="perfil"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tipo de perfil</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de perfil" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="jogador">Jogador</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Administradores podem gerenciar jogadores e jogos.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="foto_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>URL da foto</FormLabel>
                      <FormControl>
                        <Input placeholder="https://exemplo.com/foto.jpg" {...field} />
                      </FormControl>
                      <FormDescription>
                        Insira uma URL para a foto do jogador (opcional).
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ativo"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Jogador ativo</FormLabel>
                      <FormDescription>
                        Desmarque para desativar o jogador sem excluí-lo do sistema.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/players')}
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isLoading}
              >
                {isLoading
                  ? isEditMode
                    ? 'Salvando...'
                    : 'Criando...'
                  : isEditMode
                    ? 'Salvar alterações'
                    : 'Criar jogador'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default PlayerFormPage;