import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Tabs,
  Tab,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  Add,
  Edit,
  Delete,
  Visibility,
  Search,
  Download,
  Payment,
  QrCode,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Boleto, User, CreateBoletoForm } from '../types';
import { formatCurrency, formatDate } from '../utils/theme';
import dayjs from 'dayjs';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const Boletos: React.FC = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const theme = useTheme();
  const isSmDown = useMediaQuery(theme.breakpoints.down('sm'));
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingBoleto, setEditingBoleto] = useState<Boleto | null>(null);
  const [formData, setFormData] = useState<CreateBoletoForm>({
    proprietarioId: '',
    descricao: '',
    valor: 0,
    dataVencimento: new Date(),
    categoria: 'taxa_condominio',
    observacoes: '',
    tipoPagamento: 'boleto',
  });
  const [bulkCreateDialog, setBulkCreateDialog] = useState(false);
  const [selectedBoletos, setSelectedBoletos] = useState<string[]>([]);
  const [bulkFormData, setBulkFormData] = useState({
    descricao: '',
    valor: 0,
    dataVencimento: new Date(),
    categoria: 'taxa_condominio',
    observacoes: '',
    tipoPagamento: 'boleto',
    proprietarios: [] as string[]
  });

  useEffect(() => {
    loadBoletos();
    if (currentUser?.tipo === 'admin') {
      loadUsers();
    }
  }, [currentUser]);

  const loadBoletos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBoletos();
      if (response.success && response.data) {
        setBoletos(response.data);
      }
    } catch (err: any) {
      setError('Erro ao carregar boletos');
      console.error('Erro:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await apiService.getUsers();
      if (response.success && response.data) {
        setUsers(response.data.filter(user => user.tipo === 'proprietario'));
      }
    } catch (err: any) {
      console.error('Erro ao carregar usuários:', err);
    }
  };

  const handleOpenDialog = (boleto?: Boleto) => {
    if (boleto) {
      setEditingBoleto(boleto);
      setFormData({
        proprietarioId: boleto.proprietario._id,
        descricao: boleto.descricao,
        valor: boleto.valor,
        dataVencimento: new Date(boleto.dataVencimento),
        categoria: boleto.categoria,
        observacoes: boleto.observacoes || '',
        tipoPagamento: boleto.tipoPagamento,
      });
    } else {
      setEditingBoleto(null);
      setFormData({
        proprietarioId: '',
        descricao: '',
        valor: 0,
        dataVencimento: new Date(),
        categoria: 'taxa_condominio',
        observacoes: '',
        tipoPagamento: 'boleto',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingBoleto(null);
    setError('');
  };

  const handleSubmit = async () => {
    try {
      if (editingBoleto) {
        const response = await apiService.updateBoleto(editingBoleto._id, {
          descricao: formData.descricao,
          valor: formData.valor,
          dataVencimento: formData.dataVencimento,
          categoria: formData.categoria as Boleto['categoria'],
          observacoes: formData.observacoes,
          tipoPagamento: (formData.tipoPagamento || 'boleto') as Boleto['tipoPagamento'],
        });
        if (response.success) {
          await loadBoletos();
          handleCloseDialog();
        }
      } else {
        const response = await apiService.createBoleto({
          proprietarioId: formData.proprietarioId,
          descricao: formData.descricao,
          valor: formData.valor,
          dataVencimento: formData.dataVencimento,
          categoria: formData.categoria as Boleto['categoria'],
          observacoes: formData.observacoes,
          tipoPagamento: formData.tipoPagamento as Boleto['tipoPagamento'],
        });
        if (response.success) {
          await loadBoletos();
          handleCloseDialog();
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao salvar boleto');
    }
  };

  const handleDelete = async (boletoId: string) => {
    if (window.confirm('Tem certeza que deseja excluir este boleto?')) {
      try {
        const response = await apiService.deleteBoleto(boletoId);
        if (response.success) {
          await loadBoletos();
        }
      } catch (err: any) {
        setError('Erro ao excluir boleto');
      }
    }
  };

  const handleBulkCreate = async () => {
    try {
      const bulkData = {
        proprietarios: bulkFormData.proprietarios,
        descricao: bulkFormData.descricao,
        valor: bulkFormData.valor,
        dataVencimento: bulkFormData.dataVencimento,
        categoria: bulkFormData.categoria,
        observacoes: bulkFormData.observacoes,
        tipoPagamento: bulkFormData.tipoPagamento
      };

      const response = await apiService.createBulkBoletos(bulkData);
      if (response.success) {
        await loadBoletos();
        setBulkCreateDialog(false);
        setBulkFormData({
          descricao: '',
          valor: 0,
          dataVencimento: new Date(),
          categoria: 'taxa_condominio',
          observacoes: '',
          tipoPagamento: 'boleto',
          proprietarios: []
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar boletos em lote');
    }
  };

  const handleMarkAsPaid = async (boletoId: string) => {
    try {
      const response = await apiService.markBoletoAsPaid(boletoId, {
        tipoPagamento: 'dinheiro',
        dataPagamento: new Date()
      });
      if (response.success) {
        await loadBoletos();
      }
    } catch (err: any) {
      setError('Erro ao marcar boleto como pago');
    }
  };

  const filteredBoletos = boletos.filter(boleto => {
    const matchesSearch = boleto.descricao.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boleto.proprietario.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         boleto.numeroDocumento.toLowerCase().includes(searchTerm.toLowerCase());
    
    switch (tabValue) {
      case 0: return matchesSearch; // Todos
      case 1: return matchesSearch && boleto.status === 'pendente';
      case 2: return matchesSearch && boleto.status === 'pago';
      case 3: return matchesSearch && boleto.status === 'vencido';
      default: return matchesSearch;
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'success';
      case 'pendente': return 'warning';
      case 'vencido': return 'error';
      case 'cancelado': return 'default';
      default: return 'default';
    }
  };

  const getCategoryLabel = (categoria: string) => {
    const labels: Record<string, string> = {
      'taxa_condominio': 'Taxa de Condomínio',
      'taxa_extra': 'Taxa Extra',
      'multa': 'Multa',
      'obra': 'Obra',
      'manutencao': 'Manutenção',
      'outros': 'Outros',
    };
    return labels[categoria] || categoria;
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            {currentUser?.tipo === 'admin' ? 'Boletos' : 'Meus Boletos'}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {currentUser?.tipo === 'admin' 
              ? 'Gerencie os boletos da associação'
              : 'Visualize e pague seus boletos'
            }
          </Typography>
        </Box>
        {currentUser?.tipo === 'admin' && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Add />}
              onClick={() => setBulkCreateDialog(true)}
            >
              Criar em Lote
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
            >
              Novo Boleto
            </Button>
          </Box>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <TextField
            fullWidth
            placeholder="Buscar por descrição, proprietário ou número..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: <Search sx={{ color: 'text.secondary', mr: 1 }} />,
            }}
          />
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Todos" />
            <Tab label="Pendentes" />
            <Tab label="Pagos" />
            <Tab label="Vencidos" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={tabValue}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ overflowX: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    {!isSmDown && <TableCell>Número</TableCell>}
                    {currentUser?.tipo === 'admin' && !isSmDown && <TableCell>Proprietário</TableCell>}
                    <TableCell>Descrição</TableCell>
                    <TableCell>Valor</TableCell>
                    {!isSmDown && <TableCell>Vencimento</TableCell>}
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBoletos.map((boleto) => (
                    <TableRow key={boleto._id}>
                      {!isSmDown && (
                        <TableCell>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {boleto.numeroDocumento}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {getCategoryLabel(boleto.categoria)}
                          </Typography>
                        </TableCell>
                      )}
                      {currentUser?.tipo === 'admin' && !isSmDown && (
                        <TableCell>
                          <Typography variant="body2">
                            {boleto.proprietario.nome}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {boleto.proprietario.email}
                          </Typography>
                        </TableCell>
                      )}
                      <TableCell>{boleto.descricao}</TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {formatCurrency(boleto.valor)}
                        </Typography>
                      </TableCell>
                      {!isSmDown && (
                        <TableCell>
                          {formatDate(new Date(boleto.dataVencimento))}
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={boleto.status}
                          color={getStatusColor(boleto.status) as any}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton 
                          size="small"
                          onClick={() => navigate(`/boletos/${boleto._id}`)}
                          title="Visualizar Boleto"
                        >
                          <Visibility fontSize="small" />
                        </IconButton>
                        {boleto.status === 'pendente' && currentUser?.tipo === 'admin' && (
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleMarkAsPaid(boleto._id)}
                            title="Marcar como Pago"
                          >
                            <Payment fontSize="small" />
                          </IconButton>
                        )}
                        {boleto.status !== 'pago' && (
                          <IconButton 
                            size="small"
                            color="primary"
                            onClick={() => navigate(`/pix?boleto=${boleto._id}`)}
                            title="Gerar PIX"
                          >
                            <QrCode fontSize="small" />
                          </IconButton>
                        )}
                        {currentUser?.tipo === 'admin' && (
                          <>
                            <IconButton
                              size="small"
                              onClick={() => handleOpenDialog(boleto)}
                            >
                              <Edit fontSize="small" />
                            </IconButton>
                            <IconButton
                              size="small"
                              onClick={() => handleDelete(boleto._id)}
                              color="error"
                            >
                              <Delete fontSize="small" />
                            </IconButton>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Card>

      {/* Boleto Dialog */}
      {currentUser?.tipo === 'admin' && (
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingBoleto ? 'Editar Boleto' : 'Novo Boleto'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <FormControl fullWidth>
                <InputLabel>Proprietário</InputLabel>
                <Select
                  value={formData.proprietarioId}
                  onChange={(e) => setFormData({ ...formData, proprietarioId: e.target.value })}
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.nome} - {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Descrição"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    value={formData.valor}
                    onChange={(e) => setFormData({ ...formData, valor: parseFloat(e.target.value) })}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Data de Vencimento"
                    value={dayjs(formData.dataVencimento)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setFormData({ ...formData, dataVencimento: newValue.toDate() });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                    >
                      <MenuItem value="taxa_condominio">Taxa de Condomínio</MenuItem>
                      <MenuItem value="taxa_extra">Taxa Extra</MenuItem>
                      <MenuItem value="multa">Multa</MenuItem>
                      <MenuItem value="obra">Obra</MenuItem>
                      <MenuItem value="manutencao">Manutenção</MenuItem>
                      <MenuItem value="outros">Outros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Pagamento</InputLabel>
                    <Select
                      value={formData.tipoPagamento}
                      onChange={(e) => setFormData({ ...formData, tipoPagamento: e.target.value as Boleto['tipoPagamento'] })}
                    >
                      <MenuItem value="boleto">Boleto</MenuItem>
                      <MenuItem value="pix">PIX</MenuItem>
                      <MenuItem value="dinheiro">Dinheiro</MenuItem>
                      <MenuItem value="transferencia">Transferência</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={formData.observacoes}
                onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancelar</Button>
            <Button onClick={handleSubmit} variant="contained">
              {editingBoleto ? 'Salvar' : 'Criar'}
            </Button>
          </DialogActions>
        </Dialog>
      )}

      {/* Bulk Create Dialog */}
      {currentUser?.tipo === 'admin' && (
        <Dialog open={bulkCreateDialog} onClose={() => setBulkCreateDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>Criar Boletos em Lote</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <Alert severity="info">
                Crie boletos idênticos para múltiplos proprietários de uma só vez.
              </Alert>
              
              <TextField
                fullWidth
                label="Descrição"
                value={bulkFormData.descricao}
                onChange={(e) => setBulkFormData({ ...bulkFormData, descricao: e.target.value })}
              />
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Valor"
                    type="number"
                    value={bulkFormData.valor}
                    onChange={(e) => setBulkFormData({ ...bulkFormData, valor: parseFloat(e.target.value) })}
                    InputProps={{
                      startAdornment: <Typography sx={{ mr: 1 }}>R$</Typography>,
                    }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <DatePicker
                    label="Data de Vencimento"
                    value={dayjs(bulkFormData.dataVencimento)}
                    onChange={(newValue) => {
                      if (newValue) {
                        setBulkFormData({ ...bulkFormData, dataVencimento: newValue.toDate() });
                      }
                    }}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
              </Grid>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Categoria</InputLabel>
                    <Select
                      value={bulkFormData.categoria}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, categoria: e.target.value })}
                    >
                      <MenuItem value="taxa_condominio">Taxa de Condomínio</MenuItem>
                      <MenuItem value="taxa_extra">Taxa Extra</MenuItem>
                      <MenuItem value="multa">Multa</MenuItem>
                      <MenuItem value="obra">Obra</MenuItem>
                      <MenuItem value="manutencao">Manutenção</MenuItem>
                      <MenuItem value="outros">Outros</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel>Tipo de Pagamento</InputLabel>
                    <Select
                      value={bulkFormData.tipoPagamento}
                      onChange={(e) => setBulkFormData({ ...bulkFormData, tipoPagamento: e.target.value as Boleto['tipoPagamento'] })}
                    >
                      <MenuItem value="boleto">Boleto</MenuItem>
                      <MenuItem value="pix">PIX</MenuItem>
                      <MenuItem value="dinheiro">Dinheiro</MenuItem>
                      <MenuItem value="transferencia">Transferência</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              
              <FormControl fullWidth>
                <InputLabel>Proprietários</InputLabel>
                <Select
                  multiple
                  value={bulkFormData.proprietarios}
                  onChange={(e) => setBulkFormData({ ...bulkFormData, proprietarios: e.target.value as string[] })}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => {
                        const user = users.find(u => u._id === value);
                        return (
                          <Chip key={value} label={user?.nome || value} size="small" />
                        );
                      })}
                    </Box>
                  )}
                >
                  {users.map((user) => (
                    <MenuItem key={user._id} value={user._id}>
                      {user.nome} - {user.email}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              
              <TextField
                fullWidth
                label="Observações"
                multiline
                rows={3}
                value={bulkFormData.observacoes}
                onChange={(e) => setBulkFormData({ ...bulkFormData, observacoes: e.target.value })}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBulkCreateDialog(false)}>Cancelar</Button>
            <Button onClick={handleBulkCreate} variant="contained" disabled={bulkFormData.proprietarios.length === 0}>
              Criar {bulkFormData.proprietarios.length} Boletos
            </Button>
          </DialogActions>
        </Dialog>
      )}
    </Box>
  );
};

export default Boletos;
