import React, { useRef, useState } from 'react';
import { X, MapPin, Upload, Droplets } from 'lucide-react';
import { useFarm } from '../../contexts/FarmContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

interface AddLandFormProps {
  onClose: () => void;
}

export default function AddLandForm({ onClose }: AddLandFormProps) {
  const { addLand } = useFarm();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    currentCrop: '',
    waterAvailability: 'medium' as 'high' | 'medium' | 'low',
    soilType: '',
  });
  const [soilReportFile, setSoilReportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    (async () => {
      try {
        // Add land and get the created landId
        const createdLandId = await addLand({ ...formData });
        
        // Upload soil report if file selected, using the returned landId
        if (soilReportFile) {
          try {
            const { uploadSoilReport } = await import('../../services/soilService');
            const result = await uploadSoilReport(createdLandId, soilReportFile);
            alert('Land created and soil data extracted: ' + JSON.stringify(result.soilData));
          } catch (err) {
            console.error('Soil report upload error:', err);
            alert('Land created but soil report upload failed: ' + err);
          }
        } else {
          alert('Land created successfully!');
        }
        
        onClose();
      } catch (error) {
        console.error('Land creation error:', error);
        alert('Failed to create land: ' + error);
      }
    })();
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="p-6 border-b">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-green-800">{t('add_land')}</h3>
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
            placeholder="e.g., Rice, Wheat, Coconut"
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
            placeholder="e.g., Clay Loam, Sandy Clay"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Droplets className="w-4 h-4 inline mr-1" />
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            <Upload className="w-4 h-4 inline mr-1" />
            {t('soil_report')} (Optional)
          </label>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0] || null;
              setSoilReportFile(file);
            }}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-green-400 transition-colors"
          >
            <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600">
              {soilReportFile ? soilReportFile.name : t('upload_pdf')}
            </p>
            <p className="text-xs text-gray-500">PDF</p>
          </button>
        </div>

        <div className="flex space-x-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            {t('add_land')}
          </button>
        </div>
      </form>
    </div>
  );
}