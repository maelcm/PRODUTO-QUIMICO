import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Save } from 'lucide-react';
import { useEffect } from 'react';

const formSchema = z.object({
  productName: z.string().min(1, 'Nome do produto é obrigatório'),
  quantity: z.string().or(z.number()),
  unitOfMeasure: z.string().min(1, 'Unidade é obrigatória'),
  unitPrice: z.string().or(z.number()),
  totalPrice: z.string().or(z.number()),
  batchNumber: z.string().optional(),
  expirationDate: z.string().optional(),
  manufacturingDate: z.string().optional(),
  purchaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  supplier: z.string().optional(),
  voucherNumber: z.string().optional(),
  observations: z.string().optional(),
}).refine((data) => {
  if (data.expirationDate) {
    const expDate = new Date(data.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return expDate >= today;
  }
  return true;
}, {
  message: 'Data de validade não pode ser no passado',
  path: ['expirationDate'],
});

type FormData = z.infer<typeof formSchema>;

export default function ManualProductCreate() {
  const navigate = useNavigate();
  
  // Buscar nomes de produtos existentes
  const { data: productNames } = trpc.products.getProductNames.useQuery();
  
  // Buscar todos os produtos para autocomplete
  const { data: allProducts } = trpc.products.getAllProducts.useQuery();
  
  const createMutation = trpc.products.createManual.useMutation({
    onSuccess: () => {
      alert('Produto cadastrado com sucesso!');
      navigate('/traceability');
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      productName: '',
      quantity: '',
      unitOfMeasure: 'KG',
      unitPrice: '',
      totalPrice: '0',
      purchaseDate: new Date().toISOString().split('T')[0],
    },
  });

  const productName = watch('productName');
  const quantity = watch('quantity');
  const unitPrice = watch('unitPrice');
  
  // Preencher automaticamente dados de produto existente
  useEffect(() => {
    if (!productName || !allProducts) return;
    
    // Buscar último produto com esse nome
    const existingProduct = allProducts
      .filter(p => p.productName.toLowerCase() === productName.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
    
    if (existingProduct) {
      // Preencher campos automaticamente
      if (existingProduct.supplier) {
        setValue('supplier', existingProduct.supplier);
      }
      if (existingProduct.unitPrice) {
        setValue('unitPrice', existingProduct.unitPrice);
      }
      if (existingProduct.unitOfMeasure) {
        setValue('unitOfMeasure', existingProduct.unitOfMeasure);
      }
    }
  }, [productName, allProducts, setValue]);

  // Calcular total automaticamente
  const calculateTotal = () => {
    const qty = Number(quantity) || 0;
    const price = Number(unitPrice) || 0;
    setValue('totalPrice', (qty * price).toString());
  };

  const onSubmit = (data: FormData) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Cadastrar Produto Manualmente"
        description="Cadastre um produto sem necessidade de nota fiscal"
      />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Informações do Produto</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nome do Produto * <span className="text-xs text-gray-500">(Digite para ver sugestões)</span>
              </label>
              <input
                type="text"
                {...register('productName')}
                list="product-suggestions"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                placeholder="Digite o nome do produto..."
              />
              <datalist id="product-suggestions">
                {productNames?.map((name, idx) => (
                  <option key={idx} value={name} />
                ))}
              </datalist>
              {errors.productName && (
                <p className="mt-1 text-sm text-red-600">{errors.productName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                step="0.001"
                {...register('quantity')}
                onChange={(e) => {
                  setValue('quantity', e.target.value);
                  calculateTotal();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Unidade de Medida *
              </label>
              <select
                {...register('unitOfMeasure')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="KG">KG</option>
                <option value="G">G</option>
                <option value="L">L</option>
                <option value="ML">ML</option>
                <option value="UN">UN</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Preço Unitário *
              </label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice')}
                onChange={(e) => {
                  setValue('unitPrice', e.target.value);
                  calculateTotal();
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Total
              </label>
              <input
                type="text"
                {...register('totalPrice')}
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
                {...register('batchNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Compra *
              </label>
              <input
                type="date"
                {...register('purchaseDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.purchaseDate && (
                <p className="mt-1 text-sm text-red-600">{errors.purchaseDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Validade
              </label>
              <input
                type="date"
                {...register('expirationDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
              {errors.expirationDate && (
                <p className="mt-1 text-sm text-red-600">{errors.expirationDate.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data de Fabricação
              </label>
              <input
                type="date"
                {...register('manufacturingDate')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fornecedor
              </label>
              <input
                type="text"
                {...register('supplier')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Número do Comprovante
              </label>
              <input
                type="text"
                {...register('voucherNumber')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Observações
              </label>
              <textarea
                {...register('observations')}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-4">
          <button
            type="button"
            onClick={() => navigate('/')}
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
            {createMutation.isPending ? 'Salvando...' : 'Salvar Produto'}
          </button>
        </div>
      </form>
    </div>
  );
}
