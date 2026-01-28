import React, { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';
import { landService } from '../services/landService';
import type { LandData, FarmBoundaryData, LandSize } from '../types/land';
import { useAuth } from './AuthContext';

export interface Land {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  soilReport?: string;
  currentCrop: string;
  waterAvailability: 'high' | 'medium' | 'low';
  soilType: string;
  // Farm Boundary Mapping (optional)
  boundary?: FarmBoundaryData;
  landSize?: LandSize;
}

export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  landId: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface FarmContextType {
  lands: Land[];
  selectedLandId: string | null;
  reminders: Reminder[];
  isLoading: boolean;
  loadError: string | null;
  addLand: (land: Omit<Land, 'id'>) => Promise<string>;
  updateLand: (landId: string, updates: Partial<Land>) => Promise<void>;
  deleteLand: (landId: string) => Promise<void>;
  selectLand: (landId: string | null) => void;
  addReminder: (reminder: Omit<Reminder, 'id'>) => void;
  toggleReminder: (reminderId: string) => void;
}

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export function FarmProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id || null;
  const [lands, setLands] = useState<Land[]>([]);
  const [selectedLandId, setSelectedLandId] = useState<string | null>(null);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadSeqRef = useRef(0);
  const prevLandsHash = useRef<string>('');

  // Load lands for the logged-in user
  useEffect(() => {
    let isMounted = true;
    const seq = ++loadSeqRef.current;

    const loadUserLands = async () => {
      if (!userId) {
        if (isMounted) {
          setLands([]);
          prevLandsHash.current = '';
          setSelectedLandId(null);
          setIsLoading(false);
          setLoadError(null);
        }
        return;
      }

      if (isMounted) {
        setIsLoading(true);
        setLoadError(null);
      }

      try {
        const userLands: LandData[] = await landService.getAllUserLands(userId);

        if (isMounted && loadSeqRef.current === seq) {
          const mapped: Land[] = userLands.map(ld => ({
            id: ld.landId || ld._id || '',
            name: ld.name,
            location: ld.location,
            currentCrop: ld.currentCrop,
            waterAvailability: ld.waterAvailability,
            soilType: ld.soilType,
            latitude: ld.coordinates?.lat,
            longitude: ld.coordinates?.lng,
            boundary: ld.boundary,
            landSize: ld.landSize
          }));

          const newHash = JSON.stringify(mapped);
          if (newHash !== prevLandsHash.current) {
            setLands(mapped);
            prevLandsHash.current = newHash;

            if (mapped.length > 0 && !selectedLandId) {
              setSelectedLandId(mapped[0].id);
            } else if (mapped.length === 0 && selectedLandId) {
              setSelectedLandId(null);
            }
          }
        }
      } catch (err: any) {
        console.error('Failed to load user lands:', err);
        if (isMounted && loadSeqRef.current === seq) {
          // Do not clear lands on error to prevent flashing or loops. Just set error.
          setLoadError(err?.message || 'Failed to load lands');
        }
      } finally {
        if (isMounted && loadSeqRef.current === seq) {
          setIsLoading(false);
        }
      }
    };

    loadUserLands();

    return () => {
      isMounted = false;
    };
  }, [userId]);

  const addLand = async (landData: Omit<Land, 'id'>): Promise<string> => {
    // Create a persistent record in backend then reflect in UI
    try {
      // Generate a more unique landId to prevent duplicates
      const generatedLandId = `land-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const payload: Omit<LandData, '_id' | 'createdAt' | 'updatedAt'> = {
        landId: generatedLandId,
        userId: user ? user.id : 'guest',
        name: landData.name,
        location: landData.location,
        soilType: landData.soilType,
        currentCrop: landData.currentCrop,
        waterAvailability: landData.waterAvailability,
        // Include boundary data if available
        boundary: landData.boundary,
        landSize: landData.landSize,
        soilReport: undefined,
        weatherHistory: [],
        cropHistory: [],
        pestDiseaseHistory: [],
        treatmentHistory: [],
        marketData: [],
        aiContext: {
          lastInteraction: new Date().toISOString(),
          commonQuestions: [],
          recommendedActions: [],
          preferences: {
            communicationStyle: 'simple' as const,
            focusAreas: [],
            alertLevel: 'medium' as const
          }
        },
        isActive: true
      } as any;

      const created = await landService.createLandData(payload);
      const newLand: Land = {
        id: created.landId || created._id || generatedLandId,
        name: created.name,
        location: created.location,
        currentCrop: created.currentCrop,
        waterAvailability: created.waterAvailability,
        soilType: created.soilType,
        boundary: created.boundary,
        landSize: created.landSize
      };
      setLands(prev => [...prev, newLand]);
      return newLand.id;
    } catch (err) {
      console.error('Failed to add land', err);
      // Fallback to local add to keep UI responsive
      const newLand = {
        ...landData,
        id: Date.now().toString(),
      };
      setLands(prev => [...prev, newLand]);
      return newLand.id;
    }
  };

  const updateLand = async (landId: string, updates: Partial<Land>): Promise<void> => {
    try {
      // Update in backend
      const landData = await landService.getLandData(landId);
      if (landData) {
        await landService.updateLandData(landId, {
          name: updates.name,
          location: updates.location,
          soilType: updates.soilType,
          currentCrop: updates.currentCrop,
          waterAvailability: updates.waterAvailability,
        });
      }

      // Update in local state
      setLands(prev => prev.map(land =>
        land.id === landId ? { ...land, ...updates } : land
      ));
    } catch (err) {
      console.error('Failed to update land', err);
      // Fallback to local update
      setLands(prev => prev.map(land =>
        land.id === landId ? { ...land, ...updates } : land
      ));
    }
  };

  const deleteLand = async (landId: string): Promise<void> => {
    try {
      // Delete from backend
      await landService.deleteLandData(landId);

      // Remove from local state
      setLands(prev => prev.filter(land => land.id !== landId));

      // Clear selection if deleted land was selected
      if (selectedLandId === landId) {
        setSelectedLandId(null);
      }
    } catch (err) {
      console.error('Failed to delete land', err);
      // Fallback to local delete
      setLands(prev => prev.filter(land => land.id !== landId));
      if (selectedLandId === landId) {
        setSelectedLandId(null);
      }
    }
  };

  const selectLand = (landId: string | null) => {
    setSelectedLandId(landId);
  };

  const addReminder = (reminderData: Omit<Reminder, 'id'>) => {
    const newReminder = {
      ...reminderData,
      id: Date.now().toString(),
    };
    setReminders(prev => [...prev, newReminder]);
  };

  const toggleReminder = (reminderId: string) => {
    setReminders(prev =>
      prev.map(reminder =>
        reminder.id === reminderId
          ? { ...reminder, completed: !reminder.completed }
          : reminder
      )
    );
  };

  return (
    <FarmContext.Provider value={{
      lands,
      selectedLandId,
      reminders,
      isLoading,
      loadError,
      addLand,
      updateLand,
      deleteLand,
      selectLand,
      addReminder,
      toggleReminder,
    }}>
      {children}
    </FarmContext.Provider>
  );
}

export function useFarm() {
  const context = useContext(FarmContext);
  if (context === undefined) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
}