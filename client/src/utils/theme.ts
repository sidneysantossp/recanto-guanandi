import { createTheme, ThemeOptions } from '@mui/material/styles';

// Cores baseadas no padrão visual do Cora
const coraColors = {
  primary: {
    main: '#FF6B35', // Laranja principal do Cora
    light: '#FF8A65',
    dark: '#E64A19',
    contrastText: '#FFFFFF',
  },
  secondary: {
    main: '#2C3E50', // Azul escuro para contraste
    light: '#34495E',
    dark: '#1A252F',
    contrastText: '#FFFFFF',
  },
  background: {
    default: '#F8F9FA',
    paper: '#FFFFFF',
  },
  text: {
    primary: '#2C3E50',
    secondary: '#6C757D',
  },
  success: {
    main: '#28A745',
    light: '#5CBB2A',
    dark: '#1E7E34',
  },
  warning: {
    main: '#FFC107',
    light: '#FFD54F',
    dark: '#FF8F00',
  },
  error: {
    main: '#DC3545',
    light: '#EF5350',
    dark: '#C62828',
  },
  info: {
    main: '#17A2B8',
    light: '#4FC3F7',
    dark: '#0277BD',
  },
  grey: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

const themeOptions: ThemeOptions = {
  palette: {
    mode: 'light',
    ...coraColors,
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      color: coraColors.text.primary,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      color: coraColors.text.primary,
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      color: coraColors.text.primary,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 500,
      lineHeight: 1.4,
      color: coraColors.text.primary,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: coraColors.text.primary,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      color: coraColors.text.primary,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.5,
      color: coraColors.text.primary,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.43,
      color: coraColors.text.secondary,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 500,
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 8,
  },
  spacing: 8,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 500,
          padding: '10px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
          border: '1px solid #E0E0E0',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
        elevation1: {
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '& fieldset': {
              borderColor: '#E0E0E0',
            },
            '&:hover fieldset': {
              borderColor: coraColors.primary.main,
            },
            '&.Mui-focused fieldset': {
              borderColor: coraColors.primary.main,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          fontWeight: 500,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: coraColors.text.primary,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          borderRadius: 0,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: coraColors.secondary.main,
          color: '#FFFFFF',
          borderRight: 'none',
          borderRadius: 0,
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          margin: '4px 8px',
          color: '#FFFFFF',
          '& .MuiListItemIcon-root': {
            color: '#FFFFFF',
          },
          '& .MuiListItemText-primary': {
            color: '#FFFFFF',
          },
          '&:hover': {
            backgroundColor: 'rgba(255,255,255,0.1)',
          },
          '&.Mui-selected': {
            backgroundColor: coraColors.primary.main,
            color: '#FFFFFF',
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
            '& .MuiListItemText-primary': {
              color: '#FFFFFF',
            },
            '&:hover': {
              backgroundColor: coraColors.primary.dark,
            },
          },
        },
      },
    },

    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
};

export const theme = createTheme(themeOptions);

// Utilitários para cores de status
export const statusColors = {
  pending: '#FFC107',
  paid: '#28A745',
  overdue: '#DC3545',
  cancelled: '#6C757D',
  active: '#28A745',
  inactive: '#6C757D',
  delinquent: '#DC3545',
};

// Utilitários para formatação
export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const formatDate = (date: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date));
};

export const formatDateTime = (date: Date | string): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
};

export default theme;