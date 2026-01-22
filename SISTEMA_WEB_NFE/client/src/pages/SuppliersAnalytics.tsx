import { useState } from 'react';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Store, TrendingUp, Package, Calendar, PieChart, BarChart3 } from 'lucide-react';
import {
  PieChart as RechartsP

ieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function SuppliersAnalytics() {
  const { data: suppliers, isLoading } = trpc.suppliers.getStats.useQuery();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader
          title="Análise de Fornecedores"
          subtitle="Estatísticas detalhadas de compras por fornecedor"
          icon={Store}
        />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p className="text-center text-gray-500">Carregando...</p>
        </div>
      </div>
    );
  }

  // Preparar dados para o gráfico de pizza
  const pieData = suppliers?.slice(0, 8).map((supplier, idx) => ({
    name: supplier.name,
    value: supplier.totalPurchases,
    color: COLORS[idx % COLORS.length],
  })) || [];

  // Preparar dados para o gráfico de barras
  const barData = suppliers?.slice(0, 10).map(supplier => ({
    name: supplier.name.length > 20 ? supplier.name.substring(0, 20) + '...' : supplier.name,
    compras: supplier.totalPurchases,
    gastos: supplier.totalSpent,
  })) || [];

  const totalPurchases = suppliers?.reduce((sum, s) => sum + s.totalPurchases, 0) || 0;
  const totalSpent = suppliers?.reduce((sum, s) => sum + s.totalSpent, 0) || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Análise de Fornecedores"
        subtitle="Estatísticas detalhadas de compras por fornecedor"
        icon={Store}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Estatísticas Gerais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Fornecedores</p>
                <p className="text-3xl font-bold text-indigo-600">{suppliers?.length || 0}</p>
              </div>
              <Store className="w-12 h-12 text-indigo-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Compras</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Gastos</p>
                <p className="text-3xl font-bold text-blue-600">
                  R$ {totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Gráfico de Pizza */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              Distribuição de Compras por Fornecedor
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsPieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          </div>

          {/* Gráfico de Barras */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top 10 Fornecedores
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="compras" fill="#3b82f6" name="Compras" />
                <Bar dataKey="gastos" fill="#10b981" name="Gastos" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tabela Detalhada */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">Detalhes por Fornecedor</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fornecedor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Compras
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total Gastos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Produtos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Última Compra
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Top Produtos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {suppliers?.map((supplier, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Store className="w-5 h-5 text-gray-400 mr-2" />
                        <span className="font-medium text-gray-900">{supplier.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-green-600 font-semibold">
                        R$ {supplier.totalPurchases.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-blue-600 font-semibold">
                        R$ {supplier.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm">
                        {supplier.productCount} produtos
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {supplier.lastPurchaseDate ? (
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {supplier.lastPurchaseDate}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="max-w-xs">
                        {supplier.topProducts.slice(0, 3).map((product: any, pIdx: number) => (
                          <div key={pIdx} className="text-xs text-gray-600 mb-1">
                            <Package className="w-3 h-3 inline mr-1" />
                            {product.name} - R$ {product.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </div>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
