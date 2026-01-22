import { useState } from 'react';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { LineChart as LineChartIcon, BarChart3, Calendar, TrendingUp } from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';

type PeriodType = 'daily' | 'weekly' | 'monthly' | 'yearly';

export default function ConsumptionCharts() {
  const [period, setPeriod] = useState<PeriodType>('monthly');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // 6 meses atrás
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const { data: expenses } = trpc.expenses.getDailyExpenses.useQuery({
    startDate,
    endDate,
  });

  // Agrupar gastos por data
  const groupByPeriod = () => {
    if (!expenses) return [];

    const grouped = new Map<string, number>();

    expenses.forEach(expense => {
      const date = new Date(expense.expenseDate);
      let key = '';

      switch (period) {
        case 'daily':
          key = date.toLocaleDateString('pt-BR');
          break;
        case 'weekly':
          const weekNumber = Math.ceil((date.getDate() + new Date(date.getFullYear(), date.getMonth(), 1).getDay()) / 7);
          key = `Semana ${weekNumber} - ${date.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}`;
          break;
        case 'monthly':
          key = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
          break;
        case 'yearly':
          key = date.getFullYear().toString();
          break;
      }

      grouped.set(key, (grouped.get(key) || 0) + Number(expense.totalExpense || 0));
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ name, valor: value }))
      .sort((a, b) => a.name.localeCompare(b.name));
  };

  // Agrupar gastos por produto
  const groupByProduct = () => {
    if (!expenses) return [];

    const grouped = new Map<string, number>();

    expenses.forEach(expense => {
      const productName = expense.productName;
      grouped.set(productName, (grouped.get(productName) || 0) + Number(expense.totalExpense || 0));
    });

    return Array.from(grouped.entries())
      .map(([name, value]) => ({ 
        name: name.length > 25 ? name.substring(0, 25) + '...' : name,
        valor: value 
      }))
      .sort((a, b) => b.valor - a.valor)
      .slice(0, 15); // Top 15 produtos
  };

  const chartData = groupByPeriod();
  const productData = groupByProduct();

  const totalGasto = expenses?.reduce((sum, exp) => sum + Number(exp.totalExpense || 0), 0) || 0;
  const mediaGasto = chartData.length > 0 ? totalGasto / chartData.length : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Gráficos de Consumo"
        subtitle="Análise visual de gastos ao longo do tempo"
        icon={LineChartIcon}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-lg font-semibold mb-4">Filtros</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Período
              </label>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value as PeriodType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="yearly">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Início
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Fim
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => {
                  const date = new Date();
                  date.setMonth(date.getMonth() - 6);
                  setStartDate(date.toISOString().split('T')[0]);
                  setEndDate(new Date().toISOString().split('T')[0]);
                }}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Últimos 6 meses
              </button>
            </div>
          </div>
        </div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total do Período</p>
                <p className="text-3xl font-bold text-indigo-600">
                  R$ {totalGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="w-12 h-12 text-indigo-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Média por {period === 'daily' ? 'Dia' : period === 'weekly' ? 'Semana' : period === 'monthly' ? 'Mês' : 'Ano'}</p>
                <p className="text-3xl font-bold text-green-600">
                  R$ {mediaGasto.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <BarChart3 className="w-12 h-12 text-green-600 opacity-20" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total de Gastos</p>
                <p className="text-3xl font-bold text-blue-600">{expenses?.length || 0}</p>
              </div>
              <Calendar className="w-12 h-12 text-blue-600 opacity-20" />
            </div>
          </div>
        </div>

        {/* Gráfico de Linha - Evolução ao Longo do Tempo */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <LineChartIcon className="w-5 h-5" />
            Evolução de Gastos ao Longo do Tempo
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorValor" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={100}
                interval={0}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Area 
                type="monotone" 
                dataKey="valor" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorValor)"
                name="Gasto"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Gráfico de Barras - Top Produtos */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Top 15 Produtos Mais Consumidos
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={productData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45} 
                textAnchor="end" 
                height={150}
                interval={0}
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
              />
              <Bar dataKey="valor" fill="#10b981" name="Gasto Total" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
