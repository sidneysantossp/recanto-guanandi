import React, { useEffect, useMemo, useState } from 'react';
import Grid from '@mui/material/Grid';
// import type { SelectChangeEvent } from '@mui/material/Select';
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
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  InputAdornment,
  FormControlLabel,
  Switch
} from '@mui/material';
import {
  Add,
  Visibility,
  Publish,
  Archive,
  Search,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Notification, PaginatedResponse, ApiResponse } from '../types';
import { formatDateTime } from '../utils/theme';

const statusColor = (status: Notification['status']) => {
  switch (status) {
    case 'publicado':
      return 'success';
    case 'rascunho':
      return 'warning';
    case 'arquivado':
      return 'default';
    default:
      return 'default';
  }
};

const prioridadeColor = (prioridade: Notification['prioridade']) => {
  switch (prioridade) {
    case 'urgente':
      return 'error';
    case 'alta':
      return 'warning';
    case 'media':
      return 'info';
    case 'baixa':
      return 'default';
    default:
      return 'default';
  }
};


const Notifications: React.FC = () => {
  const { user } = useAuth();

  const [items, setItems] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [total, setTotal] = useState(0);

  const [filters, setFilters] = useState<{ search: string; status: Notification['status'] | ''; tipo: Notification['tipo'] | ''}>({
    search: '',
    status: '',
    tipo: '' as Notification['tipo'] | '',
  });

  const [stats, setStats] = useState<any | null>(null);

  // Dialog de visualização
  const [viewOpen, setViewOpen] = useState(false);
  const [selected, setSelected] = useState<Notification | null>(null);

  // Dialog de criação (apenas admin)
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    titulo: '',
    conteudo: '',
    tipo: '' as Notification['tipo'] | '',
    prioridade: 'media' as Notification['prioridade'],
    destinatarios: {
      tipo: 'todos' as 'todos' | 'inadimplentes' | 'ativos',
    },
    dataExpiracao: '' as string | '',
    configuracoes: {
      enviarEmail: true,
      enviarSMS: false,
      exibirDashboard: true,
      permitirComentarios: true,
    },
  });

  const canManage = user?.tipo === 'admin';

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const q: any = {};
      if (filters.status) q.status = filters.status;
      if (filters.tipo) q.tipo = filters.tipo;
      if (filters.search) q.search = filters.search; // backend atual não usa search, mas mantemos para futura extensão

      const res: PaginatedResponse<Notification> = await apiService.getNotifications(page, limit, q);
      setItems(res.data);
      setTotal(res.pagination?.total || 0);
    } catch (e: any) {
      console.error('Erro ao carregar notificações:', e);
      setError(e.response?.data?.message || 'Erro ao carregar notificações');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!canManage) return;
    try {
      const res: ApiResponse<any> = await apiService.getNotificationStats();
      if (res.success) setStats(res.data);
    } catch (e) {
      // silencioso
    }
  };

  useEffect(() => {
    loadNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, filters.status, filters.tipo, filters.search]);

  useEffect(() => {
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handlePublish = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.publishNotification(id);
      if (res.success) {
        setSuccess('Notificação publicada com sucesso');
        loadNotifications();
        loadStats();
      } else {
        setError(res.message || 'Erro ao publicar');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao publicar notificação');
    } finally {
      setLoading(false);
    }
  };

  const handleArchive = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.archiveNotification(id);
      if (res.success) {
        setSuccess('Notificação arquivada');
        loadNotifications();
        loadStats();
      } else {
        setError(res.message || 'Erro ao arquivar');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao arquivar notificação');
    } finally {
      setLoading(false);
    }
  };

  const openView = async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      const res = await apiService.getNotificationById(id);
      if (res.success && res.data) {
        setSelected(res.data);
        setViewOpen(true);
      } else {
        setError(res.message || 'Não foi possível abrir a notificação');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao carregar notificação');
    } finally {
      setLoading(false);
    }
  };

  const tipos = useMemo(() => (
    [
      { value: '', label: 'Todos' },
      { value: 'comunicado', label: 'Comunicado' },
      { value: 'ata', label: 'Ata' },
      { value: 'assembleia', label: 'Assembleia' },
      { value: 'cobranca', label: 'Cobrança' },
      { value: 'manutencao', label: 'Manutenção' },
      { value: 'urgente', label: 'Urgente' },
    ]
  ), []);

  const estatCards = canManage ? (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid size={{ xs: 12, md: 3 }}>
         <Card variant="outlined">
           <CardContent>
             <Typography variant="overline" color="text.secondary">Total</Typography>
             <Typography variant="h5">{stats?.total ?? '-'}</Typography>
           </CardContent>
         </Card>
       </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
         <Card variant="outlined">
           <CardContent>
             <Typography variant="overline" color="text.secondary">Publicadas</Typography>
             <Typography variant="h5">{stats?.publicadas ?? '-'}</Typography>
           </CardContent>
         </Card>
       </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
         <Card variant="outlined">
           <CardContent>
             <Typography variant="overline" color="text.secondary">Rascunhos</Typography>
             <Typography variant="h5">{stats?.rascunhos ?? '-'}</Typography>
           </CardContent>
         </Card>
       </Grid>
      <Grid size={{ xs: 12, md: 3 }}>
         <Card variant="outlined">
           <CardContent>
             <Typography variant="overline" color="text.secondary">Arquivadas</Typography>
             <Typography variant="h5">{stats?.arquivadas ?? '-'}</Typography>
           </CardContent>
         </Card>
       </Grid>
    </Grid>
  ) : null;

  const handleCreate = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload = {
        titulo: form.titulo,
        conteudo: form.conteudo,
        tipo: form.tipo || 'comunicado',
        prioridade: form.prioridade,
        destinatarios: { tipo: form.destinatarios.tipo },
        dataExpiracao: form.dataExpiracao || undefined,
        configuracoes: form.configuracoes,
      };
      const res = await apiService.createNotification(payload as any);
      if (res.success) {
        setSuccess('Notificação criada como rascunho');
        setCreateOpen(false);
        setForm({
          titulo: '', conteudo: '', tipo: '', prioridade: 'media',
          destinatarios: { tipo: 'todos' }, dataExpiracao: '',
          configuracoes: { enviarEmail: true, enviarSMS: false, exibirDashboard: true, permitirComentarios: true }
        });
        setPage(1);
        loadNotifications();
        loadStats();
      } else {
        setError(res.message || 'Erro ao criar notificação');
      }
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao criar notificação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Notificações
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {estatCards}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
               <Grid size={{ xs: 12, md: 4 }}>
               <TextField
                 label="Buscar"
                 value={filters.search}
                 onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                 fullWidth
                 placeholder="Buscar por título ou conteúdo"
                 InputProps={{
                   startAdornment: (
                     <InputAdornment position="start">
                       <Search />
                     </InputAdornment>
                   )
                 }}
               />
             </Grid>
               <Grid size={{ xs: 12, md: 3 }}>
               <FormControl fullWidth>
                 <InputLabel>Tipo</InputLabel>
                 <Select
                   label="Tipo"
                   value={filters.tipo}
                   onChange={(e) => setFilters(prev => ({ ...prev, tipo: e.target.value }))}
                 >
                   {tipos.map(t => (
                     <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                   ))}
                 </Select>
               </FormControl>
             </Grid>
               <Grid size={{ xs: 12, md: 3 }}>
               <FormControl fullWidth>
                 <InputLabel>Status</InputLabel>
                 <Select
                   label="Status"
                   value={filters.status}
                   onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
                 >
                   <MenuItem value="">Todos</MenuItem>
                   <MenuItem value="rascunho">Rascunho</MenuItem>
                   <MenuItem value="publicado">Publicada</MenuItem>
                   <MenuItem value="arquivado">Arquivada</MenuItem>
                 </Select>
               </FormControl>
             </Grid>
            <Grid size={{ xs: 12, md: 2 }} textAlign={{ xs: 'left', md: 'right' }}>
               <Button variant="contained" startIcon={<Add />} onClick={() => setCreateOpen(true)}>
                 Nova
               </Button>
             </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        {loading && (
          <Box sx={{ p: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CircularProgress />
          </Box>
        )}
        {!loading && (
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Título</TableCell>
                  <TableCell>Tipo</TableCell>
                  <TableCell>Prioridade</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Publicação</TableCell>
                  {canManage && <TableCell>Visualizações</TableCell>}
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {items.map((n) => (
                  <TableRow key={n._id} hover>
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={600}>{n.titulo}</Typography>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 520 }}>
                        {n.conteudo}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={n.tipo} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={n.prioridade} color={prioridadeColor(n.prioridade) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip label={n.status} color={statusColor(n.status) as any} size="small" />
                    </TableCell>
                    <TableCell>
                      {n.dataPublicacao ? formatDateTime(n.dataPublicacao) : '-'}
                    </TableCell>
                    {canManage && (
                      <TableCell>
                        {n.estatisticas?.visualizacoes ?? 0}
                      </TableCell>
                    )}
                    <TableCell align="center">
                      <IconButton title="Visualizar" onClick={() => openView(n._id)}>
                        <Visibility />
                      </IconButton>
                      {canManage && n.status === 'rascunho' && (
                        <IconButton color="success" title="Publicar" onClick={() => handlePublish(n._id)}>
                          <Publish />
                        </IconButton>
                      )}
                      {canManage && n.status !== 'arquivado' && (
                        <IconButton color="warning" title="Arquivar" onClick={() => handleArchive(n._id)}>
                          <Archive />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {items.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={canManage ? 7 : 6} align="center">
                      <Typography color="text.secondary">Nenhuma notificação encontrada</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {/* Paginação simples */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2">
            Página {page} — Total: {total}
          </Typography>
          <Box>
            <Button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Anterior</Button>
            <Button disabled={items.length < limit} onClick={() => setPage((p) => p + 1)}>Próxima</Button>
          </Box>
        </Box>
      </Card>

      {/* Dialog Visualização */}
      <Dialog open={viewOpen} onClose={() => setViewOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Notificação</DialogTitle>
        <DialogContent dividers>
          {selected ? (
            <Box>
              <Typography variant="h6" sx={{ mb: 1 }}>{selected.titulo}</Typography>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                <Chip label={selected.tipo} size="small" />
                <Chip label={selected.prioridade} color={prioridadeColor(selected.prioridade) as any} size="small" />
                <Chip label={selected.status} color={statusColor(selected.status) as any} size="small" />
              </Box>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selected.conteudo}</Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="caption" color="text.secondary">
                Publicado em: {selected.dataPublicacao ? formatDateTime(selected.dataPublicacao) : '-'}
              </Typography>
            </Box>
          ) : (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CircularProgress size={24} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setViewOpen(false)}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Criação */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Nova Notificação</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                label="Título"
                fullWidth
                value={form.titulo}
                onChange={(e) => setForm(prev => ({ ...prev, titulo: e.target.value }))}
                required
               />
            </Grid>
            <Grid size={12}>
              <TextField
                label="Conteúdo"
                fullWidth
                multiline
                minRows={4}
                value={form.conteudo}
                // Tipar TextField: conteudo
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, conteudo: e.target.value }))}
                required
               />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Tipo</InputLabel>
                <Select
                  label="Tipo"
                  value={form.tipo}
                  // Tipar Select: tipo (union específico)
                  onChange={(e: import('@mui/material/Select').SelectChangeEvent<string>) => setForm(prev => ({
                    ...prev,
                    tipo: e.target.value as '' | 'urgente' | 'comunicado' | 'ata' | 'assembleia' | 'cobranca' | 'manutencao'
                  }))}
                >
                  {tipos.filter(t => t.value).map(t => (
                    <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Prioridade</InputLabel>
                <Select
                  label="Prioridade"
                  value={form.prioridade}
                  // Tipar Select: prioridade (union específico)
                  onChange={(e: import('@mui/material/Select').SelectChangeEvent<string>) => setForm(prev => ({
                    ...prev,
                    prioridade: e.target.value as 'baixa' | 'media' | 'alta' | 'urgente'
                  }))}
                >
                  <MenuItem value="baixa">Baixa</MenuItem>
                  <MenuItem value="media">Média</MenuItem>
                  <MenuItem value="alta">Alta</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                label="Data de Expiração"
                type="date"
                value={form.dataExpiracao}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, dataExpiracao: e.target.value }))}
                fullWidth
                InputLabelProps={{ shrink: true }}
               />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Destinatários</InputLabel>
                <Select
                  label="Destinatários"
                  value={form.destinatarios.tipo}
                  // Tipar Select: destinatarios.tipo e preservar outros campos
                  onChange={(e: import('@mui/material/Select').SelectChangeEvent<string>) => setForm(prev => ({
                    ...prev,
                    destinatarios: {
                      ...prev.destinatarios,
                      tipo: e.target.value as 'todos' | 'inadimplentes' | 'ativos'
                    }
                  }))}
                >
                  <MenuItem value="todos">Todos</MenuItem>
                  <MenuItem value="ativos">Apenas Ativos</MenuItem>
                  <MenuItem value="inadimplentes">Apenas Inadimplentes</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <TextField
                label="Data de Expiração (opcional)"
                type="datetime-local"
                fullWidth
                value={form.dataExpiracao}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({ ...prev, dataExpiracao: e.target.value }))}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.configuracoes.enviarEmail}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm(prev => ({
                      ...prev,
                      configuracoes: { ...prev.configuracoes, enviarEmail: (e.target as HTMLInputElement).checked }
                    }))}
                  />
                }
                label="Enviar por e-mail aos proprietários"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreate}>Criar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Notifications;