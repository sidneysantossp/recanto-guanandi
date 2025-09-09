import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, AuthContextType } from '../types';
import { apiService } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        try {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));
          
          // Verificar se o token ainda é válido
          const response = await apiService.getMe();
          if (response.success && response.data) {
            setUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
          }
        } catch (error) {
          console.error('Token inválido:', error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setLoading(true);
      console.log(`[AUTH] Iniciando login para: ${credentials.email}`);
      
      const response = await apiService.login(credentials);
      console.log('[AUTH] Resposta da API:', response);
      
      if (response.success) {
        setToken(response.token);
        setUser(response.user);
        
        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log(`[AUTH] Login bem-sucedido para: ${response.user.nome} (${response.user.email})`);
      } else {
        console.log('[AUTH] Login falhou:', response.message);
        throw new Error(response.message || 'Erro ao fazer login');
      }
    } catch (error: any) {
      console.error('[AUTH] Erro no login:', error);
      
      // Verificar se é um erro de resposta HTTP
      if (error.response) {
        const { status, data } = error.response;
        console.error(`[AUTH] Erro HTTP ${status}:`, data);
        
        // Mensagens específicas baseadas no error_type
        let errorMessage = 'Erro no login';
        
        if (data?.error_type) {
          switch (data.error_type) {
            case 'validation_error':
              errorMessage = 'Email e senha são obrigatórios';
              break;
            case 'invalid_email':
              errorMessage = 'Formato de email inválido';
              break;
            case 'user_not_found':
              errorMessage = 'Email não encontrado no sistema';
              break;
            case 'wrong_password':
              errorMessage = 'Senha incorreta';
              break;
            case 'user_inactive':
              errorMessage = 'Usuário desativado. Entre em contato com o administrador.';
              break;
            case 'database_error':
              errorMessage = 'Erro de conexão com o banco de dados. Tente novamente.';
              break;
            case 'jwt_error':
              errorMessage = 'Erro interno de autenticação. Tente novamente.';
              break;
            case 'server_error':
              errorMessage = 'Erro interno do servidor. Tente novamente mais tarde.';
              break;
            default:
              errorMessage = data.message || 'Erro desconhecido no login';
          }
        } else {
          errorMessage = data?.message || `Erro HTTP ${status}`;
        }
        
        throw new Error(errorMessage);
      } 
      
      // Erro de rede ou conexão
      if (error.code === 'NETWORK_ERROR' || !error.response) {
        console.error('[AUTH] Erro de rede:', error.message);
        throw new Error('Erro de conexão. Verifique sua internet e tente novamente.');
      }
      
      // Timeout
      if (error.code === 'ECONNABORTED') {
        console.error('[AUTH] Timeout na requisição');
        throw new Error('Tempo limite excedido. Tente novamente.');
      }
      
      // Erro genérico
      throw new Error(error.message || 'Erro inesperado. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const logout = (): void => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    logout,
    loading,
    isAuthenticated: !!user && !!token,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export default AuthContext;