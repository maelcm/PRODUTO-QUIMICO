import { useState } from 'react';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Upload, FileImage, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function OcrUpload() {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [processedData, setProcessedData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const processImage = trpc.ocr.processImage.useMutation({
    onSuccess: (data) => {
      setProcessedData(data);
      setError(null);
    },
    onError: (error) => {
      setError(error.message);
      setProcessedData(null);
    },
  });

  const handleImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setError('Por favor, selecione um arquivo de imagem');
        return;
      }

      setSelectedImage(file);
      setError(null);
      setProcessedData(null);

      // Criar preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleProcess = async () => {
    if (!selectedImage || !imagePreview) {
      setError('Por favor, selecione uma imagem primeiro');
      return;
    }

    try {
      // Converter imagem para base64
      const base64 = imagePreview.split(',')[1]; // Remover prefixo data:image/...;base64,
      
      processImage.mutate({
        imageBase64: base64,
      });
    } catch (err: any) {
      setError(err.message || 'Erro ao processar imagem');
    }
  };

  const handleReset = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setProcessedData(null);
    setError(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="OCR - Processamento de Listas Manuscritas"
        description="Faça upload de uma foto de lista manuscrita para extrair produtos automaticamente"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Coluna Esquerda - Upload */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upload de Imagem</h2>
            
            <div className="space-y-4">
              {/* Área de Upload */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-500 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <FileImage className="w-12 h-12 text-gray-400 mb-4" />
                  <span className="text-gray-600 mb-2">
                    Clique para selecionar ou arraste uma imagem
                  </span>
                  <span className="text-sm text-gray-400">
                    PNG, JPG, JPEG, GIF, WEBP
                  </span>
                </label>
              </div>

              {/* Preview da Imagem */}
              {imagePreview && (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full rounded-lg border border-gray-200"
                  />
                  {selectedImage && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Arquivo:</strong> {selectedImage.name} ({(selectedImage.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>
              )}

              {/* Botões */}
              <div className="flex gap-4">
                <button
                  onClick={handleProcess}
                  disabled={!selectedImage || processImage.isPending}
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {processImage.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Processar Imagem
                    </>
                  )}
                </button>
                
                {selectedImage && (
                  <button
                    onClick={handleReset}
                    disabled={processImage.isPending}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                  >
                    Limpar
                  </button>
                )}
              </div>

              {/* Erro */}
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">Erro</p>
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Coluna Direita - Resultados */}
        <div className="space-y-6">
          {processImage.isPending && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center justify-center gap-3 py-8">
                <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
                <span className="text-gray-600">Processando imagem com OCR...</span>
              </div>
            </div>
          )}

          {processedData && processedData.success && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h2 className="text-xl font-semibold">Resultados do Processamento</h2>
              </div>

              {processedData.message && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800">{processedData.message}</p>
                </div>
              )}

              {processedData.data?.aggregated && processedData.data.aggregated.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold mb-2">Produtos Agregados ({processedData.data.aggregated.length})</h3>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produto</th>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantidade (kg)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {processedData.data.aggregated.map((item: any, idx: number) => (
                            <tr key={idx} className="hover:bg-gray-50">
                              <td className="px-4 py-2 text-sm">{item.produto_original || item.produto || '-'}</td>
                              <td className="px-4 py-2 text-sm font-medium">
                                {item.quantidade_kg ? Number(item.quantidade_kg).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '-'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Estatísticas */}
                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Total de Produtos</p>
                      <p className="text-2xl font-bold">{processedData.data.aggregated.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Quantidade Total (kg)</p>
                      <p className="text-2xl font-bold">
                        {processedData.data.aggregated
                          .reduce((sum: number, item: any) => sum + (Number(item.quantidade_kg) || 0), 0)
                          .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {processedData.data?.aggregated && processedData.data.aggregated.length === 0 && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    Nenhum produto foi encontrado na imagem. Tente com outra imagem.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
