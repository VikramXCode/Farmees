import React, { useState, useEffect } from 'react';
import { X, MapPin } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface EditLandFormProps {
  landId: string;
  onClose: () => void;
}

export default function EditLandForm({ landId, onClose }: EditLandFormProps) {
  const { lands, updateLand } = useFarm();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    currentCrop: '',
    waterAvailability: 'medium' as 'high' | 'medium' | 'low',
    soilType: '',
  });
  const [loading, setLoading] = useState(false);

  // Find the land to edit
  const land = lands.find(l => l.id === landId);

  useEffect(() => {
    if (land) {
      setFormData({
        name: land.name,
        location: land.location,
        currentCrop: land.currentCrop,
        waterAvailability: land.waterAvailability,
        soilType: land.soilType,
      });
    }
  }, [land]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!land) return;

    setLoading(true);
    try {
      await updateLand(landId, formData);
      onClose();
    } catch (error) {
      console.error('Failed to update land:', error);
      alert('Failed to update land. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!land) {
    return (
      <div className="p-6 border-b">
        <div className="text-center text-gray-500">
          <p>Land not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 border-b">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-800">{t('edit_land')}</h3>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('land_name')}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            placeholder="e.g., North Field"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <MapPin className="w-4 h-4 inline mr-1" />
            {t('location')}
          </label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            placeholder="e.g., Kochi, Kerala"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('current_crop')}
          </label>
          <input
            type="text"
            name="currentCrop"
            value={formData.currentCrop}
            onChange={handleInputChange}
            placeholder="e.g., Rice, Coconut, Pepper"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('soil_type')}
          </label>
          <input
            type="text"
            name="soilType"
            value={formData.soilType}
            onChange={handleInputChange}
            placeholder="e.g., Clay Loam, Sandy, Red Soil"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('water_availability')}
          </label>
          <select
            name="waterAvailability"
            value={formData.waterAvailability}
            onChange={handleInputChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          >
            <option value="high">{t('high')}</option>
            <option value="medium">{t('medium')}</option>
            <option value="low">{t('low')}</option>
          </select>
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? t('updating') : t('update_land')}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
