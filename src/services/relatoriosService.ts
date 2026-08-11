import api from './api';

export const getFaturamentoProduto = async (paramsObj?: any) => {
  const params = new URLSearchParams();
  if (paramsObj?.dataInicial) params.append('dataInicial', paramsObj.dataInicial);
  if (paramsObj?.dataFinal) params.append('dataFinal', paramsObj.dataFinal);
  if (paramsObj?.vendedorId) params.append('vendedorId', paramsObj.vendedorId);
  if (paramsObj?.clienteId) params.append('clienteId', paramsObj.clienteId);
  if (paramsObj?.categoriaId) params.append('categoriaId', paramsObj.categoriaId);
  if (paramsObj?.marcaId) params.append('marcaId', paramsObj.marcaId);
  if (paramsObj?.produtoId) params.append('produtoId', paramsObj.produtoId);
  
  const response = await api.get(`/relatorios/faturamento-produto?${params.toString()}`);
  return response.data;
};
