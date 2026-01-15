import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { trpc } from '../lib/trpc';
import PageHeader from '../components/PageHeader';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';

export default function NfeUploadXml() {
  const navigate = useNavigate();
  const [xmlContent, setXmlContent] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [parsedData, setParsedData] = useState<any>(null);

  const parseMutation = trpc.nfe.parseXml.useMutation({
    onSuccess: (data) => {
      console.log('XML processado com sucesso:', data);
      setParsedData(data);
    },
    onError: (error) => {
      console.error('Erro ao processar XML:', error);
      const errorMessage = error.message || 'Erro desconhecido ao processar XML';
      alert(`Erro ao processar XML: ${errorMessage}\n\nVerifique o console para mais detalhes.`);
    },
  });

  const createMutation = trpc.nfe.create.useMutation({
    onSuccess: () => {
      alert('Nota fiscal cadastrada com sucesso!');
      navigate('/nfe');
    },
    onError: (error) => {
      alert(`Erro: ${error.message}`);
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.xml')) {
      alert('Por favor, selecione um arquivo XML');
      return;
    }

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setXmlContent(content);
      setParsedData(null);
    };
    reader.readAsText(file);
  };

  const handleParse = () => {
    if (!xmlContent) {
      alert('Por favor, selecione um arquivo XML primeiro');
      return;
    }
    parseMutation.mutate({ xmlContent });
  };

  const handleSave = () => {
    if (!parsedData) {
      alert('Por favor, processe o XML primeiro');
      return;
    }

    // Converter dados parseados para o formato esperado
    const invoiceData = {
      accessKey: parsedData.accessKey,
      invoiceNumber: parsedData.invoiceNumber,
      emitterName: parsedData.emitterName,
      emitterCNPJ: parsedData.emitterCNPJ,
      emissionDate: parsedData.emissionDate,
      totalValue: parsedData.totalValue,
      items: parsedData.items.map((item: any) => ({
        productName: item.productName,
        quantity: item.quantity,
        unitOfMeasure: item.unitOfMeasure,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        batchNumber: item.batchNumber,
        expirationDate: item.expirationDate,
        manufacturingDate: item.manufacturingDate,
        ncm: item.ncm,
      })),
    };

    createMutation.mutate(invoiceData);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Importar NF-e via XML"
        description="Faça upload de um arquivo XML da nota fiscal e importe automaticamente"
      />

      <div className="space-y-6">
        {/* Upload */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Upload do Arquivo XML</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <label htmlFor="xml-file" className="cursor-pointer">
              <span className="text-indigo-600 hover:text-indigo-700 font-medium">
                Clique para selecionar um arquivo XML
              </span>
              <input
                id="xml-file"
                type="file"
                accept=".xml"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {fileName && (
              <p className="mt-2 text-sm text-gray-600">
                <FileText className="w-4 h-4 inline mr-2" />
                {fileName}
              </p>
            )}
          </div>

          {xmlContent && (
            <button
              onClick={handleParse}
              disabled={parseMutation.isPending}
              className="mt-4 w-full bg-indigo-600 text-white px-6 py-3 rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              {parseMutation.isPending ? 'Processando...' : 'Processar XML'}
            </button>
          )}
        </div>

        {/* Resultado do Parse */}
        {parsedData && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-2 mb-4">
              <Check className="w-5 h-5 text-green-600" />
              <h2 className="text-xl font-semibold">Dados Extraídos</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-500">Número da Nota</p>
                <p className="text-lg font-medium">{parsedData.invoiceNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Emitente</p>
                <p className="text-lg font-medium">{parsedData.emitterName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="text-lg font-medium">{parsedData.emitterCNPJ}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Data de Emissão</p>
                <p className="text-lg font-medium">{parsedData.emissionDate}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Valor Total</p>
                <p className="text-lg font-medium text-green-600">
                  R$ {Number(parsedData.totalValue).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Itens</p>
                <p className="text-lg font-medium">{parsedData.items.length} produto(s)</p>
              </div>
            </div>

            {/* Lista de Itens */}
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Itens:</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Produto</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Quantidade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Unidade</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Lote</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Validade</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {parsedData.items.map((item: any, index: number) => (
                      <tr key={index}>
                        <td className="px-4 py-2 text-sm">{item.productName}</td>
                        <td className="px-4 py-2 text-sm">{item.quantity}</td>
                        <td className="px-4 py-2 text-sm">{item.unitOfMeasure}</td>
                        <td className="px-4 py-2 text-sm">{item.batchNumber || '-'}</td>
                        <td className="px-4 py-2 text-sm">{item.expirationDate || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-4">
              <button
                onClick={() => {
                  setParsedData(null);
                  setXmlContent('');
                  setFileName('');
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Limpar
              </button>
              <button
                onClick={handleSave}
                disabled={createMutation.isPending}
                className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar Nota Fiscal'}
              </button>
            </div>
          </div>
        )}

        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <p className="text-sm text-blue-800">
              <strong>Dica:</strong> Certifique-se de que o arquivo XML está no formato correto da NF-e.
              O sistema tentará extrair automaticamente informações como lote e validade dos campos de
              informações adicionais (infAdProd).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
