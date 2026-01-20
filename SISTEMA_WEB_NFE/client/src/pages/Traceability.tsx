import { useState, useMemo } from 'react';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Search, Filter, Package, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { formatCurrency } from '../lib/utils';

type StatusFilter = 'all' | 'valido' | 'proximo_vencer' | 'vencido';

export default function Traceability() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [originFilter, setOriginFilter] = useState<'all' | 'NF-e' | 'Manual'>('all');

  const { data: products, isLoading } = trpc.products.traceability.useQuery();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    return products.filter((product) => {
      // Filtro de busca
      const matchesSearch =
        product.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (product.batchNumber && product.batchNumber.toLowerCase().includes(searchTerm.toLowerCase()));

      // Filtro de status
      const matchesStatus = statusFilter === 'all' || product.status === statusFilter;

      // Filtro de origem
      const matchesOrigin = originFilter === 'all' || product.origin === originFilter;

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [products, searchTerm, statusFilter, originFilter]);

  const stats = useMemo(() => {
    if (!products) return { total: 0, validos: 0, proximos: 0, vencidos: 0 };

    return {
      total: products.length,
      validos: products.filter((p) => p.status === 'valido').length,
      proximos: products.filter((p) => p.status === 'proximo_vencer').length,
      vencidos: products.filter((p) => p.status === 'vencido').length,
    };
  }, [products]);

  const getStatusBadge = (status: string, days: number | null) => {
    if (status === 'vencido') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          <XCircle className="w-3 h-3" />
          Vencido ({days && Math.abs(days)} dias)
        </span>
      );
    }
    if (status === 'proximo_vencer') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3" />
          Próximo ({days} dias)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3" />
        Válido ({days && days > 30 ? `${days} dias` : 'OK'})
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PageHeader title="Rastreabilidade" />
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Rastreabilidade de Produtos"
        description="Dashboard completo com status de validade de todos os produtos"
      />

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <Package className="w-8 h-8 text-indigo-600" />
            <div>
              <p className="text-sm text-gray-500">Total</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-sm text-gray-500">Válidos</p>
              <p className="text-2xl font-bold text-green-600">{stats.validos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-sm text-gray-500">Próximos a Vencer</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.proximos}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3">
            <XCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-sm text-gray-500">Vencidos</p>
              <p className="text-2xl font-bold text-red-600">{stats.vencidos}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por produto ou lote..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos os Status</option>
              <option value="valido">Válidos</option>
              <option value="proximo_vencer">Próximos a Vencer</option>
              <option value="vencido">Vencidos</option>
            </select>
          </div>

          <div>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value as 'all' | 'NF-e' | 'Manual')}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todas as Origens</option>
              <option value="NF-e">NF-e</option>
              <option value="Manual">Manual</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lote</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fabricação</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Validade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Unit.</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Origem</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                    Nenhum produto encontrado
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={`${product.id}-${product.origin}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.batchNumber || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.manufacturingDate
                        ? new Date(product.manufacturingDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.expirationDate
                        ? new Date(product.expirationDate).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {Number(product.quantityAvailable).toLocaleString('pt-BR')} {product.unitOfMeasure}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unitPrice ? `R$ ${formatCurrency(product.unitPrice)}` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.unitPrice
                        ? `R$ ${formatCurrency(
                            Number(product.quantityAvailable || 0) * Number(product.unitPrice || 0),
                          )}`
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          product.origin === 'NF-e'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }`}
                      >
                        {product.origin}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {getStatusBadge(product.status, product.daysUntilExpiration)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
