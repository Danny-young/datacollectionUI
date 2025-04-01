import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FormDataType } from '@/app/(tabs)/add';

interface OfflineFormData extends FormDataType {
  timestamp: string;
  synced?: boolean;
}

interface OfflineState {
  offlineData: OfflineFormData[];
  addOfflineData: (data: FormDataType) => Promise<void>;
  removeOfflineData: (index: number) => void;
  clearOfflineData: () => void;
  markAsSynced: (index: number) => void;
}

export const useOfflineStore = create<OfflineState>()(
  persist(
    (set, get) => ({
      offlineData: [],
      addOfflineData: async (data) =>
        set((state) => ({
          offlineData: [...state.offlineData, { ...data, timestamp: new Date().toISOString() }],
        })),
      removeOfflineData: (index) =>
        set((state) => ({
          offlineData: state.offlineData.filter((_, i) => i !== index),
        })),
      clearOfflineData: () => set({ offlineData: [] }),
      markAsSynced: (index) =>
        set((state) => ({
          offlineData: state.offlineData.map((item, i) =>
            i === index ? { ...item, synced: true } : item
          ),
        })),
    }),
    {
      name: 'offline-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
); 