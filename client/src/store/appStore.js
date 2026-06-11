import { create } from 'zustand';

const useAppStore = create((set) => ({
  sidebarCollapsed: true,
  globalSearch: '',
  
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setGlobalSearch: (search) => set({ globalSearch: search }),
}));

export default useAppStore;
