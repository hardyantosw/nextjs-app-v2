'use client';

import { create } from 'zustand';

export type PageType = 'dashboard' | 'pegawai' | 'tte-dokumen' | 'upload-tandatangani' | 'users' | 'pengaturan' | 'banner' | 'berita';

interface UserInfo {
  id: string;
  username: string;
  nama: string;
  role: 'admin' | 'pegawai';
  pegawaiId: string | null;
}

interface AppState {
  // Auth
  isAuthenticated: boolean;
  user: UserInfo | null;
  setIsAuthenticated: (value: boolean, user?: UserInfo | null) => void;

  // Navigation
  currentPage: PageType;
  setCurrentPage: (page: PageType) => void;

  // Verification token (from URL)
  verifyToken: string | null;
  setVerifyToken: (token: string | null) => void;

  // Loading
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isAuthenticated: false,
  user: null,
  setIsAuthenticated: (value, user) =>
    set({ isAuthenticated: value, user: user || null }),

  currentPage: 'dashboard',
  setCurrentPage: (page) => set({ currentPage: page }),

  verifyToken: null,
  setVerifyToken: (token) => set({ verifyToken: token }),

  isLoading: false,
  setIsLoading: (value) => set({ isLoading: value }),
}));
