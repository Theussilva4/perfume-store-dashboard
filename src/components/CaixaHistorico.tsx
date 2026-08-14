import React, { useEffect, useState } from 'react';
import { caixaService, SessaoCaixa, MovimentoCaixa } from '../services/caixaService';
import { toast } from 'sonner';
import { History, Eye, X, CheckCircle, AlertCircle, Banknote, CreditCard, Smartphone } from 'lucide-react';

export function CaixaHistorico() {
  const [sessoes, setSessoes] = useState<SessaoCaixa[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [relatorio, setRelatorio] = useState<any>(null);
  const [extrato, setExtrato] = useState<MovimentoCaixa[]>([]);
  const [modalTab, setModalTab] = useState<'RESUMO' | 'EXTRATO'>('RESUMO');

  useEffect(() => {
    carregarSessoes();
  }, []);

  const carregarSessoes = async () => {
    try {
      setLoading(true);
      const data = await caixaService.listarSessoesFechadas();
      if (Array.isArray(data)) {
        setSessoes(data);
      } else {
        console.error('Resposta da API não é um array:', data);
        setSessoes([]);
      }
    } catch (error) {
      toast.error('Erro ao carregar histórico de caixas');
    } finally {
      setLoading(false);
    }
  };

  const abrirRelatorio = async (codsessao: number) => {
    try {
      const data = await caixaService.relatorioFechamento(codsessao);
      const extratoData = await caixaService.extratoSessao(codsessao);
      setRelatorio(data);
      setExtrato(extratoData);
      setModalTab('RESUMO');
      setModalOpen(true);
    } catch (error) {
      toast.error('Erro ao buscar detalhes do caixa');
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Carregando histórico...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in zoom-in-95 duration-300">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-bold text-gray-800 flex items-center gap-2">
            <History size={20} className="text-gray-400" />
            Histórico de Caixas Fechados
          </h3>
        </div>
        <div className="w-full">
          {/* Mobile View */}
          <div className="md:hidden divide-y divide-gray-100">
            {sessoes.length === 0 ? (
              <div className="p-8 text-center text-gray-500">Nenhum caixa fechado encontrado.</div>
            ) : (
              sessoes.map(sessao => (
                <div key={sessao.codsessao} className="p-4 space-y-3 bg-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold text-gray-800">{sessao.caixa?.nome}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        <div>Abriu: {sessao.usuario_abertura?.nome || 'Desconhecido'}</div>
                        <div>Fechou: {sessao.usuario_fechamento?.nome || 'Desconhecido'}</div>
                      </div>
                    </div>
                    <div>
                      {Number(sessao.diferenca) === 0 ? (
                        <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium bg-green-50 px-2 py-1 rounded-md">
                          <CheckCircle size={14} /> Ok
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium bg-red-50 px-2 py-1 rounded-md">
                          <AlertCircle size={14} /> 
                          R$ {Number(sessao.diferenca).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 p-2 rounded-md text-xs text-gray-600 grid grid-cols-1 gap-1">
                    <div><strong>A:</strong> {new Date(sessao.data_abertura).toLocaleString('pt-BR')}</div>
                    <div><strong>F:</strong> {new Date(sessao.data_fechamento || '').toLocaleString('pt-BR')}</div>
                  </div>

                  <button 
                    onClick={() => abrirRelatorio(sessao.codsessao)}
                    className="w-full bg-primary/10 text-primary hover:bg-primary/20 font-medium py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    Ver Detalhes
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Desktop View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data/Hora</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Terminal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Operadores</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Diferença</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sessoes.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Nenhum caixa fechado encontrado.
                    </td>
                  </tr>
                ) : (
                  sessoes.map(sessao => (
                    <tr key={sessao.codsessao} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div><strong>A:</strong> {new Date(sessao.data_abertura).toLocaleString('pt-BR')}</div>
                        <div><strong>F:</strong> {new Date(sessao.data_fechamento || '').toLocaleString('pt-BR')}</div>
                      </td>
                      <td className="px-6 py-4 text-sm font-medium">
                        {sessao.caixa?.nome}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <div><span className="font-semibold">Abriu:</span> {sessao.usuario_abertura?.nome || 'Desconhecido'}</div>
                        <div><span className="font-semibold">Fechou:</span> {sessao.usuario_fechamento?.nome || 'Desconhecido'}</div>
                      </td>
                      <td className="px-6 py-4">
                        {Number(sessao.diferenca) === 0 ? (
                          <span className="inline-flex items-center gap-1 text-green-600 text-sm font-medium">
                            <CheckCircle size={14} /> Ok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-red-600 text-sm font-medium">
                            <AlertCircle size={14} /> 
                            R$ {Number(sessao.diferenca).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => abrirRelatorio(sessao.codsessao)}
                          className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DETALHES */}
      {modalOpen && relatorio && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 bg-gray-900 text-white flex justify-between items-center sticky top-0 z-10">
              <div>
                <h2 className="text-xl font-bold">Detalhes do Caixa</h2>
                <p className="text-gray-400 text-sm mt-1">
                  {relatorio.sessao.caixa?.nome} • Fechado em {new Date(relatorio.sessao.data_fechamento).toLocaleString('pt-BR')}
                </p>
              </div>
              <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-800 rounded-full">
                <X size={24} />
              </button>
            </div>

            <div className="flex border-b border-gray-200 px-6 pt-4 sticky top-[88px] bg-white z-10">
              <button 
                onClick={() => setModalTab('RESUMO')} 
                className={`pb-3 px-4 font-medium text-sm transition-colors ${modalTab === 'RESUMO' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Resumo do Fechamento
              </button>
              <button 
                onClick={() => setModalTab('EXTRATO')} 
                className={`pb-3 px-4 font-medium text-sm transition-colors ${modalTab === 'EXTRATO' ? 'border-b-2 border-primary text-primary' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Histórico de Pedidos e Movimentações
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {modalTab === 'RESUMO' && (
                <>
                  {/* BLOCO AUDITORIA */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 font-medium mb-1">Fundo de Troco</p>
                  <p className="text-xl font-bold text-gray-900">
                    R$ {Number(relatorio.sessao.valor_abertura).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 font-medium mb-1">Giro Total (Vendas)</p>
                  <p className="text-xl font-bold text-green-600">
                    R$ {Number(extrato.filter(m => m.categoria === 'VENDA' && m.tipo === 'ENTRADA').reduce((acc, curr) => acc + Number(curr.valor), 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 font-medium mb-1">Suprimentos (Adicionais)</p>
                  <p className="text-xl font-bold text-blue-600">
                    + R$ {Number(extrato.filter(m => m.categoria === 'SUPRIMENTO' && m.tipo === 'ENTRADA' && m.observacao !== 'Abertura de Caixa (Fundo de Troco)').reduce((acc, curr) => acc + Number(curr.valor), 0)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center flex flex-col justify-between h-full">
                  <p className="text-sm text-gray-500 font-medium mb-1">Sangrias/Despesas (Saídas)</p>
                  <p className="text-xl font-bold text-red-600">
                    - R$ {Number(relatorio.resumo.SAIDAS_TOTAIS).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </p>
                </div>
              </div>

              {/* BLOCO FORMAS DE PAGAMENTO */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Entradas por Forma de Pagamento</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center shrink-0">
                      <Banknote size={24} />
                    </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Dinheiro</p>
                        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">R$ {Number(relatorio.resumo.DINHEIRO).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                  </div>
                  
                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <CreditCard size={24} />
                    </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Cartão</p>
                        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">R$ {Number(relatorio.resumo.CARTAO).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Smartphone size={24} />
                    </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">PIX</p>
                        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">R$ {Number(relatorio.resumo.PIX).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                  </div>

                  <div className="p-4 bg-white border border-gray-200 rounded-xl flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gray-100 text-gray-600 flex items-center justify-center shrink-0">
                      <History size={24} />
                    </div>
                      <div>
                        <p className="text-sm text-gray-500 font-medium">Outros</p>
                        <p className="text-lg font-bold text-gray-900 whitespace-nowrap">R$ {Number(relatorio.resumo.OUTROS).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</p>
                      </div>
                  </div>
                </div>
              </div>

              {/* BLOCO FECHAMENTO FISICO */}
              <div>
                <h4 className="font-bold text-gray-800 mb-3 border-b pb-2">Aferição Física (Em Dinheiro)</h4>
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Fundo de Troco + Entradas (Dinheiro) - Saídas (Dinheiro):</span>
                    <span className="font-bold">R$ {(Number(relatorio.sessao.valor_abertura) + Number(relatorio.resumo.DINHEIRO)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor em Dinheiro Informado pelo Operador:</span>
                    <span className="font-bold text-primary">R$ {Number(relatorio.sessao.valor_fechamento).toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
                  </div>
                  
                  <div className={`mt-4 p-3 rounded-lg flex items-center justify-between ${
                    Number(relatorio.sessao.diferenca) > 0 ? 'bg-green-100 text-green-800' : 
                    Number(relatorio.sessao.diferenca) < 0 ? 'bg-red-100 text-red-800' : 
                    'bg-green-100 text-green-800'
                  }`}>
                    <span className="font-medium">Diferença ou sobra registrada:</span>
                    <span className="font-bold">
                      {Number(relatorio.sessao.diferenca) > 0 ? '+ ' : ''}
                      {Number(relatorio.sessao.diferenca) < 0 ? '- ' : ''}
                      R$ {Math.abs(Number(relatorio.sessao.diferenca)).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                    </span>
                  </div>

                  {Number(relatorio.sessao.diferenca) !== 0 && (
                    <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                      <p className="text-sm text-gray-500 font-medium mb-1">Justificativa do Operador:</p>
                      <p className="text-gray-800">"{relatorio.sessao.motivo_diferenca}"</p>
                    </div>
                  )}
                </div>
              </div>
              </>
              )}

              {modalTab === 'EXTRATO' && (
                <div className="w-full">
                  {/* Mobile View */}
                  <div className="md:hidden divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden">
                    {extrato.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">Nenhuma movimentação encontrada neste caixa.</div>
                    ) : (
                      extrato.map((mov) => (
                        <div key={mov.codmovimento} className="p-4 bg-white space-y-2">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                mov.categoria === 'VENDA' ? 'bg-green-100 text-green-700' : 
                                mov.categoria === 'ABERTURA' ? 'bg-blue-100 text-blue-700' :
                                mov.tipo === 'SAIDA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {mov.categoria}
                              </span>
                              <span className="text-xs text-gray-500 font-medium">
                                {new Date(mov.data_movimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <div className={`text-sm font-bold ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'ENTRADA' ? '+' : '-'} R$ {Number(mov.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </div>
                          </div>
                          <div className="text-sm font-medium text-gray-800">
                            {mov.plano_pagamento?.DESCRICAO || '-'}
                          </div>
                          {mov.observacao && (
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded-md">
                              {mov.observacao}
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>

                  {/* Desktop View */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium">Hora</th>
                          <th className="px-4 py-3 text-left font-medium">Categoria</th>
                          <th className="px-4 py-3 text-left font-medium">Plano/Forma</th>
                          <th className="px-4 py-3 text-left font-medium">Observação</th>
                          <th className="px-4 py-3 text-right font-medium">Valor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {extrato.map((mov) => (
                          <tr key={mov.codmovimento} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                              {new Date(mov.data_movimento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                mov.categoria === 'VENDA' ? 'bg-green-100 text-green-700' : 
                                mov.categoria === 'ABERTURA' ? 'bg-blue-100 text-blue-700' :
                                mov.tipo === 'SAIDA' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {mov.categoria}
                              </span>
                            </td>
                            <td className="px-4 py-3 font-medium text-gray-700">
                              {mov.plano_pagamento?.DESCRICAO || '-'}
                            </td>
                            <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate" title={mov.observacao}>
                              {mov.observacao || '-'}
                            </td>
                            <td className={`px-4 py-3 text-right font-bold whitespace-nowrap ${mov.tipo === 'ENTRADA' ? 'text-green-600' : 'text-red-600'}`}>
                              {mov.tipo === 'ENTRADA' ? '+' : '-'} R$ {Number(mov.valor).toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                            </td>
                          </tr>
                        ))}
                        {extrato.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                              Nenhuma movimentação encontrada neste caixa.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
