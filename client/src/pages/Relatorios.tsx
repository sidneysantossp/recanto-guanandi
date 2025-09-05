import React, { useMemo, useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Stack,
  Skeleton,
  Button,
  // Grid, // removido para evitar conflito com o import default abaixo
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { apiService } from '../services/api';
import { RelatorioFinanceiro, User } from '../types';
import { formatCurrency } from '../utils/theme';
import { Tabs, Tab } from '@mui/material';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';

// Tipos auxiliares (a API já responde, mas tipamos localmente para melhor DX)
interface InadimplenciaResumo {
  totalProprietariosInadimplentes: number;
  valorTotalInadimplencia: string; // número em string
  totalBoletosVencidos: number;
  ticketMedio: string; // número em string
}
interface InadimplenciaDetalhe {
  proprietario: User;
  boletos: any[];
  valorTotal: string; // número em string
  quantidadeBoletos: number;
  diasAtraso: number;
  vencimentoMaisAntigo: string | Date | null;
}
interface InadimplenciaResponse {
  resumo: InadimplenciaResumo;
  detalhes: InadimplenciaDetalhe[];
}

interface ArrecadacaoDetalhe {
  periodo: string; // e.g. 2025-01
  valor: number;
  quantidade: number;
  porCategoria: Record<string, { valor: number; quantidade: number }>;
}
interface ArrecadacaoResponse {
  periodo: { inicio: string | Date; fim: string | Date; agrupamento: 'dia' | 'mes' | 'ano' };
  resumo: { valorTotal: string; quantidadeTotal: number; ticketMedio: string };
  detalhes: ArrecadacaoDetalhe[];
}

function SectionTitle({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
      <Typography variant="h6" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>{title}</Typography>
      {action}
    </Stack>
  );
}

const Relatorios: React.FC = () => {
  const [tab, setTab] = useState(0);

  // Filtros - Financeiro (mês/ano)
  const [financeMonth, setFinanceMonth] = useState<Dayjs>(dayjs());

  // Filtros - Arrecadação (período e agrupamento)
  const [startDate, setStartDate] = useState<Dayjs>(dayjs().subtract(11, 'month'));
  const [endDate, setEndDate] = useState<Dayjs>(dayjs());
  const [groupBy, setGroupBy] = useState<'dia' | 'mes' | 'ano'>('mes');

  // Financeiro
  const { data: finResp, isLoading: finLoading, isError: finError, refetch: refetchFinancial } = useQuery({
    queryKey: ['financialReport', financeMonth.year(), financeMonth.month()],
    queryFn: async () => {
      const filters = { mes: financeMonth.month() + 1, ano: financeMonth.year() };
      const res = await apiService.getFinancialReport(filters);
      return res.data as RelatorioFinanceiro | undefined;
    },
  });
  const financial = finResp;

  // Inadimplência
  const { data: inaResp, isLoading: inaLoading, isError: inaError, refetch: refetchIna } = useQuery({
    queryKey: ['delinquencyReport'],
    queryFn: async () => {
      const res = await apiService.getDelinquencyReport();
      return res.data as InadimplenciaResponse | undefined;
    },
  });
  const inadimplencia = inaResp;

  // Arrecadação
  const { data: arrResp, isLoading: arrLoading, isError: arrError, refetch: refetchArr } = useQuery({
    queryKey: ['collectionReport', startDate.toISOString(), endDate.toISOString(), groupBy],
    queryFn: async () => {
      const filters = {
        dataInicio: startDate.startOf('day').toISOString(),
        dataFim: endDate.endOf('day').toISOString(),
        agrupamento: groupBy,
      };
      const res = await apiService.getCollectionReport(filters);
      return res.data as ArrecadacaoResponse | undefined;
    },
  });
  const arrecadacao = arrResp;

  const categoriasData = useMemo(() => {
    if (!financial?.porCategoria) return [] as { name: string; emitido: number; arrecadado: number }[];
    return Object.entries(financial.porCategoria).map(([cat, vals]) => ({
      name: cat,
      emitido: Number(vals.emitido?.toFixed ? vals.emitido.toFixed(2) : vals.emitido),
      arrecadado: Number(vals.arrecadado?.toFixed ? vals.arrecadado.toFixed(2) : vals.arrecadado || 0),
    }));
  }, [financial?.porCategoria]);

  const arrecadacaoChartData = useMemo(() => {
    return (arrecadacao?.detalhes || []).map((d) => ({ periodo: d.periodo, valor: d.valor, quantidade: d.quantidade }));
  }, [arrecadacao?.detalhes]);

  return (
    <Box p={2}>
      <Typography variant="h5" fontWeight={700} sx={{ mb: 2 }}>Relatórios</Typography>

      <Card>
        <CardContent>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
            <Tab label="Financeiro" />
            <Tab label="Inadimplência" />
            <Tab label="Arrecadação" />
          </Tabs>

          {/* FINANCEIRO */}
          {tab === 0 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <DatePicker
                    label="Mês/ano"
                    views={['year', 'month']}
                    value={financeMonth}
                    onChange={(val) => val && setFinanceMonth(val)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button fullWidth variant="contained" onClick={() => refetchFinancial()}>Atualizar</Button>
                </Grid>
              </Grid>

              {finError ? (
                <Typography color="error">Não foi possível carregar o relatório financeiro.</Typography>
              ) : (
                <>
                  <Grid container spacing={2}>
                    {(finLoading ? Array.from({ length: 4 }) : [
                      { title: 'Total Emitido', value: financial?.resumo?.valorTotalEmitido },
                      { title: 'Total Arrecadado', value: financial?.resumo?.valorTotalArrecadado },
                      { title: 'Em Aberto', value: financial?.resumo?.valorEmAberto },
                      { title: 'Vencido', value: financial?.resumo?.valorVencido },
                    ]).map((item: any, idx: number) => (
                      <Grid size={{ xs: 12, sm: 6, md: 3 }} key={`fin-card-${idx}`}>
                        <Card>
                          <CardContent>
                            {finLoading ? (
                              <>
                                <Skeleton width={120} />
                                <Skeleton height={36} />
                              </>
                            ) : (
                              <>
                                <Typography variant="body2" color="text.secondary">{item.title}</Typography>
                                <Typography variant="h5" fontWeight={700}>R$ {item.value}</Typography>
                              </>
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  <Grid container spacing={2} sx={{ mt: 0.5 }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <SectionTitle title="Por Categoria (Emitido x Arrecadado)" />
                          <Box sx={{ height: { xs: 260, sm: 320 } }}>
                            {finLoading ? (
                              <Skeleton variant="rectangular" height={320} />
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={categoriasData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip />
                                  <Legend />
                                  <Bar dataKey="emitido" name="Emitido" fill="#8884d8" />
                                  <Bar dataKey="arrecadado" name="Arrecadado" fill="#82ca9d" />
                                </BarChart>
                              </ResponsiveContainer>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                      <Card>
                        <CardContent>
                          <SectionTitle title="Distribuição de Status" />
                          <Box sx={{ height: { xs: 260, sm: 320 } }}>
                            {finLoading ? (
                              <Skeleton variant="rectangular" height={320} />
                            ) : (
                              <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                  <Pie data={[
                                    { name: 'Pagos', value: financial?.quantidades?.boletosPagos || 0, color: '#4caf50' },
                                    { name: 'Em Aberto', value: financial?.quantidades?.boletosEmAberto || 0, color: '#ff9800' },
                                    { name: 'Vencidos', value: financial?.quantidades?.boletosVencidos || 0, color: '#f44336' },
                                  ]} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                                    {['#4caf50', '#ff9800', '#f44336'].map((c, i) => (
                                      <Cell key={`cell-${i}`} fill={c} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </PieChart>
                              </ResponsiveContainer>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}
            </Box>
          )}

          {/* INADIMPLÊNCIA */}
          {tab === 1 && (
            <Box>
              <SectionTitle title="Resumo de Inadimplência" action={<Button onClick={() => refetchIna()}>Atualizar</Button>} />
              {inaError ? (
                <Typography color="error">Não foi possível carregar o relatório de inadimplência.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {(inaLoading ? Array.from({ length: 3 }) : [
                    { title: 'Proprietários Inadimplentes', value: inadimplencia?.resumo?.totalProprietariosInadimplentes },
                    { title: 'Valor Total', value: inadimplencia ? `R$ ${inadimplencia.resumo?.valorTotalInadimplencia}` : '-' },
                    { title: 'Boletos Vencidos', value: inadimplencia?.resumo?.totalBoletosVencidos },
                  ]).map((item: any, idx: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`ina-card-${idx}`}>
                      <Card>
                        <CardContent>
                          {inaLoading ? (
                            <>
                              <Skeleton width={160} />
                              <Skeleton height={36} />
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" color="text.secondary">{item.title}</Typography>
                              <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  {/* Tabela simplificada dos Top 10 */}
                  <Grid size={{ xs: 12 }}>
                    <Card>
                      <CardContent>
                        <SectionTitle title="Top 10 Maiores Devedores" />
                        {inaLoading ? (
                          <Skeleton variant="rectangular" height={240} />
                        ) : (
                          <Box sx={{ overflowX: 'auto' }}>
                            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'left', padding: '8px' }}>Proprietário</th>
                                  <th style={{ textAlign: 'right', padding: '8px' }}>Qtde Boletos</th>
                                  <th style={{ textAlign: 'right', padding: '8px' }}>Valor Total</th>
                                  <th style={{ textAlign: 'right', padding: '8px' }}>Dias Atraso</th>
                                </tr>
                              </thead>
                              <tbody>
                                {(inadimplencia?.detalhes || []).slice(0, 10).map((d, i) => (
                                  <tr key={i} style={{ borderTop: '1px solid #eee' }}>
                                    <td style={{ padding: '8px' }}>{d.proprietario?.nome}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{d.quantidadeBoletos}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{formatCurrency(parseFloat(d.valorTotal || '0'))}</td>
                                    <td style={{ padding: '8px', textAlign: 'right' }}>{d.diasAtraso}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </Box>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}

          {/* ARRECADAÇÃO */}
          {tab === 2 && (
            <Box>
              <Grid container spacing={2} sx={{ mb: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="Início"
                    value={startDate}
                    onChange={(v) => v && setStartDate(v)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <DatePicker
                    label="Fim"
                    value={endDate}
                    onChange={(v) => v && setEndDate(v)}
                    slotProps={{ textField: { fullWidth: true } }}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <FormControl fullWidth>
                    <InputLabel>Agrupar por</InputLabel>
                    <Select value={groupBy} label="Agrupar por" onChange={(e) => setGroupBy(e.target.value as any)}>
                      <MenuItem value="dia">Dia</MenuItem>
                      <MenuItem value="mes">Mês</MenuItem>
                      <MenuItem value="ano">Ano</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <Button fullWidth variant="contained" onClick={() => refetchArr()}>Atualizar</Button>
                </Grid>
              </Grid>

              {arrError ? (
                <Typography color="error">Não foi possível carregar o relatório de arrecadação.</Typography>
              ) : (
                <Grid container spacing={2}>
                  {(arrLoading ? Array.from({ length: 3 }) : [
                    { title: 'Valor Total', value: arrecadacao ? `R$ ${arrecadacao.resumo?.valorTotal}` : '-' },
                    { title: 'Qtd Pagamentos', value: arrecadacao?.resumo?.quantidadeTotal },
                    { title: 'Ticket Médio', value: arrecadacao ? `R$ ${arrecadacao.resumo?.ticketMedio}` : '-' },
                  ]).map((item: any, idx: number) => (
                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={`arr-card-${idx}`}>
                      <Card>
                        <CardContent>
                          {arrLoading ? (
                            <>
                              <Skeleton width={160} />
                              <Skeleton height={36} />
                            </>
                          ) : (
                            <>
                              <Typography variant="body2" color="text.secondary">{item.title}</Typography>
                              <Typography variant="h5" fontWeight={700}>{item.value}</Typography>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}

                  <Grid size={{ xs: 12 }}>
                    <Card>
                      <CardContent>
                        <SectionTitle title="Arrecadação no Período" />
                        <Box sx={{ height: { xs: 260, sm: 320 } }}>
                          {arrLoading ? (
                            <Skeleton variant="rectangular" height={320} />
                          ) : (
                            <ResponsiveContainer width="100%" height="100%">
                              <LineChart data={arrecadacaoChartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="periodo" />
                                <YAxis />
                                <Tooltip />
                                <Line type="monotone" dataKey="valor" stroke="#8884d8" strokeWidth={2} dot={false} />
                              </LineChart>
                            </ResponsiveContainer>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default Relatorios;