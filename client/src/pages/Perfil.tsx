import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Typography, Tabs, Tab, TextField, Button, Alert, Snackbar, Stack, Divider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { UpdateProfilePayload, ChangePasswordPayload } from '../types';

interface PerfilProps {
  defaultTab?: 'perfil' | 'config';
}

const Perfil: React.FC<PerfilProps> = ({ defaultTab = 'perfil' }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { user } = useAuth();

  const [tab, setTab] = useState<'perfil' | 'config'>(defaultTab);
  const [form, setForm] = useState<UpdateProfilePayload>({ nome: user?.nome || '', email: user?.email || '' });
  const [pwd, setPwd] = useState<ChangePasswordPayload>({ senhaAtual: '', novaSenha: '' });
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setForm({ nome: user.nome, email: user.email });
    }
  }, [user]);

  const handleUpdateProfile = async () => {
    if (!form.nome || !form.email) {
      setErr('Nome e email são obrigatórios');
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      const res = await apiService.updateProfile({ nome: form.nome, email: form.email });
      if (res.success || res.message) {
        setMsg(res.message || 'Perfil atualizado com sucesso');
        const me = await apiService.getMe();
        if (me.success && me.data) {
          localStorage.setItem('user', JSON.stringify(me.data));
        }
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message || 'Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!pwd.senhaAtual || !pwd.novaSenha) {
      setErr('Informe a senha atual e a nova senha');
      return;
    }
    if (pwd.novaSenha.length < 6) {
      setErr('A nova senha deve ter pelo menos 6 caracteres');
      return;
    }
    try {
      setLoading(true);
      setErr(null);
      const res = await apiService.changePassword(pwd);
      if (res.success || res.message) {
        setMsg(res.message || 'Senha alterada com sucesso');
        setPwd({ senhaAtual: '', novaSenha: '' });
      }
    } catch (e: any) {
      setErr(e.response?.data?.message || e.message || 'Erro ao alterar senha');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: 700 }}>Meu Perfil</Typography>
      <Card>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant={isMobile ? 'fullWidth' : 'standard'}
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab label="Perfil" value="perfil" />
          <Tab label="Configurações" value="config" />
        </Tabs>
        <Divider />
        <CardContent>
          {tab === 'perfil' && (
            <Stack spacing={2} maxWidth={520}>
              <TextField
                label="Nome"
                value={form.nome || ''}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                fullWidth
              />
              <TextField
                label="Email"
                type="email"
                value={form.email || ''}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                fullWidth
              />
              <Button variant="contained" onClick={handleUpdateProfile} disabled={loading}>
                Salvar alterações
              </Button>
            </Stack>
          )}

          {tab === 'config' && (
            <Stack spacing={2} maxWidth={520}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>Alterar senha</Typography>
              <TextField
                label="Senha atual"
                type="password"
                value={pwd.senhaAtual}
                onChange={(e) => setPwd({ ...pwd, senhaAtual: e.target.value })}
                fullWidth
              />
              <TextField
                label="Nova senha"
                type="password"
                value={pwd.novaSenha}
                onChange={(e) => setPwd({ ...pwd, novaSenha: e.target.value })}
                helperText="Mínimo de 6 caracteres"
                fullWidth
              />
              <Button variant="contained" color="primary" onClick={handleChangePassword} disabled={loading}>
                Alterar senha
              </Button>
            </Stack>
          )}
        </CardContent>
      </Card>

      {(msg || err) && (
        <Snackbar open autoHideDuration={4000} onClose={() => { setMsg(null); setErr(null); }}>
          {msg ? (
            <Alert severity="success" sx={{ width: '100%' }}>{msg}</Alert>
          ) : (
            <Alert severity="error" sx={{ width: '100%' }}>{err}</Alert>
          )}
        </Snackbar>
      )}
    </Box>
  );
};

export default Perfil;