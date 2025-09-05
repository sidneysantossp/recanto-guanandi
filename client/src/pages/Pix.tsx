import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
  Grid,
  Divider,
  Tabs,
  Tab,
} from '@mui/material';
import {
  QrCode,
  ContentCopy,
  Refresh,
  Search,
  Payment,
  CheckCircle,
  Schedule,
  Cancel,
  Receipt,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { apiService } from '../services/api';
import { Boleto } from '../types';
import { formatCurrency, formatDate } from '../utils/theme';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

interface PixData {
  chavePix: string;
  qrCode: string;
  codigoPix: string;
  valor: number;
  vencimento: Date;
  txid: string;
  status?: 'PENDENTE' | 'PAGO' | 'EXPIRADO';
  dataPagamento?: Date;
  boletoId?: string;
}

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
      id={`pix-tabpanel-${index}`}
      aria-labelledby={`pix-tab-${index}`}
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

const Pix: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [tabValue, setTabValue] = useState(0);
  const [boletos, setBoletos] = useState<Boleto[]>([]);
  const [pixTransactions, setPixTransactions] = useState<PixData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoleto, setSelectedBoleto] = useState<Boleto | null>(null);
  const [pixData, setPixData] = useState<PixData | null>(null);
  const [generatePixDialog, setGeneratePixDialog] = useState(false);
  const [qrCodeDialog, setQrCodeDialog] = useState(false);

  useEffect(() => {
    loadBoletos();
    loadPixTransactions();
  }, []);

  useEffect(() => {
    // Verificar se há um boleto pré-selecionado na URL
    const boletoId = searchParams.get('boleto');
    if (boletoId && boletos.length > 0) {
      const boleto = boletos.find(b => b._id === boletoId);
      if (boleto && boleto.status !== 'pago') {
        setSelectedBoleto(boleto);
        setTabValue(0); // Ir para a aba de geração de PIX
      }
    }
  }, [searchParams, boletos]);

  const loadBoletos = async () => {
    try {
      setLoading(true);
      const response = await apiService.getBoletos(1, 100, { status: 'pendente,vencido' });
      setBoletos(response.data);
    } catch (error) {
      console.error('Erro ao carregar boletos:', error);
      setError('Erro ao carregar boletos');
    } finally {
      setLoading(false);
    }
  };

  const loadPixTransactions = async () => {
    // Simular carregamento de transações PIX
    // Em uma implementação real, isso viria de uma API
    const mockTransactions: PixData[] = [
      {
        chavePix: 'pix@guanandi.com.br',
        qrCode: 'data:image/png;base64,mock',
        codigoPix: '00020126580014BR.GOV.BCB.PIX0136pix@guanandi.com.br5204000053039865802BR5913GUANANDI COND6009SAO PAULO62070503***6304',
        valor: 150.00,
        vencimento: new Date(Date.now() + 24 * 60 * 60 * 1000),
        txid: 'GUANANDI1234567890',
        status: 'PENDENTE',
        boletoId: '1'
      }
    ];
    setPixTransactions(mockTransactions);
  };

  const handleGeneratePix = async (boleto: Boleto) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.generatePix(boleto._id);
      
      if (response.success) {
        setPixData(response.data);
        setQrCodeDialog(true);
        setSuccess('PIX gerado com sucesso!');
        loadPixTransactions();
      } else {
        setError(response.message || 'Erro ao gerar PIX');
      }
    } catch (error) {
      console.error('Erro ao gerar PIX:', error);
      setError('Erro ao gerar PIX');
    } finally {
      setLoading(false);
    }
  };

  const handleSimulatePayment = async (boletoId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.simulatePixPayment(boletoId);
      
      if (response.success) {
        setSuccess('Pagamento PIX simulado com sucesso! O boleto será atualizado em breve.');
        
        // Recarregar dados após um pequeno delay
        setTimeout(() => {
          loadBoletos();
          loadPixTransactions();
        }, 2000);
      } else {
        setError(response.message || 'Erro ao simular pagamento');
      }
    } catch (error: any) {
      console.error('Erro ao simular pagamento:', error);
      setError(error.response?.data?.message || 'Erro ao simular pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPixStatus = async (txid: string) => {
    try {
      setLoading(true);
      const response = await apiService.getPixStatus(txid);
      
      if (response.success) {
        // Atualizar status da transação
        setPixTransactions(prev => 
          prev.map(pix => 
            pix.txid === txid 
              ? { ...pix, status: response.data.status, dataPagamento: response.data.dataPagamento }
              : pix
          )
        );
        
        if (response.data.status === 'PAGO') {
          setSuccess('Pagamento confirmado!');
        }
      }
    } catch (error) {
      console.error('Erro ao verificar status PIX:', error);
      setError('Erro ao verificar status do PIX');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setSuccess('Código copiado para a área de transferência!');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAGO':
        return 'success';
      case 'PENDENTE':
        return 'warning';
      case 'EXPIRADO':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PAGO':
        return <CheckCircle />;
      case 'PENDENTE':
        return <Schedule />;
      case 'EXPIRADO':
        return <Cancel />;
      default:
        return <Schedule />;
    }
  };

  const filteredBoletos = boletos.filter(boleto =>
    boleto.proprietario?.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    boleto.descricao?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredPixTransactions = pixTransactions.filter(pix =>
    pix.txid.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 600 }}>
        Gerenciamento PIX
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

      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label="Gerar PIX" />
            <Tab label="Transações PIX" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Gerar PIX para Boletos
            </Typography>
            <TextField
              fullWidth
              placeholder="Buscar por proprietário ou descrição..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Proprietário</TableCell>
                    <TableCell>Descrição</TableCell>
                    <TableCell>Valor</TableCell>
                    <TableCell>Vencimento</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="center">Ações</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredBoletos.map((boleto) => (
                    <TableRow key={boleto._id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {boleto.proprietario?.nome}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {boleto.proprietario?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>{boleto.descricao}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {formatCurrency(boleto.valor)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(boleto.dataVencimento)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={boleto.status}
                          color={boleto.status === 'vencido' ? 'error' : 'warning'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          onClick={() => handleGeneratePix(boleto)}
                          color="primary"
                          disabled={loading}
                          title="Gerar PIX"
                        >
                          <QrCode />
                        </IconButton>
                        <IconButton
                          onClick={() => handleSimulatePayment(boleto._id)}
                          color="success"
                          disabled={loading}
                          title="Simular Pagamento"
                        >
                          <Payment />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredBoletos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        <Typography color="text.secondary">
                          Nenhum boleto encontrado
                        </Typography>
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Transações PIX
            </Typography>
            <TextField
              fullWidth
              placeholder="Buscar por TXID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ mb: 2 }}
            />
          </Box>

          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>TXID</TableCell>
                  <TableCell>Valor</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Vencimento</TableCell>
                  <TableCell>Data Pagamento</TableCell>
                  <TableCell align="center">Ações</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredPixTransactions.map((pix) => (
                  <TableRow key={pix.txid}>
                    <TableCell>
                      <Typography variant="body2" fontFamily="monospace">
                        {pix.txid}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {formatCurrency(pix.valor)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={getStatusIcon(pix.status || 'PENDENTE')}
                        label={pix.status || 'PENDENTE'}
                        color={getStatusColor(pix.status || 'PENDENTE')}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(pix.vencimento)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {pix.dataPagamento ? formatDate(pix.dataPagamento) : '-'}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        onClick={() => handleCheckPixStatus(pix.txid)}
                        color="primary"
                        disabled={loading}
                        title="Verificar Status"
                      >
                        <Refresh />
                      </IconButton>
                      <IconButton
                        onClick={() => {
                          setPixData(pix);
                          setQrCodeDialog(true);
                        }}
                        color="primary"
                        title="Ver QR Code"
                      >
                        <QrCode />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPixTransactions.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography color="text.secondary">
                        Nenhuma transação PIX encontrada
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>
      </Card>

      {/* Dialog QR Code */}
      <Dialog
        open={qrCodeDialog}
        onClose={() => setQrCodeDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <QrCode color="primary" />
            PIX - QR Code
          </Box>
        </DialogTitle>
        <DialogContent>
          {pixData && (
            <Box sx={{ textAlign: 'center' }}>
              <Box sx={{ mb: 3 }}>
                <img
                  src={pixData.qrCode}
                  alt="QR Code PIX"
                  style={{
                    width: '200px',
                    height: '200px',
                    border: '1px solid #ddd',
                    borderRadius: '8px'
                  }}
                />
              </Box>
              
              <Grid container spacing={2}>
                <Grid size={{ xs: 12 }}>
                  <Typography variant="h6" gutterBottom>
                    Valor: {formatCurrency(pixData.valor)}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Chave PIX:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ flex: 1, fontFamily: 'monospace' }}>
                      {pixData.chavePix}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => copyToClipboard(pixData.chavePix)}
                    >
                      <ContentCopy fontSize="small" />
                    </IconButton>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Código PIX (Copia e Cola):
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      value={pixData.codigoPix}
                      InputProps={{
                        readOnly: true,
                        style: { fontFamily: 'monospace', fontSize: '0.8rem' }
                      }}
                      variant="outlined"
                      size="small"
                    />
                    <IconButton
                      onClick={() => copyToClipboard(pixData.codigoPix)}
                    >
                      <ContentCopy />
                    </IconButton>
                  </Box>
                </Grid>
                
                <Grid size={{ xs: 12 }}>
                  <Typography variant="body2" color="text.secondary">
                    TXID: {pixData.txid}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Válido até: {formatDate(pixData.vencimento)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setQrCodeDialog(false)}>Fechar</Button>
          {pixData && (
            <Button
              variant="contained"
              onClick={() => copyToClipboard(pixData.codigoPix)}
              startIcon={<ContentCopy />}
            >
              Copiar Código
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Pix;