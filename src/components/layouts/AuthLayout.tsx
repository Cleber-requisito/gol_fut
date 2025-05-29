import { Outlet } from 'react-router-dom';
import { Trophy } from 'lucide-react';

const AuthLayout = () => {
  return (
    <div className="min-h-screen w-full flex">
      {/* Left side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          <div className="flex flex-col items-center">
            <div className="h-16 w-16 bg-emerald-500 text-white rounded-full flex items-center justify-center mb-4">
              <Trophy size={32} />
            </div>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              Gol_Fut
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Gerenciamento de jogos de futebol
            </p>
          </div>

          <Outlet />
        </div>
      </div>

      {/* Right side - Background image */}
      <div className="hidden lg:block w-1/2 relative">
        <img
          className="absolute inset-0 h-full w-full object-cover"
          src="https://images.pexels.com/photos/3148452/pexels-photo-3148452.jpeg"
          alt="Football field"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/40 to-blue-500/40 mix-blend-multiply" />
        <div className="absolute inset-0 flex flex-col justify-center items-center text-white p-8">
          <h1 className="text-4xl font-bold mb-4 text-center">
            Organize seus jogos de futebol com facilidade
          </h1>
          <p className="text-lg text-center max-w-md">
            Confirme presenças, forme times equilibrados e acompanhe estatísticas 
            de jogadores em uma plataforma completa.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;