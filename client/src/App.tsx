import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { theme } from './utils/theme';
import Layout from './components/Layout/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Boletos from './pages/Boletos';
import BoletoView from './pages/BoletoView';
import Pix from './pages/Pix';
import Notifications from './pages/Notifications';
import Orcamentos from './pages/Orcamentos';
import Relatorios from './pages/Relatorios';
import 'dayjs/locale/pt-br';
import Perfil from './pages/Perfil';

// Criar instância do QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Componente para rotas protegidas
interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user?.tipo !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

// Componente para rota pública (login)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div>Carregando...</div>;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Componente principal da aplicação
const AppContent: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Rota pública */}
        <Route 
          path="/login" 
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } 
        />
        
        {/* Rotas protegidas */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de usuários - apenas admin */}
        <Route 
          path="/usuarios" 
          element={
            <ProtectedRoute adminOnly>
              <Users />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/usuarios/novo" 
          element={
            <ProtectedRoute adminOnly>
              <div>Novo Usuário (Em desenvolvimento)</div>
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de boletos */}
        <Route 
          path="/boletos" 
          element={
            <ProtectedRoute>
              <Boletos />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/boletos/:id" 
          element={
            <ProtectedRoute>
              <BoletoView />
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/boletos/novo" 
          element={
            <ProtectedRoute adminOnly>
              <Boletos />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de PIX */}
        <Route 
          path="/pix" 
          element={
            <ProtectedRoute>
              <Pix />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de notificações */}
        <Route 
          path="/notificacoes" 
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de orçamentos */}
        <Route 
          path="/orcamentos" 
          element={
            <ProtectedRoute>
              <Orcamentos />
            </ProtectedRoute>
          } 
        />
        
        {/* Rotas de relatórios - apenas admin */}
        <Route 
          path="/relatorios" 
          element={
            <ProtectedRoute adminOnly>
              <Relatorios />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota de perfil */}
        <Route 
          path="/perfil" 
          element={
            <ProtectedRoute>
              <Perfil defaultTab="perfil" />
            </ProtectedRoute>
          } 
        />
        
        {/* Rota de configurações */}
        <Route 
          path="/configuracoes" 
          element={
            <ProtectedRoute>
              <Perfil defaultTab="config" />
            </ProtectedRoute>
          } 
        />
        
        {/* Redirecionamento padrão */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* Rota 404 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

// Componente App principal
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="pt-br">
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthProvider>
            <AppContent />
          </AuthProvider>
        </ThemeProvider>
      </LocalizationProvider>
    </QueryClientProvider>
  );
};

export default App;
