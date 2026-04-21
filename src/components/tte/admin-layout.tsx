'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  Settings,
  LogOut,
  Menu,
  Shield,
  ChevronLeft,
  UserCog,
  Image,
  Newspaper,
  PenTool,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppStore, type PageType } from '@/lib/store';
import { useIsMobile } from '@/hooks/use-mobile';

interface UserInfo {
  id: string;
  username: string;
  nama: string;
  role: 'admin' | 'pegawai';
  pegawaiId: string | null;
}

interface AdminLayoutProps {
  children: React.ReactNode;
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  user: UserInfo | null;
}

// Navigation items for admin
const adminNavItems: { page: PageType; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'pegawai', label: 'Master Pegawai', icon: Users },
  { page: 'tte-dokumen', label: 'TTE Dokumen', icon: FileCheck },
  { page: 'upload-tandatangani', label: 'Upload & Tandatangani', icon: PenTool },
  { page: 'banner', label: 'Kelola Banner', icon: Image },
  { page: 'berita', label: 'Kelola Berita', icon: Newspaper },
  { page: 'users', label: 'Pengaturan User', icon: UserCog },
  { page: 'pengaturan', label: 'Pengaturan', icon: Settings },
];

// Navigation items for pegawai
const pegawaiNavItems: { page: PageType; label: string; icon: React.ElementType }[] = [
  { page: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { page: 'tte-dokumen', label: 'TTE Dokumen', icon: FileCheck },
  { page: 'upload-tandatangani', label: 'Upload & Tandatangani', icon: PenTool },
];

const pageTitleMap: Record<PageType, string> = {
  dashboard: 'Dashboard',
  pegawai: 'Master Pegawai',
  'tte-dokumen': 'TTE Dokumen',
  'upload-tandatangani': 'Upload & Tandatangani',
  banner: 'Kelola Banner',
  berita: 'Kelola Berita',
  users: 'Pengaturan User',
  pengaturan: 'Pengaturan',
};

function SidebarContent({
  currentPage,
  onPageChange,
  user,
  onNavigate,
}: {
  currentPage: PageType;
  onPageChange: (page: PageType) => void;
  user: UserInfo | null;
  onNavigate?: () => void;
}) {
  const isAdmin = user?.role === 'admin';
  const navItems = isAdmin ? adminNavItems : pegawaiNavItems;

  // Fetch pengaturan for dynamic title
  const [appJudul, setAppJudul] = useState('Sistem TTE');
  const [appSubJudul, setAppSubJudul] = useState('Tanda Tangan Elektronik');
  const [headerLogoUrl, setHeaderLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPengaturan() {
      try {
        const res = await fetch('/api/pengaturan');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setAppJudul(json.data.judul || 'Sistem TTE');
            setAppSubJudul(json.data.subJudul || 'Tanda Tangan Elektronik');
            if (json.data.headerLogoPath) {
              const logoPath = json.data.headerLogoPath;
              setHeaderLogoUrl(logoPath.startsWith('http') ? logoPath : `/api/pengaturan/header-logo/${logoPath}`);
            }
          }
        }
      } catch {
        // Silently ignore
      }
    }
    fetchPengaturan();
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Sidebar Header */}
      <div className="px-4 py-5 flex items-center gap-3">
        {headerLogoUrl ? (
          <img
            src={headerLogoUrl}
            alt="Logo"
            className="w-9 h-9 rounded-lg object-contain bg-emerald-700/50 p-1 shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-lg bg-emerald-700 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-white" />
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base font-bold tracking-tight truncate">{appJudul}</h2>
          <p className="text-xs text-muted-foreground truncate">{appSubJudul}</p>
        </div>
      </div>

      <Separator />

      {/* Navigation */}
      <ScrollArea className="flex-1 px-3 py-3">
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentPage === item.page;
            const Icon = item.icon;
            return (
              <button
                key={item.page}
                onClick={() => {
                  onPageChange(item.page);
                  onNavigate?.();
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>

      <Separator />

      {/* User Info & Logout */}
      <div className="p-3 space-y-2">
        {user && (
          <div className="px-3 py-2 rounded-lg bg-muted/50">
            <p className="text-sm font-medium truncate">{user.nama}</p>
            <div className="flex items-center gap-2">
              <p className="text-xs text-muted-foreground truncate">@{user.username}</p>
              <Badge
                variant="secondary"
                className={`text-[10px] px-1.5 py-0 ${
                  user.role === 'admin'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                }`}
              >
                {user.role === 'admin' ? 'Admin' : 'Pegawai'}
              </Badge>
            </div>
          </div>
        )}
        <LogoutButton variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive" />
      </div>
    </div>
  );
}

function LogoutButton({
  variant = 'ghost',
  size,
  className = '',
}: {
  variant?: 'ghost' | 'outline' | 'default';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}) {
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const setIsAuthenticated = useAppStore((s) => s.setIsAuthenticated);

  const handleLogout = useCallback(async () => {
    setIsLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue even if logout API fails
    } finally {
      setIsAuthenticated(false);
      setIsLoggingOut(false);
    }
  }, [setIsAuthenticated]);

  return (
    <Button variant={variant} size={size} className={className} onClick={handleLogout} disabled={isLoggingOut}>
      <LogOut className="w-4 h-4" />
      <span>{isLoggingOut ? 'Keluar...' : 'Keluar'}</span>
    </Button>
  );
}

export default function AdminLayout({
  children,
  currentPage,
  onPageChange,
  user,
}: AdminLayoutProps) {
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Fetch pengaturan for dynamic title
  const [appJudul, setAppJudul] = useState('Sistem TTE');

  useEffect(() => {
    async function fetchPengaturan() {
      try {
        const res = await fetch('/api/pengaturan');
        if (res.ok) {
          const json = await res.json();
          if (json.data) {
            setAppJudul(json.data.judul || 'Sistem TTE');
          }
        }
      } catch {
        // Silently ignore
      }
    }
    fetchPengaturan();
  }, []);

  const handlePageChange = useCallback(
    (page: PageType) => {
      onPageChange(page);
      setMobileOpen(false);
    },
    [onPageChange]
  );

  const isAdmin = user?.role === 'admin';

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside
          className={`hidden md:flex flex-col border-r bg-card transition-all duration-300 shrink-0 ${
            sidebarCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          <SidebarContent
            currentPage={currentPage}
            onPageChange={onPageChange}
            user={user}
          />
          {/* Collapse toggle */}
          <div className="p-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              aria-label={sidebarCollapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
            >
              <ChevronLeft
                className={`w-4 h-4 transition-transform ${
                  sidebarCollapsed ? 'rotate-180' : ''
                }`}
              />
            </Button>
          </div>
        </aside>
      )}

      {/* Mobile Sidebar (Sheet) */}
      {isMobile && (
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden fixed top-3 left-3 z-40 bg-background border shadow-sm"
              aria-label="Buka menu navigasi"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menu Navigasi</SheetTitle>
            </SheetHeader>
            <SidebarContent
              currentPage={currentPage}
              onPageChange={handlePageChange}
              user={user}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-14 border-b bg-card flex items-center justify-between px-4 md:px-6 shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && <div className="w-10" />}
            <h1 className="text-lg font-semibold truncate">
              {pageTitleMap[currentPage] || 'Dashboard'}
            </h1>
            <Badge
              variant="secondary"
              className={`hidden sm:inline-flex ${
                isAdmin
                  ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                  : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
              }`}
            >
              {isAdmin ? 'Admin' : 'Pegawai'}
            </Badge>
          </div>
          <LogoutButton variant="outline" size="sm" />
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          {children}
        </main>

        {/* Sticky Footer */}
        <footer className="border-t bg-card py-3 px-4 md:px-6 text-center text-xs text-muted-foreground shrink-0">
          &copy; {new Date().getFullYear()} {appJudul} - Pemerintah Daerah
        </footer>
      </div>
    </div>
  );
}
