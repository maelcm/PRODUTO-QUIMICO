import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Plus, Trash2, Save } from 'lucide-react';

const itemSchema = z.object({
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.string().or(z.number()),
  unitOfMeasure: z.string().min(1, 'Unidade é obrigatória'),
  unitPrice: z.string().or(z.number()),
  totalPrice: z.string().or(z.number()),
  batchNumber: z.string().optional(),
  expirationDate: z.string().optional(),
  manufacturingDate: z.string().optional(),
  ncm: z.string().optional(),
});

const formSchema = z.object({
  accessKey: z.string().length(44, 'Chave de acesso deve ter exatamente 44 dígitos'),
  invoiceNumber: z.string().min(1, 'Número da nota é obrigatório'),
  emitterName: z.string().min(1, 'Nome do emitente é obrigatório'),
  emitterCNPJ: z.string().min(1, 'CNPJ é obrigatório'),
  emissionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  totalValue: z.string().or(z.number()),
  items: z.array(itemSchema).min(1, 'Adicione pelo menos um item'),
});

type FormData = z.infer<typeof formSchema>;

export default function NfeCreate() {
  const navigate = useNavigate();
  const createMutation = trpc.nfe.create.useMutation({
    onSuccess: () => {
      alert('Nota fiscal cadastrada com sucesso!');
      navigate('/nfe');
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const { register, handleSubmit, control, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      accessKey: '',
      invoiceNumber: '',
      emitterName: '',
      emitterCNPJ: '',
      emissionDate: '',
      totalValue: '0',
      items: [{ productName: '', quantity: '', unitOfMeasure: 'UN', unitPrice: '', totalPrice: '' }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'items',
  });

  const items = watch('items');

  // Calcular total automático
  const calculateTotal = () => {
    const total = items.reduce((sum, item) => {
      return sum + (Number(item.totalPrice) || 0);
    }, 0);
    setValue('totalValue', total);
  };

  // Calcular total de um item
  const calculateItemTotal = (index: number) => {
    const quantity = Number(items[index].quantity) || 0;
    const unitPrice = Number(items[index].unitPrice) || 0;
    const total = quantity * unitPrice;
    setValue(`items.${index}.totalPrice`, total);
    calculateTotal();
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Cadastrar Nota Fiscal"
        description="Cadastre uma nova nota fiscal usando a chave de acesso (44 dígitos)"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Dados da Nota Fiscal */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Dados da Nota Fiscal</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chave de Acesso (44 dígitos) *
              </label>
              <input
                type="text"
                {...register('accessKey')}
                maxLength={44}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="Digite a chave de acesso"
              />
              {errors.accessKey && (
                <p className="mt-1 text-sm text-red-600">{errors.accessKey.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número da Nota *
              </label>
              <input
                type="text"
                {...register('invoiceNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.invoiceNumber && (
                <p className="mt-1 text-sm text-red-600">{errors.invoiceNumber.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Emitente *
              </label>
              <input
                type="text"
                {...register('emitterName')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.emitterName && (
                <p className="mt-1 text-sm text-red-600">{errors.emitterName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                CNPJ do Emitente *
              </label>
              <input
                type="text"
                {...register('emitterCNPJ')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.emitterCNPJ && (
                <p className="mt-1 text-sm text-red-600">{errors.emitterCNPJ.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Emissão *
              </label>
              <input
                type="date"
                {...register('emissionDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.emissionDate && (
                <p className="mt-1 text-sm text-red-600">{errors.emissionDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total
              </label>
              <input
                type="text"
                {...register('totalValue')}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
              />
            </div>
          </div>
        </div>

        {/* Itens */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Itens da Nota Fiscal</h2>
            <button
              type="button"
              onClick={() => append({ productName: '', quantity: '', unitOfMeasure: 'UN', unitPrice: '', totalPrice: '' })}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Adicionar Item
            </button>
          </div>

          {fields.map((field, index) => (
            <div key={field.id} className="border border-gray-200 rounded-lg p-4 mb-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium">Item {index + 1}</h3>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      remove(index);
                      calculateTotal();
                    }}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Produto *
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.productName`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantidade *
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    {...register(`items.${index}.quantity`)}
                    onChange={(e) => {
                      setValue(`items.${index}.quantity`, e.target.value);
                      calculateItemTotal(index);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unidade *
                  </label>
                  <select
                    {...register(`items.${index}.unitOfMeasure`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="UN">UN</option>
                    <option value="KG">KG</option>
                    <option value="G">G</option>
                    <option value="L">L</option>
                    <option value="ML">ML</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Preço Unitário *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    {...register(`items.${index}.unitPrice`)}
                    onChange={(e) => {
                      setValue(`items.${index}.unitPrice`, e.target.value);
                      calculateItemTotal(index);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Total
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.totalPrice`)}
                    readOnly
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Lote
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.batchNumber`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Validade
                  </label>
                  <input
                    type="date"
                    {...register(`items.${index}.expirationDate`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fabricação
                  </label>
                  <input
                    type="date"
                    {...register(`items.${index}.manufacturingDate`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    NCM
                  </label>
                  <input
                    type="text"
                    {...register(`items.${index}.ncm`)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Botões */}
        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/nfe')}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={createMutation.isPending}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {createMutation.isPending ? 'Salvando...' : 'Salvar Nota Fiscal'}
          </button>
        </div>
      </form>
    </div>
  );
}
