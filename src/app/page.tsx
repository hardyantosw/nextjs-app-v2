'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAppStore, type PageType } from '@/lib/store';
import AdminLayout from '@/components/tte/admin-layout';
import DashboardPage from '@/components/tte/dashboard-page';
import PegawaiPage from '@/components/tte/pegawai-page';
import TTEDokumenPage from '@/components/tte/dokumen-page';
import UploadTandatanganiPage from '@/components/tte/upload-page';
import PengaturanPage from '@/components/tte/pengaturan-page';
import UsersPage from '@/components/tte/users-page';
import BannerPage from '@/components/tte/banner-page';
import BeritaPage from '@/components/tte/berita-page';
import PublicPage from '@/components/tte/public-page';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const {
    isAuthenticated,
    user,
    setIsAuthenticated,
    currentPage,
    setCurrentPage,
  } = useAppStore();

  const [initialCheck, setInitialCheck] = useState(false);

  // Check existing session on mount
  useEffect(() => {
    async function initialize() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.data) {
            setIsAuthenticated(true, data.data);
          }
        }
      } catch {
        // Not authenticated
      } finally {
        setInitialCheck(true);
      }
    }
    initialize();
  }, [setIsAuthenticated]);

  // Handle page change
  const handlePageChange = useCallback(
    (page: PageType) => {
      setCurrentPage(page);
    },
    [setCurrentPage]
  );

  // Loading state during initial check
  if (!initialCheck) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
          <p className="text-sm text-muted-foreground">Memuat sistem TTE...</p>
        </div>
      </div>
    );
  }

  // If not authenticated, show the public landing page
  if (!isAuthenticated) {
    return <PublicPage />;
  }

  // Render the current page content
  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardPage />;
      case 'pegawai':
        return <PegawaiPage />;
      case 'tte-dokumen':
        return <TTEDokumenPage />;
      case 'upload-tandatangani':
        return <UploadTandatanganiPage />;
      case 'banner':
        return <BannerPage />;
      case 'berita':
        return <BeritaPage />;
      case 'users':
        return <UsersPage />;
      case 'pengaturan':
        return <PengaturanPage />;
      default:
        return <DashboardPage />;
    }
  };

  // Admin layout with page content
  return (
    <AdminLayout
      currentPage={currentPage}
      onPageChange={handlePageChange}
      user={user}
    >
      {renderPage()}
    </AdminLayout>
  );
}
