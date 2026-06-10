import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarCollapsed: false,
  globalSearch: '',
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));

export default useAppStore;
