import api from './api';

export interface Caixa {
  codcaixa: number;
  nome: string;
  codfilial: number;
}

export interface SessaoCaixa {
  codsessao: number;
  codcaixa: number;
  codusur_abertura: number;
  data_abertura: string;
  valor_abertura: number;
  status: string;
  caixa?: Caixa;
  data_fechamento?: string;
  valor_fechamento?: number;
  diferenca?: number;
  motivo_diferenca?: string;
  usuario_abertura?: { nome: string };
  usuario_fechamento?: { nome: string };
}

export interface MovimentoCaixa {
  codmovimento: number;
  codsessao: number;
  data_movimento: string;
  tipo: 'ENTRADA' | 'SAIDA';
  categoria: string;
  valor: number;
  observacao: string;
  plano_pagamento?: {
    DESCRICAO: string;
  };
  usuario?: {
    nome: string;
  };
}

export const caixaService = {
  listarCaixas: async (codfilial?: number, todos?: boolean) => {
    const response = await api.get('/caixa/listar', { params: { codfilial, todos } });
    return response.data;
  },

  criarCaixa: async (data: { nome: string; codfilial: number }) => {
    const response = await api.post('/caixa', data);
    return response.data;
  },

  editarCaixa: async (codcaixa: number, data: { nome?: string; codfilial?: number; ativo?: boolean }) => {
    const response = await api.put(`/caixa/${codcaixa}`, data);
    return response.data;
  },

  statusSessao: async () => {
    const response = await api.get('/caixa/status');
    return response.data; // { status: 'ABERTO' | 'FECHADO', sessao: SessaoCaixa | null }
  },

  abrirCaixa: async (codcaixa: number, valor_abertura: number) => {
    const response = await api.post('/caixa/abrir', { codcaixa, valor_abertura });
    return response.data;
  },

  fecharCaixa: async (codsessao: number, valor_informado: number, motivo_diferenca?: string) => {
    const response = await api.post('/caixa/fechar', { codsessao, valor_informado, motivo_diferenca });
    return response.data;
  },

  movimentoManual: async (dados: {
    codsessao: number;
    tipo: 'ENTRADA' | 'SAIDA';
    categoria: 'SANGRIA' | 'SUPRIMENTO' | 'DESPESA';
    valor: number;
    observacao: string;
    codplano_pagamento: number;
  }) => {
    const response = await api.post('/caixa/movimento', dados);
    return response.data;
  },

  extratoSessao: async (codsessao: number) => {
    const response = await api.get(`/caixa/${codsessao}/extrato`);
    return response.data as MovimentoCaixa[];
  },

  listarSessoesFechadas: async () => {
    const response = await api.get('/caixa/sessoes/fechadas');
    return response.data;
  },

  relatorioFechamento: async (codsessao: number) => {
    const response = await api.get(`/caixa/${codsessao}/relatorio`);
    return response.data;
  }
};
