import React, { useEffect, useState } from 'react';
import { 
  Wallet, 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Lock, 
  Unlock, 
  AlertTriangle,
  History
} from 'lucide-react';
import { caixaService, SessaoCaixa, Caixa, MovimentoCaixa } from '../services/caixaService';
import { toast } from 'sonner';
import { CaixaHistorico } from '../components/CaixaHistorico';

export default function MeuCaixa() {
  const [activeTab, setActiveTab] = useState<'ATUAL' | 'HISTORICO'>('ATUAL');
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'ABERTO' | 'FECHADO'>('FECHADO');
  const [sessaoAtiva, setSessaoAtiva] = useState<SessaoCaixa | null>(null);
  
  // States para abertura
  const [caixasLivres, setCaixasLivres] = useState<Caixa[]>([]);
  const [caixaSelecionado, setCaixaSelecionado] = useState('');
  const [fundoTroco, setFundoTroco] = useState('');

  // States para extrato/movimentação
  const [extrato, setExtrato] = useState<MovimentoCaixa[]>([]);
  
  // States para fechamento cego
  const [fecharModalOpen, setFecharModalOpen] = useState(false);
  const [valorFechamento, setValorFechamento] = useState('');
  const [motivoDiferenca, setMotivoDiferenca] = useState('');
  const [diferenca, setDiferenca] = useState<number | null>(null);

  // States para sangria/suprimento
  const [movimentoModalOpen, setMovimentoModalOpen] = useState(false);
  const [tipoMovimento, setTipoMovimento] = useState<'ENTRADA' | 'SAIDA'>('SAIDA');
  const [categoriaMovimento, setCategoriaMovimento] = useState<'SANGRIA' | 'SUPRIMENTO' | 'DESPESA'>('SANGRIA');
  const [valorMovimento, setValorMovimento] = useState('');
  const [obsMovimento, setObsMovimento] = useState('');

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const data = await caixaService.statusSessao();
      setStatus(data.status);
      setSessaoAtiva(data.sessao);
      
      if (data.status === 'FECHADO') {
        const caixas = await caixaService.listarCaixas();
        setCaixasLivres(caixas);
      } else if (data.sessao) {
        carregarExtrato(data.sessao.codsessao);
      }
    } catch (error) {
      toast.error('Erro ao buscar status do caixa');
    } finally {
      setLoading(false);
    }
  };

  const carregarExtrato = async (codsessao: number) => {
    try {
      const dados = await caixaService.extratoSessao(codsessao);
      setExtrato(dados);
    } catch (error) {
      toast.error('Erro ao buscar extrato do caixa');
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleAbrirCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!caixaSelecionado) return toast.error('Selecione um caixa');
    
    try {
      await caixaService.abrirCaixa(Number(caixaSelecionado), Number(fundoTroco) || 0);
      toast.success('Caixa aberto com sucesso!');
      fetchStatus();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao abrir caixa');
    }
  };

  const handleFecharCaixa = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoAtiva) return;
    
    if (diferenca !== null && diferenca !== 0 && !motivoDiferenca) {
      toast.error('Por favor, justifique a diferença no caixa.');
      return;
    }

    try {
      const res = await caixaService.fecharCaixa(
        sessaoAtiva.codsessao, 
        Number(valorFechamento), 
        motivoDiferenca
      );
      toast.success('Caixa fechado com sucesso!');
      setFecharModalOpen(false);
      setDiferenca(null);
      setMotivoDiferenca('');
      setValorFechamento('');
      fetchStatus();
    } catch (error: any) {
      // Se a API retornar erro indicando a diferença obrigatória
      if (error.response?.data?.diferenca !== undefined) {
        setDiferenca(error.response.data.diferenca);
        toast.error('Existe uma diferença. Por favor, justifique.');
      } else {
        toast.error(error.response?.data?.message || 'Erro ao fechar caixa');
      }
    }
  };

  const handleMovimentoManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessaoAtiva) return;
    if (!valorMovimento || Number(valorMovimento) <= 0) return toast.error('Valor inválido');
    if (!obsMovimento) return toast.error('Observação é obrigatória');

    try {
      await caixaService.movimentoManual({
        codsessao: sessaoAtiva.codsessao,
        tipo: tipoMovimento,
        categoria: categoriaMovimento,
        valor: Number(valorMovimento),
        observacao: obsMovimento,
        codplano_pagamento: 4 // Dinheiro (ID 4 no banco)
      });
      toast.success('Movimentação registrada com sucesso!');
      setMovimentoModalOpen(false);
      setValorMovimento('');
      setObsMovimento('');
      carregarExtrato(sessaoAtiva.codsessao);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Erro ao registrar movimento');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando status do caixa...</div>;
  }

  // TELA DE CAIXA FECHADO (E TAB ATUAL)
  if (activeTab === 'ATUAL' && status === 'FECHADO') {
    return (
      <div className="space-y-6">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setActiveTab('ATUAL')} 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'ATUAL' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Caixa Atual
          </button>
          <button 
            onClick={() => setActiveTab('HISTORICO')} 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'HISTORICO' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Histórico e Auditoria
          </button>
        </div>

        <div className="max-w-md mx-auto mt-10 bg-white p-8 rounded-xl shadow-sm border border-gray-100 animate-in fade-in zoom-in-95 duration-300">
          <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock size={32} />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Caixa Fechado</h2>
          <p className="text-gray-500 mt-2">Você precisa abrir um caixa para iniciar as vendas.</p>
        </div>

        <form onSubmit={handleAbrirCaixa} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Terminal</label>
            <select
              value={caixaSelecionado}
              onChange={(e) => setCaixaSelecionado(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Selecione...</option>
              {caixasLivres.map(c => (
                <option key={c.codcaixa} value={c.codcaixa}>{c.nome}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fundo de Troco (R$)</label>
            <input
              type="number"
              step="0.01"
              value={fundoTroco}
              onChange={(e) => setFundoTroco(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              placeholder="0,00"
            />
            <p className="text-xs text-gray-400 mt-1">Opcional. Valor em dinheiro na gaveta ao iniciar.</p>
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white font-medium py-3 rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
          >
            <Unlock size={20} />
            Abrir Caixa
          </button>
        </form>
      </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex border-b border-gray-200 mb-6">
          <button 
            onClick={() => setActiveTab('ATUAL')} 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'ATUAL' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Caixa Atual
          </button>
          <button 
            onClick={() => setActiveTab('HISTORICO')} 
            className={`px-4 py-2 font-medium text-sm transition-colors ${activeTab === 'HISTORICO' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Histórico e Auditoria
          </button>
      </div>

      {activeTab === 'HISTORICO' && (
        <CaixaHistorico />
      )}

      {activeTab === 'ATUAL' && status === 'ABERTO' && (
        <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-6 rounded-xl shadow-sm border border-gray-100 gap-4 md:gap-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Wallet className="text-primary" />
            Meu Caixa - {sessaoAtiva?.caixa?.nome}
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Aberto em: {new Date(sessaoAtiva?.data_abertura || '').toLocaleString('pt-BR')}
          </p>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap w-full md:w-auto gap-2 sm:gap-3">
          <button
            onClick={() => {
              setTipoMovimento('ENTRADA');
              setCategoriaMovimento('SUPRIMENTO');
              setMovimentoModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-green-50 text-green-700 rounded-lg font-medium hover:bg-green-100 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <ArrowDownCircle size={18} />
            Suprimento
          </button>
          <button
            onClick={() => {
              setTipoMovimento('SAIDA');
              setCategoriaMovimento('SANGRIA');
              setMovimentoModalOpen(true);
            }}
            className="flex-1 md:flex-none px-3 sm:px-4 py-2 bg-red-50 text-red-700 rounded-lg font-medium hover:bg-red-100 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <ArrowUpCircle size={18} />
            Sangria
          </button>
          <button
            onClick={() => setFecharModalOpen(true)}
            className="w-full sm:w-auto flex-1 md:flex-none px-3 sm:px-4 py-2 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-1 sm:gap-2 text-sm sm:text-base"
          >
            <Lock size={18} />
            Fechar Caixa
          </button>
        </div>
      </div>

      {/* EXTRATO DA SESSÃO */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={20} className="text-gray-400" />
            Extrato de Movimentações
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Histórico</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {extrato.map(mov => (
                <tr key={mov.codmovimento} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(mov.data_movimento).toLocaleTimeString('pt-BR')}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      mov.tipo === 'ENTRADA' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {mov.tipo === 'ENTRADA' ? <ArrowDownCircle size={14} /> : <ArrowUpCircle size={14} />}
                      {mov.tipo}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {mov.categoria}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {mov.observacao || '-'}
                  </td>
                  <td className={`px-6 py-4 text-sm font-bold text-right ${
                    mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {mov.tipo === 'ENTRADA' ? '+' : '-'} R$ {Number(mov.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
              {extrato.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                    Nenhuma movimentação neste caixa ainda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MOVIMENTAÇÃO MANUAL */}
      {movimentoModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className={`p-6 text-white ${tipoMovimento === 'ENTRADA' ? 'bg-green-600' : 'bg-red-600'}`}>
              <h2 className="text-xl font-bold flex items-center gap-2">
                {tipoMovimento === 'ENTRADA' ? <ArrowDownCircle /> : <ArrowUpCircle />}
                Novo {categoriaMovimento}
              </h2>
            </div>
            <form onSubmit={handleMovimentoManual} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorMovimento}
                  onChange={(e) => setValorMovimento(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="0,00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Observação / Justificativa</label>
                <textarea
                  required
                  rows={3}
                  value={obsMovimento}
                  onChange={(e) => setObsMovimento(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Ex: Reforço de troco"
                />
              </div>
              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => setMovimentoModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 px-4 py-2 text-white rounded-lg font-medium ${
                    tipoMovimento === 'ENTRADA' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  Confirmar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL FECHAMENTO CEGO */}
      {fecharModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
            <div className="p-6 bg-gray-900 text-white">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Lock /> Fechamento de Caixa
              </h2>
              <p className="text-gray-400 text-sm mt-1">Procedimento de fechamento cego.</p>
            </div>
            
            <form onSubmit={handleFecharCaixa} className="p-6 space-y-4">
              <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3">
                <AlertTriangle size={24} className="shrink-0" />
                <p className="text-sm">
                  Conte o <strong>dinheiro físico</strong> disponível na gaveta e informe abaixo. 
                  Valores em cartão/PIX já são calculados automaticamente pelo sistema.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dinheiro Contado em Gaveta (R$)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={valorFechamento}
                  onChange={(e) => setValorFechamento(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 text-xl font-bold rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-right"
                  placeholder="0,00"
                  disabled={diferenca !== null}
                />
              </div>

              {diferenca !== null && (
                <div className="animate-fade-in space-y-4 border-t border-gray-100 pt-4">
                  <div className={`p-4 rounded-lg flex items-center justify-between ${
                    diferenca === 0 ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                  }`}>
                    <span className="font-medium">Diferença Encontrada:</span>
                    <span className="font-bold text-lg">
                      {diferenca > 0 ? '+' : ''} R$ {diferenca.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                  
                  {diferenca !== 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Justificativa Obrigatória para a Quebra de Caixa
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={motivoDiferenca}
                        onChange={(e) => setMotivoDiferenca(e.target.value)}
                        className="w-full px-4 py-2 border border-red-300 rounded-lg focus:ring-2 focus:ring-red-600 focus:border-transparent"
                        placeholder="Explique o motivo da sobra ou falta no caixa..."
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setFecharModalOpen(false);
                    setDiferenca(null);
                    setValorFechamento('');
                    setMotivoDiferenca('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90"
                >
                  {diferenca !== null && diferenca !== 0 ? 'Confirmar e Justificar' : 'Aferir Caixa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
      )}
    </div>
  );
}
