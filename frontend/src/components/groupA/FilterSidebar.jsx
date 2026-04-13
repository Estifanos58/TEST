import { ChevronDown, ChevronUp, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';

export function FilterSidebar({ filters, onFilterChange }) {
  const [expandedSections, setExpandedSections] = useState({
    category: true,
    rating: true,
    location: true,
    format: true,
    price: true
  });

  const categories = [
    'Technology', 'Sport', 'Art', 'Educational', 'Music', 'Cultural', 'Business', 'Food'
  ];

  const ratings = [5, 4, 3, 2, 1];
  const locations = ['Addis Ababa', 'Bahir Dar', 'Gondar', 'Hawassa', 'Mekelle', 'Dire Dawa'];
  const formats = ['In Person', 'Online', 'Hybrid'];

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleCheckboxChange = (filterType, value) => {
    const currentValues = filters[filterType] || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter(v => v !== value)
      : [...currentValues, value];
    onFilterChange({ ...filters, [filterType]: newValues });
  };

  const handlePriceChange = (min, max) => {
    onFilterChange({ ...filters, price: { min, max } });
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 sticky top-20">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
        <h3 className="font-bold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="size-4" />
          Filters
        </h3>
        <button 
          onClick={() => onFilterChange({})}
          className="text-sm text-green-600 hover:text-green-700 font-medium"
        >
          Reset All
        </button>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <button 
          onClick={() => toggleSection('category')}
          className="w-full flex items-center justify-between py-2 text-gray-900 font-semibold"
        >
          <span>Category</span>
          {expandedSections.category ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedSections.category && (
          <div className="space-y-2 mt-2">
            {categories.map(cat => (
              <label key={cat} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-green-600">
                <input
                  type="checkbox"
                  checked={filters.category?.includes(cat) || false}
                  onChange={() => handleCheckboxChange('category', cat)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {cat}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-4">
        <button 
          onClick={() => toggleSection('rating')}
          className="w-full flex items-center justify-between py-2 text-gray-900 font-semibold"
        >
          <span>Rating</span>
          {expandedSections.rating ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedSections.rating && (
          <div className="space-y-2 mt-2">
            {ratings.map(rating => (
              <label key={rating} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-green-600">
                <input
                  type="checkbox"
                  checked={filters.rating?.includes(rating) || false}
                  onChange={() => handleCheckboxChange('rating', rating)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {rating} Stars & Up
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Location Filter */}
      <div className="mb-4">
        <button 
          onClick={() => toggleSection('location')}
          className="w-full flex items-center justify-between py-2 text-gray-900 font-semibold"
        >
          <span>Location</span>
          {expandedSections.location ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedSections.location && (
          <div className="space-y-2 mt-2">
            {locations.map(loc => (
              <label key={loc} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-green-600">
                <input
                  type="checkbox"
                  checked={filters.location?.includes(loc) || false}
                  onChange={() => handleCheckboxChange('location', loc)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {loc}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Format Filter */}
      <div className="mb-4">
        <button 
          onClick={() => toggleSection('format')}
          className="w-full flex items-center justify-between py-2 text-gray-900 font-semibold"
        >
          <span>Event Format</span>
          {expandedSections.format ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedSections.format && (
          <div className="space-y-2 mt-2">
            {formats.map(format => (
              <label key={format} className="flex items-center gap-2 cursor-pointer text-sm text-gray-700 hover:text-green-600">
                <input
                  type="checkbox"
                  checked={filters.format?.includes(format) || false}
                  onChange={() => handleCheckboxChange('format', format)}
                  className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                />
                {format}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Filter */}
      <div className="mb-4">
        <button 
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between py-2 text-gray-900 font-semibold"
        >
          <span>Price Range</span>
          {expandedSections.price ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
        </button>
        {expandedSections.price && (
          <div className="space-y-3 mt-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.price?.min || ''}
                onChange={(e) => handlePriceChange(Number(e.target.value), filters.price?.max)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.price?.max || ''}
                onChange={(e) => handlePriceChange(filters.price?.min, Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <button 
              onClick={() => handlePriceChange(0, 0)}
              className="text-xs text-green-600 hover:text-green-700"
            >
              Free Events
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Update for: feat(frontdoor): implement POST /api/payments/init with reservation and cart lock checks
// Update for: feat(frontdoor): add order creation and Chapa payment initialization integration
// Update for: feat(frontdoor): align SQL patch for users and orders constraints in database scripts
// Update for: feat(frontdoor): add saved tickets UI and wallet summary view
// Update for: feat(frontdoor): implement checkout timer display and payment button
// Update for: feat(frontdoor): finalize users, orders, and order_items schema constraints in Prisma
// Update for: feat(frontdoor): coordinate frontdoor integration and resolve merge conflicts