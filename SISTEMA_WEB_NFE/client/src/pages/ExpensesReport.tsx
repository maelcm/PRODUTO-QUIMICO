import { useState } from 'react';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { FileText, Download, Calendar, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDate } from '../lib/utils';

type ReportType = 'daily' | 'weekly' | 'monthly' | 'annual';

export default function ExpensesReport() {
  const [reportType, setReportType] = useState<ReportType>('daily');
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 7); // Últimos 7 dias
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });

  const { data: report, isLoading, refetch } = trpc.expenses.getExpensesReport.useQuery(
    { startDate, endDate, reportType },
    { enabled: !!startDate && !!endDate }
  );

  const handleQuickFilter = (days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - days);
    setStartDate(start.toISOString().split('T')[0]);
    setEndDate(end.toISOString().split('T')[0]);
  };

  const handleExportPDF = () => {
    if (!report) return;

    // Criar conteúdo HTML para impressão
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Relatório de Gastos - ${reportType}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 20px;
            max-width: 1200px;
            margin: 0 auto;
          }
          h1 {
            color: #1f2937;
            border-bottom: 3px solid #3b82f6;
            padding-bottom: 10px;
          }
          .header {
            margin-bottom: 30px;
          }
          .info {
            display: flex;
            gap: 20px;
            margin: 10px 0;
          }
          .info-item {
            padding: 10px;
            background: #f3f4f6;
            border-radius: 5px;
          }
          .group {
            margin: 30px 0;
            page-break-inside: avoid;
          }
          .group-title {
            background: #3b82f6;
            color: white;
            padding: 10px;
            font-size: 18px;
            font-weight: bold;
            margin-bottom: 10px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          th, td {
            border: 1px solid #d1d5db;
            padding: 8px;
            text-align: left;
          }
          th {
            background: #f3f4f6;
            font-weight: bold;
          }
          .total-row {
            background: #fef3c7;
            font-weight: bold;
          }
          .summary {
            background: #dbeafe;
            padding: 20px;
            border-radius: 10px;
            margin-top: 30px;
          }
          .summary-item {
            display: flex;
            justify-content: space-between;
            margin: 10px 0;
            font-size: 18px;
          }
          @media print {
            button { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Relatório de Gastos de Estoque</h1>
          <div class="info">
            <div class="info-item"><strong>Tipo:</strong> ${reportType === 'daily' ? 'Diário' : reportType === 'weekly' ? 'Semanal' : reportType === 'monthly' ? 'Mensal' : 'Anual'}</div>
            <div class="info-item"><strong>Período:</strong> ${formatDate(startDate)} a ${formatDate(endDate)}</div>
            <div class="info-item"><strong>Total de Registros:</strong> ${report.totals.count}</div>
          </div>
        </div>

        ${Object.entries(report.grouped).map(([period, expenses]: [string, any[]]) => `
          <div class="group">
            <div class="group-title">${period}</div>
            <table>
              <thead>
                <tr>
                  <th>Data</th>
                  <th>Produto</th>
                  <th>Quantidade</th>
                  <th>Valor Total</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                ${expenses.map(exp => `
                  <tr>
                    <td>${formatDate(exp.expenseDate)}</td>
                    <td>${exp.productName}</td>
                    <td>${exp.quantityUsed}</td>
                    <td>${formatCurrency(exp.totalExpense)}</td>
                    <td>${exp.description || '-'}</td>
                  </tr>
                `).join('')}
                <tr class="total-row">
                  <td colspan="2">Total do Período</td>
                  <td>${expenses.reduce((sum, exp) => sum + Number(exp.quantityUsed || 0), 0)}</td>
                  <td>${formatCurrency(expenses.reduce((sum, exp) => sum + Number(exp.totalExpense || 0), 0))}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        `).join('')}

        <div class="summary">
          <h2>Resumo Geral</h2>
          <div class="summary-item">
            <span>Total de Gastos:</span>
            <span><strong>${report.totals.count}</strong></span>
          </div>
          <div class="summary-item">
            <span>Quantidade Total Consumida:</span>
            <span><strong>${report.totals.totalQuantity}</strong></span>
          </div>
          <div class="summary-item">
            <span>Valor Total:</span>
            <span><strong>${formatCurrency(report.totals.totalValue)}</strong></span>
          </div>
        </div>

        <p style="margin-top: 50px; text-align: center; color: #6b7280; font-size: 12px;">
          Relatório gerado em ${new Date().toLocaleString('pt-BR')}
        </p>
      </body>
      </html>
    `;

    // Abrir janela de impressão
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Relatórios de Gastos"
        description="Visualize e exporte relatórios de consumo de estoque"
        icon={FileText}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filtros */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Relatório
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ReportType)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="daily">Diário</option>
                <option value="weekly">Semanal</option>
                <option value="monthly">Mensal</option>
                <option value="annual">Anual</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Inicial
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data Final
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-end">
              <button
                onClick={() => refetch()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <Calendar className="inline-block w-4 h-4 mr-2" />
                Gerar Relatório
              </button>
            </div>
          </div>

          {/* Filtros Rápidos */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => handleQuickFilter(7)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Últimos 7 dias
            </button>
            <button
              onClick={() => handleQuickFilter(30)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Últimos 30 dias
            </button>
            <button
              onClick={() => handleQuickFilter(90)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Últimos 3 meses
            </button>
            <button
              onClick={() => handleQuickFilter(365)}
              className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
            >
              Último ano
            </button>
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Gerando relatório...</p>
          </div>
        )}

        {/* Relatório */}
        {!isLoading && report && (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Gastos</p>
                    <p className="text-2xl font-bold text-gray-900">{report.totals.count}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-blue-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Quantidade Total</p>
                    <p className="text-2xl font-bold text-gray-900">{report.totals.totalQuantity.toFixed(2)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Valor Total</p>
                    <p className="text-2xl font-bold text-gray-900">{formatCurrency(report.totals.totalValue)}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-600" />
                </div>
              </div>
            </div>

            {/* Botão Exportar */}
            <div className="mb-6 flex justify-end">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Exportar / Imprimir PDF
              </button>
            </div>

            {/* Gastos Agrupados */}
            {Object.entries(report.grouped).map(([period, expenses]: [string, any[]]) => (
              <div key={period} className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">
                  {period}
                </h3>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor Total</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {expenses.map((expense, idx) => (
                        <tr key={idx} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.expenseDate)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">{expense.productName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{expense.quantityUsed}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(expense.totalExpense)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-500">{expense.description || '-'}</td>
                        </tr>
                      ))}
                      <tr className="bg-yellow-50 font-bold">
                        <td className="px-6 py-4 text-sm text-gray-900" colSpan={2}>Total do Período</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {expenses.reduce((sum, exp) => sum + Number(exp.quantityUsed || 0), 0).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(expenses.reduce((sum, exp) => sum + Number(exp.totalExpense || 0), 0))}
                        </td>
                        <td></td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {/* Sem dados */}
            {report.totals.count === 0 && (
              <div className="bg-white rounded-lg shadow-md p-12 text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum gasto encontrado no período selecionado.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
