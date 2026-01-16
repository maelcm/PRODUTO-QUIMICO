import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Package, TrendingUp, Calendar, Trash2, Plus, CheckSquare, Square } from 'lucide-react';

const expenseSchema = z.object({
  productName: z.string().min(1, 'Selecione um produto'),
  invoiceNumber: z.string().optional(),
  expenseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  quantityUsed: z.string().or(z.number()),
  totalExpense: z.string().or(z.number()),
  description: z.string().optional(),
});

type ExpenseForm = z.infer<typeof expenseSchema>;

type SelectedBatch = {
  batchNumber: string | null;
  batchKey: string;
  quantityAvailable: number;
};

export default function StockControl() {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [selectedBatches, setSelectedBatches] = useState<Set<string>>(new Set());

  const { data: productNames } = trpc.products.getProductNames.useQuery();
  const { data: batches, refetch: refetchBatches } = trpc.products.getProductBatches.useQuery(
    { productName: selectedProduct },
    { enabled: !!selectedProduct }
  );

  const { data: expenses, refetch: refetchExpenses } = trpc.expenses.getDailyExpenses.useQuery();

  const createExpense = trpc.expenses.createDailyExpense.useMutation({
    onSuccess: () => {
      alert('Gasto registrado com sucesso!');
      refetchExpenses();
      refetchBatches();
      setSelectedBatches(new Set());
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const deleteExpense = trpc.expenses.deleteDailyExpense.useMutation({
    onSuccess: () => {
      refetchExpenses();
      refetchBatches();
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<ExpenseForm>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      expenseDate: new Date().toISOString().split('T')[0],
      quantityUsed: '',
      totalExpense: '',
    },
  });

  const quantityUsed = watch('quantityUsed');

  // Calcular valor total automaticamente
  useEffect(() => {
    const qty = Number(quantityUsed);
    
    if (!qty || isNaN(qty) || qty <= 0 || !batches || selectedBatches.size === 0) {
      setValue('totalExpense', '');
      return;
    }

    // Pegar o preço unitário médio dos lotes selecionados
    const selectedBatchesData = batches.filter(b => {
      const batchKey = b.batchNumber || 'SEM_LOTE';
      return selectedBatches.has(batchKey);
    });

    if (selectedBatchesData.length === 0) {
      setValue('totalExpense', '');
      return;
    }

    // Calcular preço médio ponderado
    let totalQuantity = 0;
    let weightedSum = 0;

    for (const batch of selectedBatchesData) {
      const qtyAvailable = Number(batch.quantityAvailable) || 0;
      const price = Number(batch.unitPrice) || 0;
      
      if (qtyAvailable > 0 && price > 0) {
        totalQuantity += qtyAvailable;
        weightedSum += qtyAvailable * price;
      }
    }

    if (totalQuantity === 0) {
      setValue('totalExpense', '0.00');
      return;
    }

    const averagePrice = weightedSum / totalQuantity;
    const total = qty * averagePrice;
    
    setValue('totalExpense', total.toFixed(2));
  }, [quantityUsed, batches, selectedBatches, setValue]);

  const toggleBatch = (batchKey: string) => {
    const newSelected = new Set(selectedBatches);
    if (newSelected.has(batchKey)) {
      newSelected.delete(batchKey);
    } else {
      newSelected.add(batchKey);
    }
    setSelectedBatches(newSelected);
  };

  const onSubmit = (data: ExpenseForm) => {
    if (selectedBatches.size === 0) {
      alert('Selecione pelo menos um lote para dar baixa!');
      return;
    }

    // Criar descrição com os lotes selecionados
    const selectedBatchesList = Array.from(selectedBatches)
      .map(key => {
        const batch = batches?.find(b => {
          const batchKey = b.batchNumber || 'SEM_LOTE';
          return batchKey === key;
        });
        return batch ? `Lote: ${batch.batchNumber || 'SEM_LOTE'}` : '';
      })
      .filter(Boolean)
      .join(', ');

    createExpense.mutate({
      ...data,
      productName: selectedProduct,
      description: `Lotes selecionados: ${selectedBatchesList}`,
    });
    reset();
    setSelectedBatches(new Set());
  };

  // Calcular estatísticas
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString().split('T')[0];

  const todayExpenses = expenses?.filter((e) => e.expenseDate === today) || [];
  const monthExpenses = expenses?.filter((e) => e.expenseDate >= firstDayOfMonth) || [];

  const todayTotal = todayExpenses.reduce((sum, e) => sum + Number(e.totalExpense), 0);
  const monthTotal = monthExpenses.reduce((sum, e) => sum + Number(e.totalExpense), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Controle de Estoque"
        description="Registre gastos diários e controle a quantidade disponível de produtos"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coluna Principal */}
        <div className="lg:col-span-2 space-y-6">
          {/* Seletor de Produto */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Selecionar Produto</h2>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">Selecione um produto...</option>
              {productNames?.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          {/* Lista de Lotes do Produto */}
          {selectedProduct && batches && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                Lotes Disponíveis - {selectedProduct}
              </h2>
              {batches.length === 0 ? (
                <p className="text-gray-500">Nenhum lote encontrado para este produto.</p>
              ) : (
                <div className="space-y-4">
                  {batches.map((batch, batchIdx) => {
                    const batchKey = batch.batchNumber || 'SEM_LOTE';
                    const isSelected = selectedBatches.has(batchKey);
                    const isAvailable = batch.totalAvailable > 0;
                    
                    return (
                      <div
                        key={batchIdx}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-indigo-500 bg-indigo-50'
                            : isAvailable
                            ? 'border-gray-200 hover:border-gray-300'
                            : 'border-gray-100 bg-gray-50 opacity-60'
                        }`}
                        onClick={() => isAvailable && toggleBatch(batchKey)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="mt-1">
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-indigo-600" />
                            ) : (
                              <Square className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="font-semibold text-lg">
                                {batch.batchNumber || 'SEM LOTE'}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                                isAvailable
                                  ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {isAvailable ? 'Disponível' : 'Indisponível'}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                              <div>
                                <p className="text-gray-500">Quantidade Total</p>
                                <p className="font-medium">
                                  {Number(batch.totalQuantity).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-500">Disponível</p>
                                <p className="font-medium text-green-600">
                                  {Number(batch.totalAvailable).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              {batch.expirationDate && (
                                <div>
                                  <p className="text-gray-500">Validade</p>
                                  <p className="font-medium">
                                    {new Date(batch.expirationDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              )}
                              {batch.manufacturingDate && (
                                <div>
                                  <p className="text-gray-500">Fabricação</p>
                                  <p className="font-medium">
                                    {new Date(batch.manufacturingDate).toLocaleDateString('pt-BR')}
                                  </p>
                                </div>
                              )}
                            </div>
                            
                            {batch.items.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-gray-200">
                                <p className="text-xs text-gray-500 mb-2">
                                  Itens deste lote ({batch.items.length}):
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {batch.items.map((item: any, itemIdx: number) => (
                                    <span
                                      key={itemIdx}
                                      className={`px-2 py-1 rounded text-xs ${
                                        item.origin === 'NF-e'
                                          ? 'bg-blue-100 text-blue-800'
                                          : 'bg-purple-100 text-purple-800'
                                      }`}
                                    >
                                      {item.invoiceNumber || 'Manual'} - {Number(item.quantityAvailable).toLocaleString('pt-BR')} {item.unitOfMeasure}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {selectedBatches.size > 0 && (
                    <div className="mt-4 p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm font-medium text-indigo-800">
                        {selectedBatches.size} lote(s) selecionado(s)
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Histórico de Gastos */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Histórico de Gastos</h2>
            {!expenses || expenses.length === 0 ? (
              <p className="text-gray-500">Nenhum gasto registrado ainda.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Data</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantidade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Valor</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {expenses.map((expense) => (
                      <tr key={expense.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">
                          {new Date(expense.expenseDate).toLocaleDateString('pt-BR')}
                        </td>
                        <td className="px-4 py-2 text-sm">{expense.productName}</td>
                        <td className="px-4 py-2 text-sm">{Number(expense.quantityUsed).toLocaleString('pt-BR')}</td>
                        <td className="px-4 py-2 text-sm font-medium">
                          R$ {Number(expense.totalExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <button
                            onClick={() => {
                              if (window.confirm('Tem certeza que deseja deletar este gasto?')) {
                                deleteExpense.mutate({ id: expense.id });
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Estatísticas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Estatísticas</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Gasto de Hoje</p>
                  <p className="text-2xl font-bold text-green-600">
                    R$ {todayTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>

              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600">Gasto do Mês</p>
                  <p className="text-2xl font-bold text-blue-600">
                    R$ {monthTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
            </div>
          </div>

          {/* Formulário de Registro */}
          {selectedProduct && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Registrar Baixa</h2>
              {selectedBatches.size === 0 && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Selecione pelo menos um lote acima para dar baixa
                  </p>
                </div>
              )}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto
                  </label>
                  <input
                    type="text"
                    value={selectedProduct}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>
                
                {selectedBatches.size > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Lotes Selecionados
                    </label>
                    <div className="p-3 bg-indigo-50 rounded-lg">
                      <p className="text-sm text-indigo-800">
                        {Array.from(selectedBatches).map(key => {
                          const batch = batches?.find(b => {
                            const batchKey = b.batchNumber || 'SEM_LOTE';
                            return batchKey === key;
                          });
                          return batch?.batchNumber || 'SEM LOTE';
                        }).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data do Gasto *
                  </label>
                  <input
                    type="date"
                    {...register('expenseDate')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.expenseDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.expenseDate.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade Usada *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    {...register('quantityUsed')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                  {errors.quantityUsed && (
                    <p className="mt-1 text-sm text-red-600">{errors.quantityUsed.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor Total (Calculado Automaticamente)
                  </label>
                  <input
                    type="text"
                    {...register('totalExpense')}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold text-green-600"
                    placeholder="R$ 0,00"
                  />
                  {errors.totalExpense && (
                    <p className="mt-1 text-sm text-red-600">{errors.totalExpense.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={createExpense.isPending}
                  className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  {createExpense.isPending ? 'Registrando...' : 'Registrar Gasto'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
