'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  FileText,
  ChevronRight,
  Calendar,
  User,
  Tag,
  ArrowRight,
  Loader2,
  CheckCircle,
  XCircle,
  Clock,
  Stamp,
  AlertCircle,
  Copy,
  Newspaper,
  ImageIcon,
  LogIn,
  Eye,
  EyeOff,
  Shield,
  Upload,
  X,
  FileUp,
} from 'lucide-react';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { useAppStore } from '@/lib/store';

// Types
interface PengaturanData {
  id: string;
  judul: string;
  subJudul: string;
  logoPath: string | null;
  headerLogoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

interface BannerData {
  id: string;
  judul: string;
  deskripsi: string | null;
  imagePath: string | null;
  urutan: number;
  aktif: boolean;
}

interface BeritaData {
  id: string;
  judul: string;
  isi: string;
  ringkas: string | null;
  imagePath: string | null;
  penulis: string | null;
  kategori: string | null;
  published: boolean;
  createdAt: string;
}

interface VerificationData {
  isStamp?: boolean;
  namaFile?: string;
  judulDokumen?: string | null;
  pegawai: {
    nama: string;
    nip: string;
    jabatan: string;
    opd: string;
  };
  tglTtd: string;
  status: string;
  hashFile?: string;
  keterangan?: string | null;
  tembusan?: string | null;
  isExpired?: boolean;
  aktifSelamanya?: boolean;
  tanggalExpired?: string | null;
}

export default function PublicPage() {
  const setIsAuthenticated = useAppStore((s) => s.setIsAuthenticated);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);

  // Banner state
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [currentBanner, setCurrentBanner] = useState(0);
  const [bannersLoading, setBannersLoading] = useState(true);

  // Berita state
  const [beritaList, setBeritaList] = useState<BeritaData[]>([]);
  const [beritaLoading, setBeritaLoading] = useState(true);
  const [selectedBerita, setSelectedBerita] = useState<BeritaData | null>(null);

