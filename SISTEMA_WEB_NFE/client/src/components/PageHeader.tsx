import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  description?: string;
  showBack?: boolean;
  backUrl?: string;
}

export default function PageHeader({ title, description, showBack = true, backUrl }: PageHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (backUrl) {
      navigate(backUrl);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="mb-8">
      <div className="flex items-center gap-4 mb-2">
        {showBack && (
          <button
            onClick={handleBack}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Voltar"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
      </div>
      {description && (
        <p className="text-gray-600 ml-12">{description}</p>
      )}
    </div>
  );
}
