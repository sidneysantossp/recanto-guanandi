import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Tabs, Tab, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Snackbar, CircularProgress, FormControl, InputLabel, Select, MenuItem, Divider, List, ListItem, ListItemText, Stack } from '@mui/material';
import Grid from '@mui/material/Grid';
import { apiService } from '../services/api';
import { Budget, Company, Provider, CreateCompanyForm, BudgetHistoryItem, CreateProviderForm, CreateBudgetForm } from '../types';

const Orcamentos: React.FC = () => {
  const [tab, setTab] = useState(0);

  // estados básicos para primeiro esqueleto
  const [companies, setCompanies] = useState<Company[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  // Cadastros - abas e formulários inline
  const [cadTab, setCadTab] = useState(0);
  const [savingCompany, setSavingCompany] = useState(false);
  const [savingProvider, setSavingProvider] = useState(false);
  const [companyForm, setCompanyForm] = useState<CreateCompanyForm>({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    endereco: {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
    categorias: [],
    ativo: true,
  });
  const [providerForm, setProviderForm] = useState<CreateProviderForm>({
    nome: '',
    cpfCnpj: '',
    email: '',
    telefone: '',
    especialidades: [],
    empresaVinculada: '',
    endereco: {
      rua: '',
      numero: '',
      bairro: '',
      cidade: '',
      estado: '',
      cep: '',
    },
    ativo: true,
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  // Detalhes de orçamento
  const [openBudgetDialog, setOpenBudgetDialog] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(null);
  const [budgetDetails, setBudgetDetails] = useState<Budget | null>(null);
  const [loadingBudget, setLoadingBudget] = useState(false);
  const [commentInput, setCommentInput] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [addingComment, setAddingComment] = useState(false);

  // Criação de orçamento
  const [openCreateDialog, setOpenCreateDialog] = useState(false);
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [budgetForm, setBudgetForm] = useState<CreateBudgetForm>({
    titulo: '',
    descricao: '',
    categoria: '',
    valorEstimado: undefined,
    empresa: '',
    prestador: ''
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [c, p, b] = await Promise.all([
          apiService.getCompanies(1, 5, ''),
          apiService.getProviders(1, 5, ''),
          apiService.getBudgets(1, 5, {}),
        ]);
        setCompanies(c.data);
        setProviders(p.data);
        setBudgets(b.data);
      } catch (e) {
        console.error(e);
      }
    };
    load();
  }, []);

  // Removido: handleOpenCompany e handleCloseCompany (cadastro de empresa agora é inline)

  const handleCompanyInput = (field: keyof CreateCompanyForm, value: any) => {
    setCompanyForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCompanyAddressInput = (field: keyof NonNullable<CreateCompanyForm['endereco']>, value: any) => {
    setCompanyForm((prev) => ({
      ...prev,
      endereco: { ...(prev.endereco || {}), [field]: value },
    }));
  };

  // Prestador: handlers
  const handleProviderInput = (field: keyof CreateProviderForm, value: any) => {
    setProviderForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleProviderAddressInput = (field: keyof NonNullable<CreateProviderForm['endereco']>, value: any) => {
    setProviderForm((prev) => ({
      ...prev,
      endereco: { ...(prev.endereco || {}), [field]: value },
    }));
  };

  const handleSaveCompany = async () => {
    setFormError(null);
    if (!companyForm.nome || companyForm.nome.trim().length === 0) {
      setFormError('O nome da empresa é obrigatório.');
      return;
    }

    // Converter categorias de string separada por vírgula para array (se estiver como string)
    const payload: CreateCompanyForm = {
      ...companyForm,
      categorias: Array.isArray(companyForm.categorias)
        ? companyForm.categorias
        : (companyForm.categorias as any as string)
            ?.split(',')
            .map((s) => s.trim())
            .filter((s) => !!s) || [],
    };

    try {
      setSavingCompany(true);
      const res = await apiService.createCompany(payload);
      if (res.success && res.data) {
        // adiciona no topo para feedback imediato
        setCompanies((prev) => [res.data as Company, ...prev]);
        setSnackbar({ open: true, message: 'Empresa criada com sucesso!', severity: 'success' });
        // reset form
        setCompanyForm({
          nome: '',
          cnpj: '',
          email: '',
          telefone: '',
          endereco: { rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
          categorias: [],
          ativo: true,
        });
      } else {
        setSnackbar({ open: true, message: res.message || 'Falha ao criar empresa', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Erro ao criar empresa', severity: 'error' });
    } finally {
      setSavingCompany(false);
    }
  };

  const handleSaveProvider = async () => {
    setFormError(null);
    if (!providerForm.nome || providerForm.nome.trim().length === 0) {
      setFormError('O nome do prestador é obrigatório.');
      return;
    }

    const payload: CreateProviderForm = {
      ...providerForm,
      especialidades: Array.isArray(providerForm.especialidades)
        ? providerForm.especialidades
        : (providerForm.especialidades as any as string)
            ?.split(',')
            .map((s) => s.trim())
            .filter((s) => !!s) || [],
      empresaVinculada: providerForm.empresaVinculada || undefined,
    };

    try {
      setSavingProvider(true);
      const res = await apiService.createProvider(payload);
      if (res.success && res.data) {
        setProviders((prev) => [res.data as Provider, ...prev]);
        setSnackbar({ open: true, message: 'Prestador criado com sucesso!', severity: 'success' });
        // reset form
        setProviderForm({
          nome: '',
          cpfCnpj: '',
          email: '',
          telefone: '',
          especialidades: [],
          empresaVinculada: '',
          endereco: { rua: '', numero: '', bairro: '', cidade: '', estado: '', cep: '' },
          ativo: true,
        });
      } else {
        setSnackbar({ open: true, message: res.message || 'Falha ao criar prestador', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Erro ao criar prestador', severity: 'error' });
    } finally {
      setSavingProvider(false);
    }
  };

  // Orçamento: abrir detalhes
  const openBudgetDetails = async (id: string) => {
    setSelectedBudgetId(id);
    setOpenBudgetDialog(true);
    setLoadingBudget(true);
    setBudgetDetails(null);
    try {
      const res = await apiService.getBudgetById(id);
      if (res.success) {
        setBudgetDetails(res.data ?? null);
        setCommentInput('');
        setSnackbar({ open: true, message: 'Comentário adicionado', severity: 'success' });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBudget(false);
    }
  };

  const closeBudgetDetails = () => {
    if (addingComment || updatingStatus) return;
    setOpenBudgetDialog(false);
    setSelectedBudgetId(null);
    setBudgetDetails(null);
    setCommentInput('');
  };

  const handleChangeStatus = async (newStatus: Budget['status']) => {
    if (!selectedBudgetId) return;
    try {
      setUpdatingStatus(true);
      const res = await apiService.changeBudgetStatus(selectedBudgetId, newStatus);
      if (res.success) {
        // atualizar detalhes e lista
        setBudgetDetails((prev) => prev ? { ...prev, status: newStatus } : prev);
        setBudgets((prev) => prev.map(b => b._id === selectedBudgetId ? { ...b, status: newStatus } : b));
        // refrescar timeline
        const tl = await apiService.getBudgetTimeline(selectedBudgetId);
        if (tl.success) {
          setBudgetDetails((prev) => prev ? { ...prev, historico: tl.data as BudgetHistoryItem[] } : prev);
        }
        setSnackbar({ open: true, message: 'Status atualizado', severity: 'success' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Erro ao atualizar status', severity: 'error' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedBudgetId || !commentInput.trim()) return;
    try {
      setAddingComment(true);
      const res = await apiService.addBudgetComment(selectedBudgetId, commentInput.trim());
      if (res.success) {
        setBudgetDetails(res.data ?? null);
        setCommentInput('');
        setSnackbar({ open: true, message: 'Comentário adicionado', severity: 'success' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || 'Erro ao comentar', severity: 'error' });
    } finally {
      setAddingComment(false);
    }
  };

  // Criar orçamento: handlers
  const handleBudgetInput = (field: keyof CreateBudgetForm, value: any) => {
    setBudgetForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenCreate = () => {
    setCreateError(null);
    setOpenCreateDialog(true);
  };

  const handleCloseCreate = () => {
    if (!creatingBudget) setOpenCreateDialog(false);
  };

  const handleSaveBudget = async () => {
    setCreateError(null);
    if (!budgetForm.titulo.trim() || !budgetForm.descricao.trim() || !budgetForm.categoria.trim()) {
      setCreateError('Preencha Título, Descrição e Categoria.');
      return;
    }

    const payload: CreateBudgetForm = {
      ...budgetForm,
      empresa: budgetForm.empresa || undefined,
      prestador: budgetForm.prestador || undefined,
      valorEstimado: budgetForm.valorEstimado !== undefined && budgetForm.valorEstimado !== null && `${budgetForm.valorEstimado}` !== ''
        ? Number(budgetForm.valorEstimado)
        : undefined,
    };

    try {
      setCreatingBudget(true);
      const res = await apiService.createBudget(payload);
      if (res.success && res.data) {
        setBudgets((prev) => [res.data as Budget, ...prev]);
        setSnackbar({ open: true, message: 'Orçamento criado com sucesso!', severity: 'success' });
        setOpenCreateDialog(false);
        setBudgetForm({ titulo: '', descricao: '', categoria: '', valorEstimado: undefined, empresa: '', prestador: '' });
      } else {
        setSnackbar({ open: true, message: res.message || 'Falha ao criar orçamento', severity: 'error' });
      }
    } catch (e: any) {
      setSnackbar({ open: true, message: e?.response?.data?.message || e?.message || 'Erro ao criar orçamento', severity: 'error' });
    } finally {
      setCreatingBudget(false);
    }
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Orçamentos</Typography>
      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Solicitações" />
            <Tab label="Cadastros" />
          </Tabs>
          {tab === 0 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="h6">Solicitações recentes</Typography>
                <Button variant="contained" onClick={handleOpenCreate}>Novo Orçamento</Button>
              </Box>
              <Grid container spacing={2}>
                {budgets.map((b) => (
                  <Grid size={{ xs: 12, md: 6, lg: 4 }} key={b._id}>
                    <Card variant="outlined" sx={{ cursor: 'pointer' }} onClick={() => openBudgetDetails(b._id)}>
                      <CardContent>
                        <Typography variant="subtitle1" fontWeight={600}>{b.titulo}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: .5 }}>{b.descricao}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>Status: {b.status}</Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}
          {tab === 1 && (
            <Box>
              <Tabs value={cadTab} onChange={(_, v) => setCadTab(v)} sx={{ mb: 2 }}>
                <Tab label="Empresa" />
                <Tab label="Prestador de serviço" />
              </Tabs>

              {cadTab === 0 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Cadastrar Empresa</Typography>
                  {formError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
                  )}
                  <Grid container spacing={2} sx={{ mt: 0 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Nome da empresa"
                        fullWidth
                        required
                        autoFocus
                        value={companyForm.nome}
                        onChange={(e) => handleCompanyInput('nome', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="CNPJ"
                        fullWidth
                        value={companyForm.cnpj || ''}
                        onChange={(e) => handleCompanyInput('cnpj', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Telefone"
                        type="tel"
                        fullWidth
                        value={companyForm.telefone || ''}
                        onChange={(e) => handleCompanyInput('telefone', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={companyForm.email || ''}
                        onChange={(e) => handleCompanyInput('email', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        label="Rua"
                        fullWidth
                        value={companyForm.endereco?.rua || ''}
                        onChange={(e) => handleCompanyAddressInput('rua', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Número"
                        fullWidth
                        value={companyForm.endereco?.numero || ''}
                        onChange={(e) => handleCompanyAddressInput('numero', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Bairro"
                        fullWidth
                        value={companyForm.endereco?.bairro || ''}
                        onChange={(e) => handleCompanyAddressInput('bairro', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Cidade"
                        fullWidth
                        value={companyForm.endereco?.cidade || ''}
                        onChange={(e) => handleCompanyAddressInput('cidade', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <TextField
                        label="UF"
                        inputProps={{ maxLength: 2 }}
                        fullWidth
                        value={companyForm.endereco?.estado || ''}
                        onChange={(e) => handleCompanyAddressInput('estado', e.target.value.toUpperCase())}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="CEP"
                        fullWidth
                        value={companyForm.endereco?.cep || ''}
                        onChange={(e) => handleCompanyAddressInput('cep', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Categorias (separe por vírgula)"
                        fullWidth
                        value={Array.isArray(companyForm.categorias) ? companyForm.categorias.join(', ') : (companyForm.categorias as any as string) || ''}
                        onChange={(e) => handleCompanyInput('categorias', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSaveCompany} disabled={savingCompany}>
                      {savingCompany && <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />}
                      {savingCompany ? 'Salvando...' : 'Criar'}
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" gutterBottom>Empresas recentes</Typography>
                  {companies.map(c => (
                    <Typography key={c._id} variant="body2">• {c.nome}</Typography>
                  ))}
                </Box>
              )}

              {cadTab === 1 && (
                <Box>
                  <Typography variant="h6" gutterBottom>Cadastrar Prestador de serviço</Typography>
                  {formError && (
                    <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>
                  )}
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Nome"
                        fullWidth
                        required
                        autoFocus
                        value={providerForm.nome}
                        onChange={(e) => handleProviderInput('nome', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="CPF/CNPJ"
                        fullWidth
                        value={providerForm.cpfCnpj || ''}
                        onChange={(e) => handleProviderInput('cpfCnpj', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Telefone"
                        type="tel"
                        fullWidth
                        value={providerForm.telefone || ''}
                        onChange={(e) => handleProviderInput('telefone', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Email"
                        type="email"
                        fullWidth
                        value={providerForm.email || ''}
                        onChange={(e) => handleProviderInput('email', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <FormControl fullWidth>
                        <InputLabel id="empresa-vinculada">Empresa vinculada</InputLabel>
                        <Select
                          labelId="empresa-vinculada"
                          label="Empresa vinculada"
                          value={providerForm.empresaVinculada || ''}
                          onChange={(e) => handleProviderInput('empresaVinculada', e.target.value)}
                        >
                          <MenuItem value=""><em>Nenhuma</em></MenuItem>
                          {companies.map(c => (
                            <MenuItem key={c._id} value={c._id}>{c.nome}</MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        label="Especialidades (separe por vírgula)"
                        fullWidth
                        value={Array.isArray(providerForm.especialidades) ? providerForm.especialidades.join(', ') : (providerForm.especialidades as any as string) || ''}
                        onChange={(e) => handleProviderInput('especialidades', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 8 }}>
                      <TextField
                        label="Rua"
                        fullWidth
                        value={providerForm.endereco?.rua || ''}
                        onChange={(e) => handleProviderAddressInput('rua', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Número"
                        fullWidth
                        value={providerForm.endereco?.numero || ''}
                        onChange={(e) => handleProviderAddressInput('numero', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <TextField
                        label="Bairro"
                        fullWidth
                        value={providerForm.endereco?.bairro || ''}
                        onChange={(e) => handleProviderAddressInput('bairro', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="Cidade"
                        fullWidth
                        value={providerForm.endereco?.cidade || ''}
                        onChange={(e) => handleProviderAddressInput('cidade', e.target.value)}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 2 }}>
                      <TextField
                        label="UF"
                        inputProps={{ maxLength: 2 }}
                        fullWidth
                        value={providerForm.endereco?.estado || ''}
                        onChange={(e) => handleProviderAddressInput('estado', e.target.value.toUpperCase())}
                      />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <TextField
                        label="CEP"
                        fullWidth
                        value={providerForm.endereco?.cep || ''}
                        onChange={(e) => handleProviderAddressInput('cep', e.target.value)}
                      />
                    </Grid>
                  </Grid>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 2 }}>
                    <Button variant="contained" onClick={handleSaveProvider} disabled={savingProvider || !providerForm.nome.trim()}>
                      {savingProvider && <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />}
                      {savingProvider ? 'Salvando...' : 'Criar'}
                    </Button>
                  </Stack>

                  <Divider sx={{ my: 3 }} />
                  <Typography variant="subtitle1" gutterBottom>Prestadores recentes</Typography>
                  {providers.map(p => (
                    <Typography key={p._id} variant="body2">• {p.nome}</Typography>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Criação de Orçamento */}
      <Dialog open={openCreateDialog} onClose={handleCloseCreate} fullWidth maxWidth="md">
        <DialogTitle>Novo Orçamento</DialogTitle>
        <DialogContent dividers>
          {createError && (<Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>)}
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Título"
                fullWidth
                required
                value={budgetForm.titulo}
                onChange={(e) => handleBudgetInput('titulo', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Categoria"
                fullWidth
                required
                value={budgetForm.categoria}
                onChange={(e) => handleBudgetInput('categoria', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Descrição"
                fullWidth
                required
                multiline
                minRows={3}
                value={budgetForm.descricao}
                onChange={(e) => handleBudgetInput('descricao', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Valor Estimado"
                type="number"
                fullWidth
                inputProps={{ min: 0, step: 0.01 }}
                value={budgetForm.valorEstimado ?? ''}
                onChange={(e) => handleBudgetInput('valorEstimado', e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="empresa-label">Empresa</InputLabel>
                <Select
                  labelId="empresa-label"
                  label="Empresa"
                  value={budgetForm.empresa || ''}
                  onChange={(e) => handleBudgetInput('empresa', e.target.value)}
                >
                  <MenuItem value=""><em>Nenhuma</em></MenuItem>
                  {companies.map(c => (
                    <MenuItem key={c._id} value={c._id}>{c.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel id="prestador-label">Prestador</InputLabel>
                <Select
                  labelId="prestador-label"
                  label="Prestador"
                  value={budgetForm.prestador || ''}
                  onChange={(e) => handleBudgetInput('prestador', e.target.value)}
                >
                  <MenuItem value=""><em>Nenhum</em></MenuItem>
                  {providers.map(p => (
                    <MenuItem key={p._id} value={p._id}>{p.nome}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreate} disabled={creatingBudget}>Cancelar</Button>
          <Button variant="contained" onClick={handleSaveBudget} disabled={creatingBudget || !budgetForm.titulo.trim() || !budgetForm.descricao.trim() || !budgetForm.categoria.trim()}>
            {creatingBudget && <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />}
            {creatingBudget ? 'Criando...' : 'Criar'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de detalhes de Orçamento */}
      <Dialog open={openBudgetDialog} onClose={closeBudgetDetails} fullWidth maxWidth="md">
        <DialogTitle>Detalhes do Orçamento</DialogTitle>
        <DialogContent dividers>
          {loadingBudget && (
            <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2">Carregando...</Typography>
            </Stack>
          )}
          {!loadingBudget && budgetDetails && (
            <Box>
              <Typography variant="h6">{budgetDetails.titulo}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{budgetDetails.descricao}</Typography>

              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <FormControl fullWidth>
                    <InputLabel id="status-label">Status</InputLabel>
                    <Select
                      labelId="status-label"
                      label="Status"
                      value={budgetDetails.status}
                      onChange={(e) => handleChangeStatus(e.target.value as Budget['status'])}
                      disabled={updatingStatus}
                    >
                      <MenuItem value="aberto">Aberto</MenuItem>
                      <MenuItem value="em_analise">Em análise</MenuItem>
                      <MenuItem value="aprovado">Aprovado</MenuItem>
                      <MenuItem value="rejeitado">Rejeitado</MenuItem>
                      <MenuItem value="concluido">Concluído</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Timeline</Typography>
              <List dense>
                {(budgetDetails.historico || []).slice().sort((a, b) => new Date(b.data as any).getTime() - new Date(a.data as any).getTime()).map((h, idx) => (
                  <ListItem key={idx} disableGutters>
                    <ListItemText
                      primary={`${new Date(h.data as any).toLocaleString('pt-BR')} — ${h.tipo}${h.descricao ? `: ${h.descricao}` : ''}`}
                      secondary={h.usuario ? `${h.usuario.nome || ''} ${h.usuario.email ? `(${h.usuario.email})` : ''}` : ''}
                    />
                  </ListItem>
                ))}
                {(budgetDetails.historico || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">Sem eventos registrados.</Typography>
                )}
              </List>

              <Divider sx={{ my: 2 }} />
              <Typography variant="subtitle1" gutterBottom>Comentários</Typography>
              <List dense>
                {(budgetDetails.comentarios || []).slice().sort((a, b) => new Date(b.criadoEm as any).getTime() - new Date(a.criadoEm as any).getTime()).map((c, idx) => (
                  <ListItem key={idx} alignItems="flex-start" disableGutters>
                    <ListItemText
                      primary={c.conteudo}
                      secondary={`${c.autor?.nome || 'Usuário'} — ${new Date(c.criadoEm as any).toLocaleString('pt-BR')}`}
                    />
                  </ListItem>
                ))}
                {(budgetDetails.comentarios || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">Nenhum comentário ainda.</Typography>
                )}
              </List>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} sx={{ mt: 1 }}>
                <TextField
                  label="Adicionar comentário"
                  fullWidth
                  multiline
                  minRows={2}
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                />
                <Button variant="contained" onClick={handleAddComment} disabled={addingComment || !commentInput.trim()} sx={{ minWidth: 140 }}>
                  {addingComment && <CircularProgress size={20} sx={{ mr: 1, color: 'white' }} />}
                  {addingComment ? 'Enviando...' : 'Comentar'}
                </Button>
              </Stack>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={closeBudgetDetails}>Fechar</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de Nova Empresa removido (cadastro agora é inline nas abas) */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((s) => ({ ...s, open: false }))}
        message={snackbar.message}
      />
    </Box>
  );
};

export default Orcamentos;