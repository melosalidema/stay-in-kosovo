"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

import type { Coordinates, ItineraryInput, PlaceDTO, TransportMethod } from "@/types";

type Filters = {
  q: string;
  city: string;
  category: string;
  vibe: string;
  budget: number;
  openNow: boolean;
  rating: number;
  transport: TransportMethod | "";
};

type AppState = {
  selectedVibe: string;
  filters: Filters;
  location?: Coordinates;
  savedPlaceIds: string[];
  itineraryDraft: ItineraryInput;
  setSelectedVibe: (vibe: string) => void;
  setFilters: (filters: Partial<Filters>) => void;
  setLocation: (location: Coordinates) => void;
  toggleSavedPlace: (place: PlaceDTO) => void;
  setItineraryDraft: (draft: Partial<ItineraryInput>) => void;
};

const defaultFilters: Filters = {
  q: "",
  city: "Prishtina",
  category: "",
  vibe: "",
  budget: 4,
  openNow: false,
  rating: 0,
  transport: ""
};

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      selectedVibe: "Hidden Gems",
      filters: defaultFilters,
      savedPlaceIds: [],
      itineraryDraft: {
        city: "Prishtina",
        budget: 60,
        durationHours: 5,
        interests: ["food", "culture"],
        vibe: "Local Food",
        transportPreference: "WALKING"
      },
      setSelectedVibe: (vibe) =>
        set((state) => ({
          selectedVibe: vibe,
          filters: { ...state.filters, vibe }
        })),
      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters }
        })),
      setLocation: (location) => set({ location }),
      toggleSavedPlace: (place) => {
        const saved = get().savedPlaceIds;
        set({
          savedPlaceIds: saved.includes(place.id)
            ? saved.filter((id) => id !== place.id)
            : [...saved, place.id]
        });
      },
      setItineraryDraft: (draft) =>
        set((state) => ({
          itineraryDraft: { ...state.itineraryDraft, ...draft }
        }))
    }),
    {
      name: "stay-kosovo-app-state",
      partialize: (state) => ({
        selectedVibe: state.selectedVibe,
        filters: state.filters,
        savedPlaceIds: state.savedPlaceIds,
        itineraryDraft: state.itineraryDraft
      })
    }
  )
);
