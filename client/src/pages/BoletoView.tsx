import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Alert,
  CircularProgress,
  IconButton,
  Paper,
  Grid,
} from '@mui/material';
import {
  ArrowBack,
  Edit,
  Payment,
  Print,
  ContentCopy,
  QrCode,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Boleto } from '../types';
import { formatCurrency, formatDate } from '../utils/theme';

const BoletoView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  
  const [boleto, setBoleto] = useState<Boleto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) {
      loadBoleto();
    }
  }, [id]);

  const loadBoleto = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBoletoById(id!);
      if (response.success && response.data) {
        setBoleto(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao carregar boleto');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pago': return 'success';
      case 'pendente': return 'warning';
      case 'vencido': return 'error';
      case 'cancelado': return 'default';
      default: return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pago': return 'Pago';
      case 'pendente': return 'Pendente';
      case 'vencido': return 'Vencido';
      case 'cancelado': return 'Cancelado';
      default: return status;
    }
  };

  const getCategoriaLabel = (categoria: string) => {
    switch (categoria) {
      case 'taxa_condominio': return 'Taxa de Condomínio';
      case 'taxa_extra': return 'Taxa Extra';
      case 'multa': return 'Multa';
      case 'obra': return 'Obra';
      case 'manutencao': return 'Manutenção';
      case 'outros': return 'Outros';
      default: return categoria;
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!boleto) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">Boleto não encontrado</Alert>
        <Button onClick={() => navigate('/boletos')} sx={{ mt: 2 }}>
          Voltar para Boletos
        </Button>
      </Box>
    );
  }

  const valorTotal = boleto.valor + (boleto.valorJuros || 0) + (boleto.valorMulta || 0) - (boleto.valorDesconto || 0);

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/boletos')} sx={{ mr: 2 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
            Boleto #{boleto.numeroDocumento}
          </Typography>
          <Typography variant="body1" sx={{ color: 'text.secondary', mt: 0.5 }}>
            {boleto.descricao}
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          {boleto.status !== 'pago' && (
            <Button
              variant="contained"
              startIcon={<QrCode />}
              onClick={() => navigate(`/pix?boleto=${boleto._id}`)}
              sx={{ mr: 1 }}
            >
              Gerar PIX
            </Button>
          )}
          <Button
            variant="outlined"
            startIcon={<Print />}
            onClick={() => window.print()}
          >
            Imprimir
          </Button>
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Informações Principais */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Informações do Boleto
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Número do Documento
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 600 }}>
                    {boleto.numeroDocumento}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Status
                  </Typography>
                  <Chip
                    label={getStatusLabel(boleto.status)}
                    color={getStatusColor(boleto.status) as any}
                    size="small"
                    sx={{ mt: 0.5 }}
                  />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Categoria
                  </Typography>
                  <Typography variant="body1">
                    {getCategoriaLabel(boleto.categoria)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Tipo de Pagamento
                  </Typography>
                  <Typography variant="body1" sx={{ textTransform: 'capitalize' }}>
                    {boleto.tipoPagamento}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Emissão
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(boleto.dataEmissao)}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="body2" color="text.secondary">
                    Data de Vencimento
                  </Typography>
                  <Typography
                    variant="body1"
                    sx={{
                      color: boleto.status === 'vencido' ? 'error.main' : 'text.primary',
                      fontWeight: boleto.status === 'vencido' ? 600 : 400,
                    }}
                  >
                    {formatDate(boleto.dataVencimento)}
                  </Typography>
                </Grid>

                {boleto.dataPagamento && (
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Typography variant="body2" color="text.secondary">
                      Data de Pagamento
                    </Typography>
                    <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 600 }}>
                      {formatDate(boleto.dataPagamento)}
                    </Typography>
                  </Grid>
                )}

                {boleto.observacoes && (
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary">
                      Observações
                    </Typography>
                    <Typography variant="body1">
                      {boleto.observacoes}
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Informações do Proprietário */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Proprietário
              </Typography>

              <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
                {boleto.proprietario.nome}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                {boleto.proprietario.email}
              </Typography>

              {boleto.proprietario.cpf && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  CPF: {boleto.proprietario.cpf}
                </Typography>
              )}

              {boleto.proprietario.telefone && (
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Telefone: {boleto.proprietario.telefone}
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Valores */}
        <Grid size={{ xs: 12 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Valores
              </Typography>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 3 }}>
                  <Typography variant="body2" color="text.secondary">
                    Valor Principal
                  </Typography>
                  <Typography variant="h6" sx={{ color: 'primary.main' }}>
                    {formatCurrency(boleto.valor)}
                  </Typography>
                </Grid>

                {boleto.valorJuros && boleto.valorJuros > 0 && (
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Juros
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'warning.main' }}>
                      {formatCurrency(boleto.valorJuros)}
                    </Typography>
                  </Grid>
                )}

                {boleto.valorMulta && boleto.valorMulta > 0 && (
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Multa
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'error.main' }}>
                      {formatCurrency(boleto.valorMulta)}
                    </Typography>
                  </Grid>
                )}

                {boleto.valorDesconto && boleto.valorDesconto > 0 && (
                  <Grid size={{ xs: 12, sm: 3 }}>
                    <Typography variant="body2" color="text.secondary">
                      Desconto
                    </Typography>
                    <Typography variant="h6" sx={{ color: 'success.main' }}>
                      -{formatCurrency(boleto.valorDesconto)}
                    </Typography>
                  </Grid>
                )}

                <Grid size={{ xs: 12 }}>
                  <Box
                    sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      mt: 2,
                      pt: 2,
                      borderTop: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="h5" sx={{ fontWeight: 700 }}>
                      Valor Total
                    </Typography>
                    <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main' }}>
                      {formatCurrency(valorTotal)}
                    </Typography>
                  </Box>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Códigos de Pagamento */}
        {(boleto.codigoBarras || boleto.linhaDigitavel || boleto.chavePix) && (
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Códigos de Pagamento
                </Typography>

                {boleto.linhaDigitavel && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Linha Digitável
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                        {boleto.linhaDigitavel}
                      </Typography>
                      <IconButton onClick={() => copyToClipboard(boleto.linhaDigitavel!)}>
                        <ContentCopy />
                      </IconButton>
                    </Paper>
                  </Box>
                )}

                {boleto.codigoBarras && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Código de Barras
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                        {boleto.codigoBarras}
                      </Typography>
                      <IconButton onClick={() => copyToClipboard(boleto.codigoBarras!)}>
                        <ContentCopy />
                      </IconButton>
                    </Paper>
                  </Box>
                )}

                {boleto.chavePix && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Chave PIX
                    </Typography>
                    <Paper sx={{ p: 2, bgcolor: 'grey.50', display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', flexGrow: 1 }}>
                        {boleto.chavePix}
                      </Typography>
                      <IconButton onClick={() => copyToClipboard(boleto.chavePix!)}>
                        <ContentCopy />
                      </IconButton>
                    </Paper>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default BoletoView;