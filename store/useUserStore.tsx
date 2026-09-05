import { create } from "zustand";

export interface UserState {
  currency: string | null;
  setCurrency: (currency: string | null) => void;
  needsOnboarding: boolean | null;
  setNeedsOnboarding: (needsOnboarding: boolean | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
  currency: null,
  setCurrency: (currency) => set({ currency }),
  needsOnboarding: null,
  setNeedsOnboarding: (needsOnboarding) => set({ needsOnboarding }),
}));
