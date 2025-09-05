import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  Search,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { User, CreateUserForm } from '../types';
import { formatDate } from '../utils/theme';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<CreateUserForm>({
    nome: '',
    email: '',
    senha: '',
    tipo: 'proprietario',
    cpf: '',
    telefone: '',
    endereco: {
      lote: '',
      quadra: '',
      rua: '',
      cep: '',
    },
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.getUsers(1, 100);
      if (response.success && response.data) {
        setUsers(response.data);
      } else {
        setError('Erro ao carregar usuários');
      }
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
      setError('Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        nome: user.nome,
        email: user.email,
        senha: '',
        tipo: user.tipo,
        cpf: user.cpf || '',
        telefone: user.telefone || '',
        endereco: {
          lote: user.endereco?.lote || '',
          quadra: user.endereco?.quadra || '',
          rua: user.endereco?.rua || '',
          cep: user.endereco?.cep || '',
        },
      });
    } else {
      setEditingUser(null);
      setFormData({
        nome: '',
        email: '',
        senha: '',
        tipo: 'proprietario',
        cpf: '',
        telefone: '',
        endereco: {
          lote: '',
          quadra: '',
          rua: '',
          cep: '',
        },
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingUser(null);
    setError('');
    setSuccessMessage('');
  };

  const handleSubmit = async () => {
    // Validação de campos obrigatórios
    if (!formData.nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }
    if (!formData.email.trim()) {
      setError('Email é obrigatório');
      return;
    }
    if (!editingUser && !formData.senha.trim()) {
      setError('Senha é obrigatória para novos usuários');
      return;
    }
    if (formData.tipo === 'proprietario' && (!formData.cpf || !formData.cpf.trim())) {
      setError('CPF é obrigatório para proprietários');
      return;
    }

    try {
      setError(''); // Limpar erros anteriores
      setSuccessMessage(''); // Limpar mensagens de sucesso anteriores
      console.log('Dados do formulário sendo enviados:', formData);
      
      if (editingUser) {
        const response = await apiService.updateUser(editingUser._id, formData);
        console.log('Resposta da API (update):', response);
        if (response.success || response.message) {
          setSuccessMessage('Usuário atualizado com sucesso!');
          await loadUsers();
          handleCloseDialog();
        }
      } else {
        const response = await apiService.createUser(formData);
        console.log('Resposta da API (create):', response);
        if (response.success || response.message) {
          setSuccessMessage('Usuário cadastrado com sucesso!');
          await loadUsers();
          handleCloseDialog();
        }
      }
    } catch (err: any) {
      console.error('Erro ao salvar usuário:', err);
      console.log('Detalhes do erro:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      setError(err.response?.data?.message || err.message || 'Erro ao salvar usuário');
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário?')) {
      try {
        const response = await apiService.deleteUser(userId);
        if (response.success) {
          await loadUsers();
        }
      } catch (err: any) {
        setError('Erro ao excluir usuário');
      }
    }
  };

  const filteredUsers = users.filter(user =>
    user.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (situacao: string) => {
    switch (situacao) {
      case 'ativo': return 'success';
      case 'inadimplente': return 'error';
      case 'inativo': return 'default';
      default: return 'default';
    }
  };

  if (currentUser?.tipo !== 'admin') {
    return (
      <Alert severity="error">
        Acesso negado. Apenas administradores podem acessar esta página.
      </Alert>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Proprietários
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            Gerencie os proprietários da associação
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Novo Proprietário
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por nome ou email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Nome</TableCell>
                    <TableCell>Email</TableCell>
                    {!isSmDown && <TableCell>Tipo</TableCell>}
                    <TableCell>Situação</TableCell>
                    {!isSmDown && <TableCell>Último Login</TableCell>}
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user._id}>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {user.nome}
                          </Typography>
                          {user.endereco?.lote && (
                            <Typography variant="caption" color="text.secondary">
                              Lote {user.endereco.lote}
                              {user.endereco.quadra && `, Quadra ${user.endereco.quadra}`}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      {!isSmDown && (
                        <TableCell>
                          <Chip
                            label={user.tipo === 'admin' ? 'Administrador' : 'Proprietário'}
                            color={user.tipo === 'admin' ? 'primary' : 'default'}
                            size="small"
                          />
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={user.situacao}
                          color={getStatusColor(user.situacao) as any}
                          size="small"
                        />
                      </TableCell>
                      {!isSmDown && (
                        <TableCell>
                          {user.dataUltimoLogin
                            ? formatDate(new Date(user.dataUltimoLogin))
                            : 'Nunca'
                          }
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(user)}
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(user._id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingUser ? 'Editar Proprietário' : 'Novo Proprietário'}
        </DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              fullWidth
              label="Nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            {!editingUser && (
              <TextField
                fullWidth
                label="Senha"
                type="password"
                value={formData.senha}
                onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
              />
            )}
            <FormControl fullWidth>
              <InputLabel>Tipo</InputLabel>
              <Select
                value={formData.tipo}
                onChange={(e) => setFormData({ ...formData, tipo: e.target.value as 'admin' | 'proprietario' })}
              >
                <MenuItem value="proprietario">Proprietário</MenuItem>
                <MenuItem value="admin">Administrador</MenuItem>
              </Select>
            </FormControl>
            <TextField
              fullWidth
              label="CPF"
              value={formData.cpf}
              onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
            />
            <TextField
              fullWidth
              label="Telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                label="Lote"
                value={formData.endereco?.lote}
                onChange={(e) => setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, lote: e.target.value }
                })}
              />
              <TextField
                label="Quadra"
                value={formData.endereco?.quadra}
                onChange={(e) => setFormData({
                  ...formData,
                  endereco: { ...formData.endereco, quadra: e.target.value }
                })}
              />
            </Box>
            <TextField
              fullWidth
              label="Rua"
              value={formData.endereco?.rua}
              onChange={(e) => setFormData({
                ...formData,
                endereco: { ...formData.endereco, rua: e.target.value }
              })}
            />
            <TextField
              fullWidth
              label="CEP"
              value={formData.endereco?.cep}
              onChange={(e) => setFormData({
                ...formData,
                endereco: { ...formData.endereco, cep: e.target.value }
              })}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingUser ? 'Salvar' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users;
