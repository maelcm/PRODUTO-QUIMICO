import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trpc } from './lib/trpc';
import { trpcClient } from './lib/trpcClient';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import NfeList from './pages/NfeList';
import NfeCreate from './pages/NfeCreate';
import NfeDetail from './pages/NfeDetail';
import NfeUploadXml from './pages/NfeUploadXml';
import ManualProductCreate from './pages/ManualProductCreate';
import Traceability from './pages/Traceability';
import StockControl from './pages/StockControl';
import ExpensesReport from './pages/ExpensesReport';
import SuppliersAnalytics from './pages/SuppliersAnalytics';
import ConsumptionCharts from './pages/ConsumptionCharts';
import OcrUpload from './pages/OcrUpload';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  // Para GitHub Pages, usar o basename do VITE_BASE_PATH
  const basename = import.meta.env.VITE_BASE_PATH || '/';
  
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter basename={basename}>
          <div className="min-h-screen bg-gray-50">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/nfe" element={<NfeList />} />
              <Route path="/nfe/create" element={<NfeCreate />} />
              <Route path="/nfe/:id" element={<NfeDetail />} />
              <Route path="/nfe/upload-xml" element={<NfeUploadXml />} />
              <Route path="/manual" element={<ManualProductCreate />} />
              <Route path="/traceability" element={<Traceability />} />
              <Route path="/stock" element={<StockControl />} />
              <Route path="/reports" element={<ExpensesReport />} />
              <Route path="/suppliers" element={<SuppliersAnalytics />} />
              <Route path="/consumption" element={<ConsumptionCharts />} />
              <Route path="/ocr" element={<OcrUpload />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </BrowserRouter>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

export default App;
