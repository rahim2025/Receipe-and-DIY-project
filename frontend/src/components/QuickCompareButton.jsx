import React from 'react';
import { DollarSign, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickCompareButton = ({ itemName, category, type }) => {
  const navigate = useNavigate();

  const handleQuickCompare = () => {
    const searchParams = new URLSearchParams({
      name: itemName,
      ...(category && { category }),
      ...(type && { type })
    });
    
    navigate(`/price-comparison?${searchParams}`);
  };

  return (
    <button
      onClick={handleQuickCompare}
      className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 transition-colors"
      title={`Compare prices for ${itemName}`}
    >
      <DollarSign className="h-3 w-3 mr-1" />
      Compare Prices
      <ExternalLink className="h-3 w-3 ml-1" />
    </button>
  );
};

export default QuickCompareButton;