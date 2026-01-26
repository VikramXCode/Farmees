import { useState, useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useFarm } from '../contexts/FarmContext';
import { PageContainer, Section } from '../components/layout/AppShell';
import { Card, StatCard } from '../components/common/UniversalCards';
import { StatsGrid } from '../components/layout/UniversalGrid';
import Button from '../components/common/Button';
import { uploadSoilReport } from '../services/soilService';

interface SoilData {
  pH?: number;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  organicMatter?: number;
  moisture?: number;
}

export default function SoilReportPage() {
  const { language } = useLanguage();
  const { lands, selectedLandId } = useFarm();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [soilData, setSoilData] = useState<SoilData | null>(null);

  const selectedLand = lands.find((l: any) => l.id === selectedLandId);

  const t = {
    title: language === 'english' ? 'Soil Report' : 'மண் அறிக்கை',
    uploadTitle: language === 'english' ? 'Upload Soil Report' : 'மண் அறிக்கையை பதிவேற்றவும்',
    uploadDesc: language === 'english' 
      ? 'Upload your soil test report (PDF or image) to get detailed analysis' 
      : 'விரிவான பகுப்பாய்வு பெற உங்கள் மண் சோதனை அறிக்கையை (PDF அல்லது படம்) பதிவேற்றவும்',
    selectFile: language === 'english' ? 'Select File' : 'கோப்பைத் தேர்ந்தெடுக்கவும்',
    uploading: language === 'english' ? 'Analyzing...' : 'பகுப்பாய்வு செய்கிறது...',
    success: language === 'english' ? 'Report analyzed successfully!' : 'அறிக்கை வெற்றிகரமாக பகுப்பாய்வு செய்யப்பட்டது!',
    noLand: language === 'english' ? 'Please select a land first' : 'முதலில் நிலத்தைத் தேர்ந்தெடுக்கவும்',
    soilAnalysis: language === 'english' ? 'Soil Analysis' : 'மண் பகுப்பாய்வு',
    pH: 'pH',
    nitrogen: language === 'english' ? 'Nitrogen' : 'நைட்ரஜன்',
    phosphorus: language === 'english' ? 'Phosphorus' : 'பாஸ்பரஸ்',
    potassium: language === 'english' ? 'Potassium' : 'பொட்டாசியம்',
    organicMatter: language === 'english' ? 'Organic Matter' : 'கரிம பொருள்',
    moisture: language === 'english' ? 'Moisture' : 'ஈரப்பதம்',
    currentLand: language === 'english' ? 'Current Land' : 'தற்போதைய நிலம்',
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !selectedLandId) return;

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(false);

    try {
      const result = await uploadSoilReport(selectedLandId, file);
      setSoilData(result.soilReport || result);
      setUploadSuccess(true);
    } catch (err: any) {
      setUploadError(err.message || 'Failed to upload report');
    } finally {
      setUploading(false);
    }
  };

  // Use existing soil data from selected land if available
  const displayData = soilData || (selectedLand as any)?.soilReport;

  return (
    <PageContainer>
      {/* Current Land */}
      {selectedLand && (
        <Section>
          <Card>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 text-green-700 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-500">{t.currentLand}</p>
                <p className="font-semibold text-gray-900">{selectedLand.name}</p>
              </div>
            </div>
          </Card>
        </Section>
      )}

      {/* Upload Section */}
      <Section>
        <Card>
          <h2 className="text-lg font-bold text-gray-900 mb-2">{t.uploadTitle}</h2>
          <p className="text-sm text-gray-600 mb-4">{t.uploadDesc}</p>

          {!selectedLandId ? (
            <div className="flex items-center gap-2 p-3 bg-amber-50 text-amber-700 rounded-lg">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{t.noLand}</span>
            </div>
          ) : (
            <>
              <Button
                fullWidth
                variant={uploadSuccess ? 'secondary' : 'primary'}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                leftIcon={
                  uploading ? <Loader2 className="w-5 h-5 animate-spin" /> :
                  uploadSuccess ? <CheckCircle className="w-5 h-5" /> :
                  <Upload className="w-5 h-5" />
                }
              >
                {uploading ? t.uploading : uploadSuccess ? t.success : t.selectFile}
              </Button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {uploadError && (
                <div className="mt-3 flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-lg">
                  <AlertCircle className="w-5 h-5" />
                  <span className="text-sm">{uploadError}</span>
                </div>
              )}
            </>
          )}
        </Card>
      </Section>

      {/* Soil Analysis Results */}
      {displayData && (
        <Section>
          <h2 className="text-lg font-bold text-gray-900 mb-4">{t.soilAnalysis}</h2>
          <StatsGrid>
            {displayData.pH && (
              <StatCard
                label={t.pH}
                value={displayData.pH.toFixed(1)}
                sublabel={displayData.pH < 6 ? 'Acidic' : displayData.pH > 7.5 ? 'Alkaline' : 'Neutral'}
                iconBg="bg-blue-100"
                iconColor="text-blue-700"
              />
            )}
            {displayData.nitrogen && (
              <StatCard
                label={t.nitrogen}
                value={`${displayData.nitrogen}`}
                sublabel="ppm"
                iconBg="bg-green-100"
                iconColor="text-green-700"
              />
            )}
            {displayData.phosphorus && (
              <StatCard
                label={t.phosphorus}
                value={`${displayData.phosphorus}`}
                sublabel="ppm"
                iconBg="bg-purple-100"
                iconColor="text-purple-700"
              />
            )}
            {displayData.potassium && (
              <StatCard
                label={t.potassium}
                value={`${displayData.potassium}`}
                sublabel="ppm"
                iconBg="bg-amber-100"
                iconColor="text-amber-700"
              />
            )}
            {displayData.organicMatter && (
              <StatCard
                label={t.organicMatter}
                value={`${displayData.organicMatter}%`}
                iconBg="bg-emerald-100"
                iconColor="text-emerald-700"
              />
            )}
            {displayData.moisture && (
              <StatCard
                label={t.moisture}
                value={`${displayData.moisture}%`}
                iconBg="bg-cyan-100"
                iconColor="text-cyan-700"
              />
            )}
          </StatsGrid>
        </Section>
      )}

      {/* Placeholder when no data */}
      {!displayData && selectedLandId && !uploading && (
        <Section className="pb-24">
          <Card>
            <div className="text-center py-8">
              <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {language === 'english' 
                  ? 'No soil report available. Upload one to see analysis.'
                  : 'மண் அறிக்கை இல்லை. பகுப்பாய்வைக் காண ஒன்றைப் பதிவேற்றவும்.'}
              </p>
            </div>
          </Card>
        </Section>
      )}
    </PageContainer>
  );
}
