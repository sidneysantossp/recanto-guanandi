// Tipos de usuário
export interface User {
  _id: string;
  nome: string;
  email: string;
  tipo: 'admin' | 'proprietario';
  cpf?: string;
  telefone?: string;
  endereco?: {
    lote?: string;
    quadra?: string;
    rua?: string;
    cep?: string;
  };
  situacao: 'ativo' | 'inativo' | 'inadimplente';
  dataUltimoLogin?: Date;
  avatar?: string;
  notificacoes: {
    email: boolean;
    sms: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de boleto
export interface Boleto {
  _id: string;
  numeroDocumento: string;
  proprietario: User;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  dataEmissao: Date;
  dataPagamento?: Date;
  status: 'pendente' | 'pago' | 'vencido' | 'cancelado';
  tipoPagamento: 'boleto' | 'pix' | 'dinheiro' | 'transferencia';
  codigoBarras?: string;
  linhaDigitavel?: string;
  chavePix?: string;
  qrCodePix?: string;
  categoria: 'taxa_condominio' | 'taxa_extra' | 'multa' | 'obra' | 'manutencao' | 'outros';
  observacoes?: string;
  valorJuros: number;
  valorMulta: number;
  valorDesconto: number;
  nossoNumero?: string;
  comprovantePagamento?: string;
  emailEnviado: boolean;
  dataEnvioEmail?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de notificação
export interface Notification {
  _id: string;
  titulo: string;
  conteudo: string;
  tipo: 'comunicado' | 'ata' | 'assembleia' | 'cobranca' | 'manutencao' | 'urgente';
  prioridade: 'baixa' | 'media' | 'alta' | 'urgente';
  destinatarios: {
    tipo: 'todos' | 'especificos' | 'inadimplentes' | 'ativos';
    usuarios: User[];
  };
  autor: User;
  dataPublicacao: Date;
  dataExpiracao?: Date;
  anexos: {
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
  }[];
  status: 'rascunho' | 'publicado' | 'arquivado';
  configuracoes: {
    enviarEmail: boolean;
    enviarSMS: boolean;
    exibirDashboard: boolean;
    permitirComentarios: boolean;
  };
  estatisticas: {
    visualizacoes: number;
    emailsEnviados: number;
    emailsAbertos: number;
    smsEnviados: number;
  };
  leituras: {
    usuario: User;
    dataLeitura: Date;
    via: 'dashboard' | 'email' | 'sms';
  }[];
  comentarios: {
    usuario: User;
    conteudo: string;
    dataComentario: Date;
  }[];
  createdAt: Date;
  updatedAt: Date;
}

// Tipos de resposta da API
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    current: number;
    pages: number;
    total: number;
  };
}

// Tipos de autenticação
export interface LoginCredentials {
  email: string;
  senha: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  user: User;
}

// Tipos de dashboard
export interface DashboardStats {
  usuarios?: {
    total: number;
    ativos: number;
    inadimplentes: number;
    inativos: number;
    novosUltimos30Dias: number;
    percentualAtivos?: string;
  } | null;
  boletos: {
    total: number;
    pendentes: number;
    vencidos: number;
    pagos: number;
    cancelados?: number;
    valorArrecadadoMes: number | string;
    valorEmAberto: number | string;
    valorVencido?: number | string;
    taxaArrecadacao?: number | string;
    taxaAdimplencia?: string; // compatibilidade com versões anteriores
  };
  notificacoes?: {
    total: number;
    publicadas: number;
    rascunhos: number;
    arquivadas: number;
    porTipo?: { _id: string; count: number }[];
    taxaLeituraMedia?: string;
    totalVisualizacoes?: number;
  } | null;
  graficos?: {
    mensal: { mes: string; emitido: number; arrecadado: number }[];
    categorias?: { nome: string; valor: number; cor: string }[];
  };
}

// Tipos de relatórios
export interface RelatorioFinanceiro {
  periodo: {
    mes: number;
    ano: number;
    inicio: Date;
    fim: Date;
  };
  resumo: {
    valorTotalEmitido: string;
    valorTotalArrecadado: string;
    valorEmAberto: string;
    valorVencido: string;
    taxaArrecadacao: string;
    taxaInadimplencia: string;
  };
  quantidades: {
    totalBoletos: number;
    boletosPagos: number;
    boletosEmAberto: number;
    boletosVencidos: number;
  };
  porCategoria: Record<string, {
    emitido: number;
    arrecadado: number;
    quantidade: number;
  }>;
  proprietarios: {
    total: number;
    inadimplentes: number;
    ativos: number;
  };
}

// Tipos de formulários
export interface CreateUserForm {
  nome: string;
  email: string;
  senha: string;
  tipo: 'admin' | 'proprietario';
  cpf?: string;
  telefone?: string;
  endereco?: {
    lote?: string;
    quadra?: string;
    rua?: string;
    cep?: string;
  };
}

export interface CreateBoletoForm {
  proprietarioId: string;
  descricao: string;
  valor: number;
  dataVencimento: Date;
  categoria: Boleto["categoria"];
  observacoes?: string;
  tipoPagamento?: Boleto["tipoPagamento"];
}

export interface CreateNotificationForm {
  titulo: string;
  conteudo: string;
  tipo: string;
  prioridade: string;
  destinatarios: {
    tipo: string;
    usuarios?: string[];
  };
  dataExpiracao?: Date;
  configuracoes: {
    enviarEmail: boolean;
    enviarSMS: boolean;
    exibirDashboard: boolean;
    permitirComentarios: boolean;
  };
}

// Tipos de contexto
export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  loading: boolean;
  isAuthenticated: boolean;
}

