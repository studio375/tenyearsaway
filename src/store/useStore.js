import { create } from "zustand";

export const useStore = create((set) => ({
  loaded: false,
  setLoaded: (loaded) => set({ loaded }),
  active: false,
  setActive: (active) => set({ active }),
  activeYear: null,
  frames: [],
  page: null,
  pages: [],
  setPages: (pages) => set({ pages }),
  setYearData: (year, frames, page) =>
    set({ activeYear: year, frames, page, objects: [] }),
  selectedPage: false,
  setSelectedPage: (selectedPage) => set({ selectedPage }),
  bookCurrentPage: false,
  setBookCurrentPage: (bookCurrentPage) => set({ bookCurrentPage }),
  objects: [],
  addObject: (obj) => set((state) => ({ objects: [...state.objects, obj] })),
  removeObject: (uuid) =>
    set((state) => ({
      objects: state.objects.filter((o) => o.ref.uuid !== uuid),
    })),
  clearObjects: () => set({ objects: [] }),
  transition: false,
  setTransition: (transition) => set({ transition }),
  endText: false,
  setEndText: (endText) => set({ endText }),
  background: null,
  setBackground: (background) => set({ background }),
  team: [],
  setTeam: (team) => set({ team }),
}));
