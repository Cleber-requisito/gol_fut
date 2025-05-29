import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-6">
        <Trophy size={32} />
      </div>
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 text-center">
        Página não encontrada
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-400 mb-8 text-center max-w-md">
        Desculpe, a página que você está procurando não existe ou foi removida.
      </p>
      <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
        <Link to="/dashboard">Voltar para o início</Link>
      </Button>
    </div>
  );
};

export default NotFoundPage;