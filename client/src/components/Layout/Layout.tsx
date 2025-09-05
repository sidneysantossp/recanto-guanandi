import React, { useState } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard,
  People,
  Receipt,
  Notifications,
  Assessment,
  AccountCircle,
  Logout,
  Settings,
  Payment,
  RequestQuote,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import Container from '@mui/material/Container';
import { useAuth } from '../../contexts/AuthContext';

const drawerWidth = 280;

interface LayoutProps {
  children: React.ReactNode;
}

interface MenuItemType {
  text: string;
  icon: React.ReactElement;
  path: string;
  adminOnly?: boolean;
}

const menuItems: MenuItemType[] = [
  { text: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
  { text: 'Proprietários', icon: <People />, path: '/usuarios', adminOnly: true },
  { text: 'Boletos', icon: <Receipt />, path: '/boletos' },
  { text: 'PIX', icon: <Payment />, path: '/pix' },
  { text: 'Notificações', icon: <Notifications />, path: '/notificacoes' },
  { text: 'Orçamentos', icon: <RequestQuote />, path: '/orcamentos' },
  { text: 'Relatórios', icon: <Assessment />, path: '/relatorios', adminOnly: true },
];

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
    handleMenuClose();
  };

  const handleProfile = () => {
    navigate('/perfil');
    handleMenuClose();
  };

  const filteredMenuItems = menuItems.filter(item => 
    !item.adminOnly || user?.tipo === 'admin'
  );

  // Normaliza o pathname atual removendo barras finais (ex.: "/dashboard/" -> "/dashboard")
  const normalizedPath = location.pathname.replace(/\/+$/, '');

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 3, textAlign: 'center' }}>
+        <Typography variant="h5" sx={{ color: 'white', fontWeight: 700 }}>
+          RECANTO DO GUANANDI
+        </Typography>
         <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5 }}>
           Associação dos Proprietários
         </Typography>
      </Box>
      
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
      
      <List sx={{ flex: 1, px: 1, py: 2 }}>
        {filteredMenuItems.map((item) => {
          const base = item.path.replace(/\/+$/, '');
          const isActive = normalizedPath === base || normalizedPath.startsWith(`${base}/`);
          return (
            <ListItemButton
              key={item.text}
              onClick={() => navigate(item.path)}
              selected={isActive}
              sx={{
                mb: 0.5,
                mx: 0.5,
                borderRadius: 1,
                color: 'white',
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                },
                '&.Mui-selected': {
                  backgroundColor: theme.palette.primary.main,
                  color: 'white',
                  '&:hover': {
                    backgroundColor: theme.palette.primary.dark,
                  },
                },
              }}
            >
              <>
                <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    fontSize: '0.9rem',
                    fontWeight: isActive ? 600 : 400,
                    color: 'white',
                  }}
                />
              </>
             </ListItemButton>
            );
          })}
        </List>
        
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.2)' }} />
        
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32, 
                mr: 1.5,
                bgcolor: theme.palette.primary.main,
                fontSize: '0.9rem'
              }}
            >
              {user?.nome?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: 'white', 
                  fontWeight: 500,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {user?.nome}
              </Typography>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'capitalize'
                }}
              >
                {user?.tipo}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ 
              mr: 2, 
              display: { md: 'none' },
              color: theme.palette.text.primary,
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.04)'
              }
            }}
          >
            <MenuIcon sx={{ color: theme.palette.text.primary }} />
          </IconButton>
          
          <Box sx={{ flexGrow: 1 }} />
          
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenuClick}
            color="inherit"
          >
            <Avatar 
              sx={{ 
                width: 32, 
                height: 32,
                bgcolor: theme.palette.primary.main 
              }}
            >
              {user?.nome?.charAt(0).toUpperCase()}
            </Avatar>
          </IconButton>
          <Typography
            variant="body2"
            sx={{
              ml: 1,
              color: theme.palette.text.primary,
              fontWeight: 500,
              display: { xs: 'none', sm: 'block' },
              maxWidth: 160,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              textTransform: 'capitalize',
            }}
            title={user?.nome || ''}
          >
            {user?.nome}
          </Typography>
          
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleMenuClose}
            PaperProps={{
              sx: {
                mt: 1,
                minWidth: 200,
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }
            }}
          >
            <MenuItem 
              onClick={handleProfile}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 53, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Meu Perfil"
                primaryTypographyProps={{
                  color: theme.palette.text.primary,
                  fontWeight: 500
                }}
              />
            </MenuItem>
            <MenuItem 
              onClick={() => navigate('/configuracoes')}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(255, 107, 53, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.text.primary }}>
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Configurações"
                primaryTypographyProps={{
                  color: theme.palette.text.primary,
                  fontWeight: 500
                }}
              />
            </MenuItem>
            <Divider sx={{ my: 1 }} />
            <MenuItem 
              onClick={handleLogout}
              sx={{
                py: 1.5,
                '&:hover': {
                  backgroundColor: 'rgba(220, 53, 69, 0.08)'
                }
              }}
            >
              <ListItemIcon sx={{ color: theme.palette.error.main }}>
                <Logout fontSize="small" />
              </ListItemIcon>
              <ListItemText 
                primary="Sair"
                primaryTypographyProps={{
                  color: theme.palette.error.main,
                  fontWeight: 500
                }}
              />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      
      <Box
        component="nav"
        sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}
      >
        <Drawer
          variant={isMobile ? 'temporary' : 'permanent'}
          open={isMobile ? mobileOpen : true}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: { xs: '280px', sm: drawerWidth },
              bgcolor: theme.palette.secondary.main,
              color: 'white',
              borderRadius: 0,
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${drawerWidth}px)` },
          bgcolor: 'background.default',
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Empurra o conteúdo para baixo da AppBar em todas resoluções */}
        <Toolbar sx={{ display: 'block' }} />
        <Container maxWidth="xl" sx={{ flex: 1, py: { xs: 2, sm: 3 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
};

export default Layout;
