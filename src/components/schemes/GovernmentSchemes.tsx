import React, { useState, useMemo } from 'react';
import { Search, Filter, FileText } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import { Scheme } from '../../types/schemes';
import schemesService from '../../services/schemesService';
import SchemeCard from './SchemeCard';
import SchemeDetail from './SchemeDetail';

export default function GovernmentSchemes() {
  const { language, t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedScheme, setSelectedScheme] = useState<Scheme | null>(null);
  
  const lang = language === 'malayalam' ? 'ml' : 'en';
  const allSchemes = schemesService.getAllSchemes();
  const categories = schemesService.getCategories();

  // Filter and search schemes
  const filteredSchemes = useMemo(() => {
    let schemes = allSchemes;

    // Filter by category
    if (selectedCategory !== 'all') {
      schemes = schemes.filter(scheme => scheme.category === selectedCategory);
    }

    // Search
    if (searchQuery.trim()) {
      schemes = schemesService.searchSchemes(searchQuery.trim(), lang);
      
      // If category filter is also applied, intersect the results
      if (selectedCategory !== 'all') {
        schemes = schemes.filter(scheme => scheme.category === selectedCategory);
      }
    }

    return schemes;
  }, [allSchemes, selectedCategory, searchQuery, lang]);

  const handleViewDetails = (scheme: Scheme) => {
    setSelectedScheme(scheme);
  };

  const handleBackToList = () => {
    setSelectedScheme(null);
  };

  // If a scheme is selected, show detail view
  if (selectedScheme) {
    return <SchemeDetail scheme={selectedScheme} onBack={handleBackToList} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-2 bg-green-100 rounded-lg">
            <FileText className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {t('government_schemes')}
            </h1>
            <p className="text-gray-600 text-sm">
              Explore government schemes and financial assistance programs for farmers
            </p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="grid md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={t('search_schemes')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />
          </div>

          {/* Category Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none appearance-none bg-white"
            >
              <option value="all">{t('all_categories')}</option>
              {categories.map(category => (
                <option key={category} value={category}>
                  {t(`${category}_schemes`)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          {filteredSchemes.length} {t('schemes')} found
          {selectedCategory !== 'all' && ` in ${t(`${selectedCategory}_schemes`)}`}
        </p>
        {(searchQuery || selectedCategory !== 'all') && (
          <button
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
            }}
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSchemes.map((scheme) => (
            <SchemeCard
              key={scheme.id}
              scheme={scheme}
              onViewDetails={handleViewDetails}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {t('no_schemes_found')}
          </h3>
          <p className="text-gray-600">
            Try adjusting your search or filter criteria
          </p>
        </div>
      )}
    </div>
  );
}