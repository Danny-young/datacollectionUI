import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface CounterState {
  counters: Record<string, number>;
  getNextCounter: (municipalityCode: string, localityCode: string) => number;
  resetCounters: () => void;
}

export const useCounterStore = create<CounterState>()(
  persist(
    (set, get) => ({
      counters: {},
      getNextCounter: (municipalityCode: string, localityCode: string) => {
        const key = `${municipalityCode}-${localityCode}`;
        const currentCounter = get().counters[key] || 0;
        const nextCounter = currentCounter + 1;
        
        set((state) => ({
          counters: {
            ...state.counters,
            [key]: nextCounter
          }
        }));
        
        return nextCounter;
      },
      resetCounters: () => set({ counters: {} })
    }),
    {
      name: 'valuation-counter-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
); 