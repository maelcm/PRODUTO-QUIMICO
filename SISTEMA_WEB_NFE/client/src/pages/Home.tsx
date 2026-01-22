import { Link } from 'react-router-dom';
import { FileText, Upload, PenTool, Search, Package, TrendingUp, Camera, BarChart3, Store, LineChart } from 'lucide-react';

export default function Home() {
  const features = [
    {
      title: 'Minhas Notas Fiscais',
      description: 'Visualize e gerencie todas as suas notas fiscais cadastradas',
      icon: FileText,
      link: '/nfe',
      color: 'bg-blue-500',
    },
    {
      title: 'Cadastrar via Chave',
      description: 'Cadastre uma nota fiscal usando a chave de acesso (44 dígitos)',
      icon: PenTool,
      link: '/nfe/create',
      color: 'bg-green-500',
    },
    {
      title: 'Importar via XML',
      description: 'Faça upload de um arquivo XML e importe automaticamente',
      icon: Upload,
      link: '/nfe/upload-xml',
      color: 'bg-purple-500',
    },
    {
      title: 'Cadastro Manual',
      description: 'Cadastre produtos manualmente sem necessidade de NF-e',
      icon: PenTool,
      link: '/manual',
      color: 'bg-orange-500',
    },
    {
      title: 'Rastreabilidade',
      description: 'Dashboard completo com status de validade de todos os produtos',
      icon: Search,
      link: '/traceability',
      color: 'bg-indigo-500',
    },
    {
      title: 'Controle de Estoque',
      description: 'Registre gastos diários e controle o estoque disponível',
      icon: Package,
      link: '/stock',
      color: 'bg-red-500',
    },
    {
      title: 'Relatórios de Gastos',
      description: 'Visualize relatórios diários, semanais e mensais com exportação PDF',
      icon: BarChart3,
      link: '/reports',
      color: 'bg-yellow-500',
    },
    {
      title: 'Dashboard de Fornecedores',
      description: 'Análise detalhada de compras e gastos por fornecedor',
      icon: Store,
      link: '/suppliers',
      color: 'bg-pink-500',
    },
    {
      title: 'Gráficos de Consumo',
      description: 'Visualize gráficos de consumo e gastos ao longo do tempo',
      icon: LineChart,
      link: '/consumption',
      color: 'bg-cyan-500',
    },
    {
      title: 'OCR - Processar Lista',
      description: 'Faça upload de foto de lista manuscrita e extraia produtos automaticamente',
      icon: Camera,
      link: '/ocr',
      color: 'bg-teal-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Sistema de Cadastro de NF-e
          </h1>
          <p className="text-xl text-gray-600">
            Gerenciamento completo de notas fiscais e rastreabilidade de produtos químicos
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Link
                key={feature.link}
                to={feature.link}
                className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow group"
              >
                <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="w-6 h-6 text-indigo-600" />
            <h2 className="text-2xl font-bold text-gray-900">Funcionalidades Principais</h2>
          </div>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-gray-600">
            <li>✅ Cadastro de NF-e via chave de acesso (44 dígitos)</li>
            <li>✅ Upload e parse automático de arquivos XML</li>
            <li>✅ Cadastro manual de produtos sem NF-e</li>
            <li>✅ Rastreabilidade completa com status de validade</li>
            <li>✅ Controle de estoque e gastos diários</li>
            <li>✅ Relatórios de gastos com exportação PDF</li>
            <li>✅ Cálculo automático de quantidade disponível</li>
            <li>✅ Dashboard unificado (NF-e + produtos manuais)</li>
            <li>✅ Filtros avançados por produto, lote e status</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