// Tipos de tema (seguindo padrão Cora)
export interface CoraTheme {
  colors: {
    primary: string;
    secondary: string;
    background: string;
    surface: string;
    text: {
      primary: string;
      secondary: string;
    };
    success: string;
    warning: string;
    error: string;
    info: string;
  };
  spacing: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
  };
  borderRadius: {
    sm: number;
    md: number;
    lg: number;
  };
}

// Tipos de empresas e prestadores
export interface Company {
  _id: string;
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  categorias?: string[];
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Provider {
  _id: string;
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  especialidades?: string[];
  empresaVinculada?: Company;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    cep?: string;
  };
  ativo: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface BudgetComment {
  autor?: User;
  conteudo: string;
  criadoEm: Date;
}

export interface BudgetHistoryItem {
  tipo: 'criado' | 'status_alterado' | 'comentario_adicionado' | 'anexo_adicionado' | 'atualizado';
  descricao?: string;
  usuario?: User;
  data: Date;
  metadados?: Record<string, any>;
}

export interface Budget {
  _id: string;
  titulo: string;
  descricao: string;
  categoria: string;
  valorEstimado?: number;
  empresa?: Company;
  prestador?: Provider;
  arquivos: {
    nome: string;
    url: string;
    tipo: string;
    tamanho: number;
  }[];
  comentarios?: BudgetComment[];
  historico?: BudgetHistoryItem[];
  status: 'aberto' | 'em_analise' | 'aprovado' | 'rejeitado' | 'concluido';
  solicitante?: User;
  dataAbertura: Date;
  dataFechamento?: Date;
  observacoes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateBudgetForm {
  titulo: string;
  descricao: string;
  categoria: string;
  valorEstimado?: number;
  empresa?: string; // id
  prestador?: string; // id
  observacoes?: string;
}
// Formulários
export interface CreateCompanyForm {
  nome: string;
  cnpj?: string;
  email?: string;
  telefone?: string;
  endereco?: Company['endereco'];
  categorias?: string[];
  ativo?: boolean;
}

export interface CreateProviderForm {
  nome: string;
  cpfCnpj?: string;
  email?: string;
  telefone?: string;
  especialidades?: string[];
  empresaVinculada?: string; // id
  endereco?: Provider['endereco'];
  ativo?: boolean;
}

// Tipos auxiliares para formulário de perfil
export interface UpdateProfilePayload {
  nome?: string;
  email?: string;
}

export interface ChangePasswordPayload {
  senhaAtual: string;
  novaSenha: string;
}