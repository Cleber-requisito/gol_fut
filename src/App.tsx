import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';

// Layouts
import AuthLayout from '@/components/layouts/AuthLayout';
import DashboardLayout from '@/components/layouts/DashboardLayout';

// Pages
import LoginPage from '@/pages/auth/LoginPage';
import RegisterPage from '@/pages/auth/RegisterPage';
import DashboardPage from '@/pages/dashboard/DashboardPage';
import ProfilePage from '@/pages/profile/ProfilePage';
import PlayersPage from '@/pages/players/PlayersPage';
import PlayerFormPage from '@/pages/players/PlayerFormPage';
import GamesPage from '@/pages/games/GamesPage';
import GameDetailsPage from '@/pages/games/GameDetailsPage';
import RankingsPage from '@/pages/rankings/RankingsPage';
import SettingsPage from '@/pages/settings/SettingsPage';
import NotFoundPage from '@/pages/NotFoundPage';

// Auth guard component
const ProtectedRoute = ({ 
  children, 
  adminOnly = false 
}: { 
  children: React.ReactNode;
  adminOnly?: boolean;
}) => {
  const { user, isAdmin, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Carregando...</div>;
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard\" replace />;
  }

  return <>{children}</>;
};

function App() {
  const { user } = useAuth();
  const location = useLocation();

  // Update the document title based on the current route
  useEffect(() => {
    const pageTitle = getPageTitle(location.pathname);
    document.title = `${pageTitle} | Gol_Fut`;
  }, [location]);

  return (
    <Routes>
      {/* Auth routes */}
      <Route element={<AuthLayout />}>
        <Route 
          path="/login" 
          element={!user ? <LoginPage /> : <Navigate to="/dashboard\" replace />} 
        />
        <Route 
          path="/register" 
          element={!user ? <RegisterPage /> : <Navigate to="/dashboard\" replace />} 
        />
      </Route>

      {/* Protected routes */}
      <Route element={<DashboardLayout />}>
        <Route path="/" element={<Navigate to="/dashboard\" replace />} />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/players" 
          element={
            <ProtectedRoute adminOnly>
              <PlayersPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/players/new" 
          element={
            <ProtectedRoute adminOnly>
              <PlayerFormPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/players/:id" 
          element={
            <ProtectedRoute adminOnly>
              <PlayerFormPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/games" 
          element={
            <ProtectedRoute>
              <GamesPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/games/:id" 
          element={
            <ProtectedRoute>
              <GameDetailsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/rankings" 
          element={
            <ProtectedRoute>
              <RankingsPage />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute adminOnly>
              <SettingsPage />
            </ProtectedRoute>
          } 
        />
      </Route>

      {/* Not found route */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// Helper function to get page title based on path
function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/': 'Início',
    '/dashboard': 'Painel',
    '/login': 'Login',
    '/register': 'Cadastro',
    '/profile': 'Perfil',
    '/players': 'Jogadores',
    '/players/new': 'Novo Jogador',
    '/games': 'Jogos',
    '/rankings': 'Classificação',
    '/settings': 'Configurações',
  };

  // Check if the path matches a dynamic route pattern
  if (pathname.match(/^\/players\/[^/]+$/)) {
    return 'Editar Jogador';
  }
  
  if (pathname.match(/^\/games\/[^/]+$/)) {
    return 'Detalhes do Jogo';
  }

  return titles[pathname] || 'Página não encontrada';
}

export default App;