  // Verification state
  const [verifyFile, setVerifyFile] = useState<File | null>(null);
  const [verifyData, setVerifyData] = useState<VerificationData | null>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [verifyDialogOpen, setVerifyDialogOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Pengaturan state
  const [pengaturan, setPengaturan] = useState<PengaturanData | null>(null);

  // Login dialog state
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginShowPassword, setLoginShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Fetch pengaturan
  useEffect(() => {
    async function fetchPengaturan() {
      try {
        const res = await fetch('/api/pengaturan');
        if (res.ok) {
          const json = await res.json();
          setPengaturan(json.data);
        }
      } catch {
        // Silently ignore
      }
    }
    fetchPengaturan();
  }, []);

  // Fetch banners
  useEffect(() => {
    async function fetchBanners() {
      try {
        const res = await fetch('/api/banner');
        if (res.ok) {
          const json = await res.json();
          setBanners(json.data || []);
        }
      } catch {
        // Silently ignore
      } finally {
        setBannersLoading(false);
      }
    }
    fetchBanners();
  }, []);

  // Auto-rotate banners
  useEffect(() => {
    if (banners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBanner((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

  // Fetch berita
  useEffect(() => {
    async function fetchBerita() {
      try {
        const res = await fetch('/api/berita?limit=6');
        if (res.ok) {
          const json = await res.json();
          setBeritaList(json.data || []);
        }
      } catch {
        // Silently ignore
      } finally {
        setBeritaLoading(false);
      }
    }
    fetchBerita();
  }, []);

  // Check URL for verification token (QR code scan)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('verify');
    if (token) {
      handleVerifyByToken(token);
    }
  }, []);

  // Handle token-based verification (for QR code scanning)
  const handleVerifyByToken = async (token: string) => {
    if (!token.trim()) return;

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyData(null);

    try {
      const res = await fetch(`/api/verifikasi/${token.trim()}`);
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setVerifyError(json?.error || 'Dokumen tidak ditemukan');
        setVerifyDialogOpen(true);
        return;
      }
      const json = await res.json();
      setVerifyData(json.data);
      setVerifyDialogOpen(true);
    } catch {
      setVerifyError('Gagal terhubung ke server');
      setVerifyDialogOpen(true);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Handle file upload verification
  const handleVerifyUpload = async () => {
    if (!verifyFile) {
      toast.error('Pilih file dokumen yang akan diverifikasi');
      return;
    }

    setVerifyLoading(true);
    setVerifyError(null);
    setVerifyData(null);

    try {
      const formData = new FormData();
      formData.append('file', verifyFile);

      const res = await fetch('/api/verifikasi/cek', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.valid) {
        setVerifyData(json.data);
      } else {
        setVerifyError(json.message || 'Dokumen tidak valid');
      }
      setVerifyDialogOpen(true);
    } catch {
      setVerifyError('Gagal terhubung ke server');
      setVerifyDialogOpen(true);
    } finally {
      setVerifyLoading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle drag & drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'image/jpeg',
        'image/png',
      ];
      const allowedExts = ['.pdf', '.doc', '.docx', '.jpg', '.jpeg', '.png'];
      const ext = '.' + droppedFile.name.split('.').pop()?.toLowerCase();
      if (allowedTypes.includes(droppedFile.type) || allowedExts.includes(ext)) {
        if (droppedFile.size > 25 * 1024 * 1024) {
          toast.error('Ukuran file maksimal 25MB');
          return;
        }
        setVerifyFile(droppedFile);
      } else {
        toast.error('Format file tidak didukung');
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 25 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 25MB');
        return;
      }
      setVerifyFile(selectedFile);
    }
  };

  const handleRemoveFile = () => {
    setVerifyFile(null);
  };

  // Handle login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    if (!loginUsername.trim() || !loginPassword.trim()) {
      setLoginError('Username dan password wajib diisi');
      return;
    }

    setLoginLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: loginUsername.trim(), password: loginPassword }),
      });

      const data = await res.json();

      if (data.success && data.data) {
        setIsAuthenticated(true, {
          id: data.data.id,
          username: data.data.username,
          nama: data.data.nama,
          role: data.data.role,
          pegawaiId: data.data.pegawaiId || null,
        });
        setCurrentPage('dashboard');
        setLoginDialogOpen(false);
        toast.success('Login berhasil!');
      } else {
        setLoginError(data.message || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch {
      setLoginError('Terjadi kesalahan jaringan. Silakan coba lagi.');
    } finally {
      setLoginLoading(false);
    }
  };

  function formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  function formatDateTime(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }) + ' WIB';
  }

  function truncateHash(hash: string): string {
    if (!hash || hash.length <= 16) return hash;
    return `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  }

  function handleCopyHash(hash: string) {
    navigator.clipboard.writeText(hash).then(() => {
      toast.success('Hash SHA-256 berhasil disalin');
    }).catch(() => {
      toast.error('Gagal menyalin hash');
    });
  }

  const kategoriColor: Record<string, string> = {
    Pengumuman: 'bg-amber-100 text-amber-800 border-amber-200',
    Berita: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Informasi: 'bg-sky-100 text-sky-800 border-sky-200',
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header / Navbar */}
      <header className="bg-emerald-800 text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              {pengaturan?.headerLogoPath ? (
                <img
                  src={`/api/pengaturan/header-logo/${pengaturan.headerLogoPath}`}
                  alt="Logo"
                  className="w-9 h-9 rounded-lg object-contain bg-white/15 p-1"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold tracking-tight">{pengaturan?.judul || 'Sistem TTE'}</h1>
                <p className="text-[10px] text-emerald-200 -mt-0.5">{pengaturan?.subJudul || 'Tanda Tangan Elektronik'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="#verify"
                className="text-sm text-emerald-100 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/10"
              >
                Verifikasi
              </a>
              <a
                href="#berita"
                className="text-sm text-emerald-100 hover:text-white transition-colors px-3 py-1.5 rounded-md hover:bg-white/10"
              >
                Berita
              </a>
              <Button
                onClick={() => setLoginDialogOpen(true)}
                className="ml-2 bg-white text-emerald-800 hover:bg-emerald-50 gap-2 h-9 px-4 font-semibold"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Banner / Carousel */}
      <section className="relative bg-emerald-900 overflow-hidden">
        {bannersLoading ? (
          <div className="h-64 sm:h-80 lg:h-96 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-300" />
          </div>
        ) : banners.length > 0 ? (
          <div className="relative h-64 sm:h-80 lg:h-96">
            {banners.map((banner, idx) => (
              <div
                key={banner.id}
                className={`absolute inset-0 transition-opacity duration-700 ${
                  idx === currentBanner ? 'opacity-100' : 'opacity-0'
                }`}
              >
                {banner.imagePath ? (
                  <img
                    src={`/api/banner/image/${banner.imagePath}`}
                    alt={banner.judul}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 flex items-center justify-center">
                    <ImageIcon className="w-20 h-20 text-emerald-500/30" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-10 lg:p-16">
                  <div className="max-w-3xl">
                    <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 drop-shadow-lg">
                      {banner.judul}
                    </h2>
                    {banner.deskripsi && (
                      <p className="text-sm sm:text-base text-gray-200 line-clamp-2 drop-shadow">
                        {banner.deskripsi}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {banners.length > 1 && (
              <div className="absolute bottom-4 right-6 flex gap-2">
                {banners.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentBanner(idx)}
                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                      idx === currentBanner
                        ? 'bg-white scale-110'
                        : 'bg-white/40 hover:bg-white/60'
                    }`}
                    aria-label={`Banner ${idx + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="h-64 sm:h-80 lg:h-96 bg-gradient-to-br from-emerald-800 via-emerald-700 to-teal-700 flex items-center justify-center">
            <div className="text-center px-4">
              <ShieldCheck className="w-16 h-16 mx-auto text-emerald-300/50 mb-4" />
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-2">
                Sistem Tanda Tangan Elektronik
              </h2>
              <p className="text-emerald-200 text-sm sm:text-base max-w-lg mx-auto">
                Verifikasi keaslian dokumen elektronik yang ditandatangani secara digital
              </p>
            </div>
          </div>
        )}
      </section>

      {/* Verification Section */}
      <section id="verify" className="py-12 sm:py-16 bg-gradient-to-b from-emerald-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 mb-4">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              <span className="text-sm font-medium text-emerald-800">Verifikasi Dokumen</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
              Cek Keaslian Dokumen
            </h2>
            <p className="mt-2 text-muted-foreground max-w-lg mx-auto">
              Upload dokumen yang akan diverifikasi keasliannya
            </p>
          </div>

          <div className="max-w-xl mx-auto">
            <Card className="border-emerald-200 shadow-lg">
              <CardContent className="p-6">
                {/* File Upload Area */}
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`relative rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer ${
                    isDragOver
                      ? 'border-emerald-500 bg-emerald-50'
                      : verifyFile
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-gray-300 hover:border-emerald-400 hover:bg-emerald-50/30'
                  }`}
                >
                  {verifyFile ? (
                    <div className="p-5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                          <FileText className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate" title={verifyFile.name}>
                            {verifyFile.name}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {formatFileSize(verifyFile.size)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={handleRemoveFile}
                          className="w-8 h-8 rounded-full bg-red-100 hover:bg-red-200 flex items-center justify-center transition-colors shrink-0"
                          aria-label="Hapus file"
                        >
                          <X className="w-4 h-4 text-red-600" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="block p-8 text-center cursor-pointer">
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={handleFileSelect}
                        className="sr-only"
                      />
                      <div className={`w-14 h-14 rounded-full mx-auto mb-3 flex items-center justify-center transition-colors ${
                        isDragOver ? 'bg-emerald-200' : 'bg-emerald-100'
                      }`}>
                        <Upload className={`w-6 h-6 transition-colors ${
                          isDragOver ? 'text-emerald-700' : 'text-emerald-600'
                        }`} />
                      </div>
                      <p className="text-sm font-medium text-gray-700 mb-1">
                        {isDragOver ? 'Lepaskan file di sini' : 'Klik atau seret file ke sini'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        PDF, DOC, DOCX, JPG, PNG (Maks. 25MB)
                      </p>
                    </label>
                  )}
                </div>

                {/* Verify Button */}
                <Button
                  onClick={handleVerifyUpload}
                  disabled={!verifyFile || verifyLoading}
                  className="w-full mt-4 h-11 bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
                >
                  {verifyLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <FileUp className="w-4 h-4" />
                  )}
                  {verifyLoading ? 'Memverifikasi...' : 'Verifikasi Dokumen'}
                </Button>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <ShieldCheck className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-[11px] text-emerald-700 font-medium">Aman & Terpercaya</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <FileText className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-[11px] text-emerald-700 font-medium">Sesuai UU ITE</p>
                  </div>
                  <div className="text-center p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle className="w-5 h-5 mx-auto text-emerald-600 mb-1" />
                    <p className="text-[11px] text-emerald-700 font-medium">Hash SHA-256</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Berita Section */}
      <section id="berita" className="py-12 sm:py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-1.5 mb-3">
                <Newspaper className="w-4 h-4 text-emerald-700" />
                <span className="text-sm font-medium text-emerald-800">Berita & Informasi</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
                Berita Terbaru
              </h2>
            </div>
          </div>

          {beritaLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <div className="h-48 bg-muted animate-pulse" />
                  <CardContent className="p-5 space-y-3">
                    <div className="h-4 bg-muted rounded animate-pulse w-3/4" />
                    <div className="h-3 bg-muted rounded animate-pulse w-full" />
                    <div className="h-3 bg-muted rounded animate-pulse w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : beritaList.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
                <p className="text-muted-foreground">Belum ada berita yang dipublikasikan</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {beritaList.map((berita) => (
                <Card
                  key={berita.id}
                  className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
                  onClick={() => setSelectedBerita(berita)}
                >
                  <div className="relative h-48 bg-muted overflow-hidden">
                    {berita.imagePath ? (
                      <img
                        src={`/api/berita/image/${berita.imagePath}`}
                        alt={berita.judul}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <Newspaper className="w-10 h-10 text-emerald-300" />
                      </div>
                    )}
                    {berita.kategori && (
                      <Badge
                        className={`absolute top-3 left-3 ${
                          kategoriColor[berita.kategori] || 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {berita.kategori}
                      </Badge>
                    )}
                  </div>
                  <CardContent className="p-5">
                    <h3 className="font-semibold text-base line-clamp-2 mb-2 group-hover:text-emerald-700 transition-colors">
                      {berita.judul}
                    </h3>
                    {berita.ringkas && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {berita.ringkas}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <div className="flex items-center gap-3">
                        {berita.penulis && (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {berita.penulis}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(berita.createdAt)}
                        </span>
                      </div>
                      <span className="flex items-center gap-0.5 text-emerald-700 font-medium group-hover:gap-1.5 transition-all">
                        Baca <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-emerald-900 text-white mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-3">
                {pengaturan?.headerLogoPath ? (
                  <img
                    src={`/api/pengaturan/header-logo/${pengaturan.headerLogoPath}`}
                    alt="Logo"
                    className="w-9 h-9 rounded-lg object-contain bg-white/15 p-1"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-base">{pengaturan?.judul || 'Sistem TTE'}</h3>
                  <p className="text-emerald-300 text-xs">{pengaturan?.subJudul || 'Tanda Tangan Elektronik'}</p>
                </div>
              </div>
              <p className="text-emerald-200 text-sm leading-relaxed">
                Sistem Tanda Tangan Elektronik yang sesuai dengan Undang-Undang Nomor 11 Tahun 2008
                tentang Informasi dan Transaksi Elektronik (UU ITE).
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Tautan</h4>
              <ul className="space-y-2 text-sm text-emerald-200">
                <li>
                  <a href="#verify" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Verifikasi Dokumen
                  </a>
                </li>
                <li>
                  <a href="#berita" className="hover:text-white transition-colors flex items-center gap-1.5">
                    <ChevronRight className="w-3 h-3" /> Berita & Informasi
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Dasar Hukum</h4>
              <ul className="space-y-2 text-sm text-emerald-200">
                <li className="flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 mt-1 shrink-0" /> UU No. 11 Tahun 2008 tentang ITE
                </li>
                <li className="flex items-start gap-1.5">
                  <ChevronRight className="w-3 h-3 mt-1 shrink-0" /> PP No. 71 Tahun 2019 tentang Penyelenggaraan Sistem dan Transaksi Elektronik
                </li>
              </ul>
            </div>
          </div>
          <Separator className="my-6 bg-emerald-700" />
          <div className="text-center text-xs text-emerald-300">
            &copy; {new Date().getFullYear()} {pengaturan?.judul || 'Sistem TTE'} - Pemerintah Daerah
          </div>
        </div>
      </footer>

      {/* Login Dialog */}
      <Dialog open={loginDialogOpen} onOpenChange={setLoginDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-600" />
              Login Admin
            </DialogTitle>
            <DialogDescription>
              Masuk ke panel administrasi Sistem TTE
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            {loginError && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-md px-4 py-3 text-sm">
                {loginError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="login-username">Username</Label>
              <Input
                id="login-username"
                type="text"
                placeholder="Masukkan username"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                disabled={loginLoading}
                autoComplete="username"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={loginShowPassword ? 'text' : 'password'}
                  placeholder="Masukkan password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  disabled={loginLoading}
                  autoComplete="current-password"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setLoginShowPassword(!loginShowPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  tabIndex={-1}
                  aria-label={loginShowPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {loginShowPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-800 text-white"
              disabled={loginLoading}
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Verification Result Dialog */}
      <Dialog open={verifyDialogOpen} onOpenChange={setVerifyDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Hasil Verifikasi
            </DialogTitle>
          </DialogHeader>

          {verifyError ? (
            <div className="space-y-4">
              <div className="flex flex-col items-center text-center py-4">
                <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-3">
                  <XCircle className="w-8 h-8 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-red-800">Verifikasi Gagal</h3>
                <p className="text-sm text-red-600 mt-1">{verifyError}</p>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
                  <p className="text-xs text-red-700">
                    Pastikan file dokumen yang diunggah adalah file asli yang ditandatangani secara elektronik dan belum dimodifikasi.
                  </p>
                </div>
              </div>
            </div>
          ) : verifyData ? (
            <div className="space-y-4">
              {verifyData.isStamp || verifyData.status === 'tte_stamp' ? (
                <>
                  <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                    <Stamp className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-emerald-800">Stempel TTE Valid</p>
                      <p className="text-xs text-emerald-700 mt-0.5">
                        Stempel Tanda Tangan Elektronik yang diterbitkan secara resmi.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold text-muted-foreground">Informasi Penandatangan</h4>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="font-medium">{verifyData.pegawai.nama}</span>
                      <span className="text-muted-foreground">NIP</span>
                      <span className="font-mono text-xs">{verifyData.pegawai.nip}</span>
                      <span className="text-muted-foreground">Jabatan</span>
                      <span>{verifyData.pegawai.jabatan}</span>
                      <span className="text-muted-foreground">OPD</span>
                      <span>{verifyData.pegawai.opd}</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Diterbitkan</p>
                      <p className="text-sm font-medium">{verifyData.tglTtd ? formatDateTime(verifyData.tglTtd) : '-'}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status</span>
                    {verifyData.isExpired ? (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        <XCircle className="w-3 h-3" /> Kedaluwarsa
                      </Badge>
                    ) : (
                      <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200">
                        <CheckCircle className="w-3 h-3" /> Valid
                      </Badge>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {verifyData.isExpired ? (
                    <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
                      <XCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Dokumen Telah Kedaluwarsa</p>
                        <p className="text-xs text-red-700 mt-0.5">
                          Masa berlaku berakhir pada {formatDate(verifyData.tanggalExpired)}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-3">
                      <CheckCircle className="w-5 h-5 shrink-0 text-green-600 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-800">Dokumen Valid</p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Ditandatangani secara elektronik dan masih berlaku
                        </p>
                      </div>
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4" /> Detail Dokumen
                    </h4>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Judul</span>
                      <span className="font-semibold">{verifyData.judulDokumen || verifyData.namaFile || '-'}</span>
                      {verifyData.namaFile && verifyData.judulDokumen && (
                        <>
                          <span className="text-muted-foreground">File</span>
                          <span className="font-mono text-xs break-all">{verifyData.namaFile}</span>
                        </>
                      )}
                      <span className="text-muted-foreground">Masa Berlaku</span>
                      <span className="flex items-center gap-1.5">
                        {verifyData.aktifSelamanya ? (
                          <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Aktif sampai di-nonaktifkan</>
                        ) : (
                          <><Clock className="w-3.5 h-3.5 text-amber-500" /> {verifyData.tanggalExpired ? `Hingga ${formatDate(verifyData.tanggalExpired)}` : '-'}</>
                        )}
                      </span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2.5">
                    <h4 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <User className="w-4 h-4" /> Penandatangan
                    </h4>
                    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                      <span className="text-muted-foreground">Nama</span>
                      <span className="font-medium">{verifyData.pegawai.nama}</span>
                      <span className="text-muted-foreground">NIP</span>
                      <span className="font-mono text-xs">{verifyData.pegawai.nip}</span>
                      <span className="text-muted-foreground">Jabatan</span>
                      <span>{verifyData.pegawai.jabatan}</span>
                      <span className="text-muted-foreground">OPD</span>
                      <span>{verifyData.pegawai.opd}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tanggal Tanda Tangan</p>
                      <p className="text-sm font-medium">{verifyData.tglTtd ? formatDateTime(verifyData.tglTtd) : '-'}</p>
                    </div>
                  </div>

                  {verifyData.keterangan && (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Keterangan</p>
                      <p className="text-sm">{verifyData.keterangan}</p>
                    </div>
                  )}

                  {verifyData.tembusan && (
                    <div className="rounded-lg border bg-muted/50 p-3">
                      <p className="text-xs text-muted-foreground mb-1">Tembusan</p>
                      <p className="text-sm">{verifyData.tembusan}</p>
                    </div>
                  )}

                  <Separator />

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Status Keaslian</span>
                    <Badge className="bg-green-100 text-green-800 border-green-200">
                      <CheckCircle className="w-3 h-3" /> Valid
                    </Badge>
                  </div>

                  {verifyData.hashFile && (
                    <>
                      <Separator />
                      <div className="space-y-1.5">
                        <p className="text-xs text-muted-foreground">Hash SHA-256</p>
                        <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                          <code className="flex-1 text-xs font-mono break-all">
                            {truncateHash(verifyData.hashFile)}
                          </code>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 shrink-0"
                            onClick={() => handleCopyHash(verifyData.hashFile!)}
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </>
                  )}

                  <Separator />

                  <div className="rounded-lg border bg-green-50 p-3">
                    <div className="flex items-start gap-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-green-600 mt-0.5" />
                      <p className="text-xs text-green-800">
                        Dokumen ini ditandatangani secara elektronik sesuai UU No. 11 Tahun 2008
                        tentang Informasi dan Transaksi Elektronik (UU ITE).
                      </p>
                    </div>
                  </div>
                </>
              )}
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Berita Detail Dialog */}
      <Dialog open={!!selectedBerita} onOpenChange={(open) => !open && setSelectedBerita(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl pr-8">{selectedBerita?.judul}</DialogTitle>
          </DialogHeader>
          {selectedBerita && (
            <div className="space-y-4">
              {selectedBerita.imagePath && (
                <div className="rounded-lg overflow-hidden">
                  <img
                    src={`/api/berita/image/${selectedBerita.imagePath}`}
                    alt={selectedBerita.judul}
                    className="w-full h-auto max-h-72 object-cover"
                  />
                </div>
              )}
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                {selectedBerita.kategori && (
                  <Badge className={kategoriColor[selectedBerita.kategori] || 'bg-gray-100 text-gray-800 border-gray-200'}>
                    <Tag className="w-3 h-3" /> {selectedBerita.kategori}
                  </Badge>
                )}
                {selectedBerita.penulis && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5" /> {selectedBerita.penulis}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> {formatDate(selectedBerita.createdAt)}
                </span>
              </div>
              <Separator />
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {selectedBerita.isi}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
