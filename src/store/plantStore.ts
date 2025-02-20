import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { Plant } from '../types';

interface PlantState {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  fetchPlants: () => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'created_at' | 'last_watered'>) => Promise<void>;
  updatePlant: (id: string, updates: Partial<Plant>) => Promise<void>;
  deletePlant: (id: string) => Promise<void>;
  waterPlant: (id: string) => Promise<void>;
}

const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],
  loading: false,
  error: null,

  fetchPlants: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ plants: data || [] });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to fetch plants' });
    } finally {
      set({ loading: false });
    }
  },

  addPlant: async (plant) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plants')
        .insert([plant])
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({ plants: [data, ...state.plants] }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to add plant' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updatePlant: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({
          plants: state.plants.map((p) => (p.id === id ? data : p)),
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to update plant' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deletePlant: async (id) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('plants')
        .delete()
        .eq('id', id);

      if (error) throw error;
      set((state) => ({
        plants: state.plants.filter((p) => p.id !== id),
      }));
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to delete plant' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  waterPlant: async (id) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('plants')
        .update({ last_watered: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      if (data) {
        set((state) => ({
          plants: state.plants.map((p) => (p.id === id ? data : p)),
        }));
      }
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Failed to water plant' });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));

export default usePlantStore;
