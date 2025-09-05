import React from 'react';
import { Box, Card, CardContent, Typography, Stack, Skeleton, useTheme, Chip } from '@mui/material';
import Grid from '@mui/material/Grid';
import { useQuery } from '@tanstack/react-query';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { apiService } from '../services/api';
import { DashboardStats } from '../types';
import { statusColors, formatCurrency } from '../utils/theme';
import { useAuth } from '../contexts/AuthContext';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';

const StatCard: React.FC<{ title: string; value: string | number | undefined; subtitle?: string; icon?: React.ReactNode; color?: string }> = ({ title, value, subtitle, icon, color }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <Stack 
          direction={{ xs: 'column', sm: 'row' }} 
          alignItems={{ xs: 'flex-start', sm: 'center' }} 
          justifyContent="space-between" 
          spacing={2}
          sx={{ height: '100%' }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography 
              variant="body2" 
              color="text.secondary"
              sx={{ 
                fontSize: { xs: '0.75rem', sm: '0.875rem' },
                mb: 0.5
              }}
            >
              {title}
            </Typography>
            <Typography 
              variant="h4" 
              fontWeight={700} 
              sx={{ 
                mt: 0.5,
                fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
                lineHeight: 1.2,
                wordBreak: 'break-word'
              }}
            >
              {value ?? '-'}
            </Typography>
            {subtitle && (
              <Typography 
                variant="caption" 
                color="text.secondary"
                sx={{ 
                  fontSize: { xs: '0.7rem', sm: '0.75rem' },
                  display: 'block',
                  mt: 0.5,
                  wordBreak: 'break-word'
                }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          {icon && (
            <Box sx={{ 
              p: { xs: 1, sm: 1.25 }, 
              borderRadius: 2, 
              bgcolor: (theme) => color || theme.palette.grey[100], 
              color: '#fff', 
              display: 'flex',
              alignSelf: { xs: 'flex-end', sm: 'center' },
              flexShrink: 0
            }}>
              {icon}
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.tipo === 'admin';

  // Espaçamentos: aplicar padrão confortável para ambos perfis
  const sectionSpacing = 3; // cards e gráficos
  const chartsTopMargin = 3; // distância entre cards e gráficos
  const chartHeaderMarginBottom = 1.5; // espaço abaixo do título do gráfico

  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboardStats'],
    queryFn: () => apiService.getDashboardStats(),
  });

  const stats: DashboardStats | undefined = data?.data;

  const boletosStatusData = [
    { name: 'Pagos', value: stats?.boletos.pagos ?? 0, color: statusColors.paid },
    { name: 'Pendentes', value: stats?.boletos.pendentes ?? 0, color: statusColors.pending },
    { name: 'Vencidos', value: stats?.boletos.vencidos ?? 0, color: statusColors.overdue },
  ];

  const mensalData = (stats?.graficos?.mensal || []).map((m) => ({
    mes: m.mes,
    emitido: m.emitido,
    arrecadado: m.arrecadado,
  }));

  const usuariosSituacaoData = [
    { name: 'Ativos', value: stats?.usuarios?.ativos ?? 0, color: statusColors.active },
    { name: 'Inadimplentes', value: stats?.usuarios?.inadimplentes ?? 0, color: statusColors.delinquent },
    { name: 'Inativos', value: stats?.usuarios?.inativos ?? 0, color: statusColors.inactive },
  ];

  const notificacoesStatusData = [
    { name: 'Publicadas', value: stats?.notificacoes?.publicadas ?? 0, color: theme.palette.info.main },
    { name: 'Rascunhos', value: stats?.notificacoes?.rascunhos ?? 0, color: theme.palette.warning.main },
    { name: 'Arquivadas', value: stats?.notificacoes?.arquivadas ?? 0, color: theme.palette.grey[500] },
  ];

  if (isError) {
    return (
      <Box p={2}>
        <Typography color="error">Não foi possível carregar os dados do dashboard.</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ px: 2, pt: 1, pb: 2 }}>
      {/* Cards principais */}
      <Grid container spacing={sectionSpacing}>
        {isLoading ? (
          Array.from({ length: 4 }).map((_, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }} key={`skeleton-${idx}`}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Skeleton variant="text" width={100} height={24} />
                  <Skeleton variant="text" width={160} height={36} />
                  <Skeleton variant="rectangular" height={24} sx={{ mt: 1 }} />
                </CardContent>
              </Card>
            </Grid>
          ))
        ) : (
          <>
            {isAdmin ? (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Usuários Ativos"
                    value={stats?.usuarios?.ativos}
                    subtitle={`de ${stats?.usuarios?.total ?? 0} usuários`}
                    icon={<PeopleIcon />}
                    color={statusColors.active}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Inadimplentes"
                    value={stats?.usuarios?.inadimplentes}
                    subtitle={`${stats?.usuarios?.percentualAtivos ?? '-'}% ativos`}
                    icon={<PeopleIcon />}
                    color={statusColors.delinquent}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Boletos Pendentes"
                    value={stats?.boletos.pendentes}
                    subtitle={`Total: ${stats?.boletos.total ?? 0}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.pending}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Taxa de Adimplência"
                    value={stats?.boletos.taxaAdimplencia}
                    subtitle={`Em aberto: ${typeof stats?.boletos.valorEmAberto === 'number' ? formatCurrency(stats?.boletos.valorEmAberto) : stats?.boletos.valorEmAberto ?? '-'}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.paid}
                  />
                </Grid>
              </>
            ) : (
              <>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Pendentes"
                    value={stats?.boletos.pendentes}
                    subtitle={`Total: ${stats?.boletos.total ?? 0}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.pending}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Vencidos"
                    value={stats?.boletos.vencidos}
                    subtitle={`Pagos: ${stats?.boletos.pagos ?? 0}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.overdue}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Em Aberto"
                    value={typeof stats?.boletos.valorEmAberto === 'number' ? formatCurrency(stats?.boletos.valorEmAberto) : stats?.boletos.valorEmAberto}
                    subtitle={`Vencido: ${typeof stats?.boletos.valorVencido === 'number' ? formatCurrency(stats?.boletos.valorVencido) : stats?.boletos.valorVencido ?? '-'}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.cancelled}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 6, lg: 3, xl: 3 }}>
                  <StatCard
                    title="Arrecadado (Mês)"
                    value={typeof stats?.boletos.valorArrecadadoMes === 'number' ? formatCurrency(stats?.boletos.valorArrecadadoMes) : stats?.boletos.valorArrecadadoMes}
                    subtitle={`Taxa Arrec.: ${stats?.boletos.taxaArrecadacao ?? '-'}`}
                    icon={<ReceiptLongIcon />}
                    color={statusColors.paid}
                  />
                </Grid>
              </>
            )}
          </>
        )}
      </Grid>

      {/* Gráficos */}
      <Grid container spacing={sectionSpacing} sx={{ mt: chartsTopMargin }}>
        <Grid size={{ xs: 12, lg: 6, xl: 6 }}>
           <Card>
             <CardContent>
              <Stack 
                direction={{ xs: 'column', sm: 'row' }} 
                alignItems={{ xs: 'flex-start', sm: 'center' }} 
                justifyContent="space-between" 
                spacing={{ xs: 1, sm: 0 }}
                sx={{ mb: chartHeaderMarginBottom }}
              >
                <Typography 
                  variant="h6"
                  sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}
                >
                  Boletos por Status
                </Typography>
                {!isLoading && (
                  <Chip 
                    size="small" 
                    label={`Total: ${stats?.boletos.total ?? 0}`}
                    sx={{ 
                      fontSize: { xs: '0.7rem', sm: '0.75rem' },
                      alignSelf: { xs: 'flex-start', sm: 'center' }
                    }}
                  />
                )}
              </Stack>
              <Box sx={{ height: { xs: 250, sm: 300 } }}>
                {isLoading ? (
                  <Skeleton variant="rectangular" height={300} />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={boletosStatusData} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={4}>
                        {boletosStatusData.map((entry, index) => (
                          <Cell key={`cell-boleto-${index}`} fill={entry.color} />
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

        {isAdmin ? (
          <Grid size={{ xs: 12, lg: 6, xl: 6 }}>
             <Card>
               <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: chartHeaderMarginBottom,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Usuários por Situação
                </Typography>
                <Box sx={{ height: { xs: 250, sm: 300 } }}>
                  {isLoading ? (
                    <Skeleton variant="rectangular" height={300} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={usuariosSituacaoData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                          {usuariosSituacaoData.map((entry, index) => (
                            <Cell key={`cell-user-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          <Grid size={{ xs: 12, lg: 6, xl: 6 }}>
             <Card>
               <CardContent>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    mb: chartHeaderMarginBottom,
                    fontSize: { xs: '1rem', sm: '1.25rem' }
                  }}
                >
                  Últimos Meses (Emitido x Arrecadado)
                </Typography>
                <Box sx={{ height: { xs: 250, sm: 300 } }}>
                  {isLoading ? (
                    <Skeleton variant="rectangular" height={300} />
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mensalData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="mes" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="emitido" name="Emitido" fill={theme.palette.info.main} radius={[6,6,0,0]} />
                        <Bar dataKey="arrecadado" name="Arrecadado" fill={theme.palette.success.main} radius={[6,6,0,0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}

        {isAdmin && (
          <Grid size={12}>
             <Card>
               <CardContent>
                 <Typography 
                   variant="h6" 
                   sx={{ 
                     mb: chartHeaderMarginBottom,
                     fontSize: { xs: '1rem', sm: '1.25rem' }
                   }}
                 >
                   Notificações
                 </Typography>
                 <Box sx={{ height: { xs: 220, sm: 260 } }}>
                   {isLoading ? (
                     <Skeleton variant="rectangular" height={260} />
                   ) : (
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={notificacoesStatusData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="name" />
                         <YAxis allowDecimals={false} />
                         <Tooltip />
                         <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                           {notificacoesStatusData.map((entry, index) => (
                             <Cell key={`cell-not-${index}`} fill={entry.color} />
                           ))}
                         </Bar>
                       </BarChart>
                     </ResponsiveContainer>
                   )}
                 </Box>
               </CardContent>
             </Card>
           </Grid>
         )}
      </Grid>
    </Box>
  );
};

export default Dashboard;

