'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Upload,
  Image as ImageIcon,
  Info,
  Settings,
  Loader2,
  CheckCircle2,
  X,
  Type,
  PanelTop,
  QrCode,
  Save,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';

interface PengaturanData {
  id: string;
  judul: string;
  subJudul: string;
  logoPath: string | null;
  headerLogoPath: string | null;
  createdAt: string;
  updatedAt: string;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES_QR = ['image/png', 'image/jpeg', 'image/jpg'];
const ACCEPTED_TYPES_HEADER = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];

export default function PengaturanPage() {
  const [pengaturan, setPengaturan] = useState<PengaturanData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // QR Logo state
  const [qrUploading, setQrUploading] = useState(false);
  const [qrSelectedFile, setQrSelectedFile] = useState<File | null>(null);
  const [qrPreviewUrl, setQrPreviewUrl] = useState<string | null>(null);
  const [currentQrLogoUrl, setCurrentQrLogoUrl] = useState<string | null>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  // Header Logo state
  const [headerUploading, setHeaderUploading] = useState(false);
  const [headerSelectedFile, setHeaderSelectedFile] = useState<File | null>(null);
  const [headerPreviewUrl, setHeaderPreviewUrl] = useState<string | null>(null);
  const [currentHeaderLogoUrl, setCurrentHeaderLogoUrl] = useState<string | null>(null);
  const headerFileInputRef = useRef<HTMLInputElement>(null);

  // Judul/SubJudul state
  const [formJudul, setFormJudul] = useState('');
  const [formSubJudul, setFormSubJudul] = useState('');

  const fetchPengaturan = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/pengaturan');
      if (res.ok) {
        const data = await res.json();
        setPengaturan(data.data);
        setFormJudul(data.data?.judul || '');
        setFormSubJudul(data.data?.subJudul || '');
        if (data.data?.logoPath) {
          const logoPath = data.data.logoPath;
          setCurrentQrLogoUrl(logoPath.startsWith('http') ? logoPath : `/api/pengaturan/logo/${logoPath}`);
        } else {
          setCurrentQrLogoUrl(null);
        }
        if (data.data?.headerLogoPath) {
          const headerLogoPath = data.data.headerLogoPath;
          setCurrentHeaderLogoUrl(headerLogoPath.startsWith('http') ? headerLogoPath : `/api/pengaturan/header-logo/${headerLogoPath}`);
        } else {
          setCurrentHeaderLogoUrl(null);
        }
      } else {
        toast.error('Gagal memuat data pengaturan');
      }
    } catch (error) {
      console.error('Error fetching pengaturan:', error);
      toast.error('Gagal memuat data pengaturan');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPengaturan();
  }, [fetchPengaturan]);

  // Cleanup preview URLs
  useEffect(() => {
    return () => {
      if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl);
      if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    };
  }, [qrPreviewUrl, headerPreviewUrl]);

  // QR Logo handlers
  const handleQrFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (qrPreviewUrl) { URL.revokeObjectURL(qrPreviewUrl); setQrPreviewUrl(null); }
    setQrSelectedFile(null);
    if (!file) return;
    if (!ACCEPTED_TYPES_QR.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PNG atau JPG.');
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file terlalu besar. Maksimum 2MB.');
      if (qrFileInputRef.current) qrFileInputRef.current.value = '';
      return;
    }
    setQrSelectedFile(file);
    setQrPreviewUrl(URL.createObjectURL(file));
  };

  const handleQrClearFile = () => {
    if (qrPreviewUrl) URL.revokeObjectURL(qrPreviewUrl);
    setQrPreviewUrl(null);
    setQrSelectedFile(null);
    if (qrFileInputRef.current) qrFileInputRef.current.value = '';
  };

  const handleQrUpload = async () => {
    if (!qrSelectedFile) { toast.error('Pilih file logo terlebih dahulu'); return; }
    setQrUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', qrSelectedFile);
      const res = await fetch('/api/pengaturan/logo', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        toast.success('Logo QR Code berhasil diunggah');
        if (data.data?.logoPath) {
          const logoPath = data.data.logoPath;
          setCurrentQrLogoUrl(logoPath.startsWith('http') ? `${logoPath}?t=${Date.now()}` : `/api/pengaturan/logo/${logoPath}?t=${Date.now()}`);
        }
        handleQrClearFile();
        fetchPengaturan();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Gagal mengunggah logo');
      }
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast.error('Gagal mengunggah logo. Silakan coba lagi.');
    } finally {
      setQrUploading(false);
    }
  };

  // Header Logo handlers
  const handleHeaderFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (headerPreviewUrl) { URL.revokeObjectURL(headerPreviewUrl); setHeaderPreviewUrl(null); }
    setHeaderSelectedFile(null);
    if (!file) return;
    if (!ACCEPTED_TYPES_HEADER.includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PNG, JPG, atau WebP.');
      if (headerFileInputRef.current) headerFileInputRef.current.value = '';
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Ukuran file terlalu besar. Maksimum 2MB.');
      if (headerFileInputRef.current) headerFileInputRef.current.value = '';
      return;
    }
    setHeaderSelectedFile(file);
    setHeaderPreviewUrl(URL.createObjectURL(file));
  };

  const handleHeaderClearFile = () => {
    if (headerPreviewUrl) URL.revokeObjectURL(headerPreviewUrl);
    setHeaderPreviewUrl(null);
    setHeaderSelectedFile(null);
    if (headerFileInputRef.current) headerFileInputRef.current.value = '';
  };

  const handleHeaderUpload = async () => {
    if (!headerSelectedFile) { toast.error('Pilih file logo terlebih dahulu'); return; }
    setHeaderUploading(true);
    try {
      const formData = new FormData();
      formData.append('logo', headerSelectedFile);
      const res = await fetch('/api/pengaturan/header-logo', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        toast.success('Logo header berhasil diunggah');
        if (data.data?.headerLogoPath) {
          const headerLogoPath = data.data.headerLogoPath;
          setCurrentHeaderLogoUrl(headerLogoPath.startsWith('http') ? `${headerLogoPath}?t=${Date.now()}` : `/api/pengaturan/header-logo/${headerLogoPath}?t=${Date.now()}`);
        }
        handleHeaderClearFile();
        fetchPengaturan();
      } else {
        const errorData = await res.json();
        toast.error(errorData.error || 'Gagal mengunggah logo header');
      }
    } catch (error) {
      console.error('Error uploading header logo:', error);
      toast.error('Gagal mengunggah logo header. Silakan coba lagi.');
    } finally {
      setHeaderUploading(false);
    }
  };

  // Save judul & subJudul
  const handleSaveJudul = async () => {
    if (!formJudul.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    setSaving(true);
    try {
      const res = await fetch('/api/pengaturan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          judul: formJudul.trim(),
          subJudul: formSubJudul.trim(),
        }),
      });
      if (res.ok) {
        toast.success('Pengaturan berhasil disimpan');
        fetchPengaturan();
      } else {
        toast.error('Gagal menyimpan pengaturan');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
        <span className="ml-3 text-muted-foreground">Memuat pengaturan...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan</h1>
        <p className="text-muted-foreground">
          Kelola pengaturan sistem Tanda Tangan Elektronik
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left Column - Main Settings */}
        <div className="lg:col-span-2 space-y-6">

          {/* Judul & Sub Judul Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Type className="h-5 w-5" />
                Judul & Sub Judul
              </CardTitle>
              <CardDescription>
                Atur judul dan sub judul yang tampil di header halaman publik
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="judul">Judul Header *</Label>
                <Input
                  id="judul"
                  value={formJudul}
                  onChange={(e) => setFormJudul(e.target.value)}
                  placeholder="Contoh: Sistem TTE"
                  className="max-w-md"
                />
                <p className="text-[11px] text-muted-foreground">Judul utama yang tampil di header navbar</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="subJudul">Sub Judul Header</Label>
                <Input
                  id="subJudul"
                  value={formSubJudul}
                  onChange={(e) => setFormSubJudul(e.target.value)}
                  placeholder="Contoh: Tanda Tangan Elektronik"
                  className="max-w-md"
                />
                <p className="text-[11px] text-muted-foreground">Sub judul yang tampil di bawah judul utama</p>
              </div>

              {/* Preview */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <p className="text-xs text-muted-foreground mb-2">Pratinjau Header:</p>
                <div className="bg-emerald-800 rounded-lg px-4 py-3 flex items-center gap-3">
                  {currentHeaderLogoUrl ? (
                    <img
                      src={currentHeaderLogoUrl}
                      alt="Logo preview"
                      className="w-9 h-9 rounded-lg object-contain bg-white/15 p-1"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-white text-sm font-bold tracking-tight leading-tight">
                      {formJudul || 'Sistem TTE'}
                    </h3>
                    <p className="text-emerald-200 text-[10px] leading-tight">
                      {formSubJudul || 'Tanda Tangan Elektronik'}
                    </p>
                  </div>
                </div>
              </div>

              <Button
                onClick={handleSaveJudul}
                disabled={saving}
                className="gap-2 bg-emerald-700 hover:bg-emerald-800 text-white"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Simpan Judul
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Header Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <PanelTop className="h-5 w-5" />
                Logo Header
              </CardTitle>
              <CardDescription>
                Logo yang ditampilkan di header/navbar halaman publik
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Current Logo */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Logo Saat Ini</p>
                  {currentHeaderLogoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-28 w-28 rounded-lg border-2 border-dashed border-border p-2 bg-muted/30">
                        <img
                          src={currentHeaderLogoUrl}
                          alt="Logo header saat ini"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Logo header aktif
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                        <div className="text-center">
                          <ImageIcon className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-1 text-[10px] text-muted-foreground">Belum ada logo</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Form */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Upload Logo Baru</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={headerFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg,image/webp"
                        onChange={handleHeaderFileSelect}
                        disabled={headerUploading}
                        className="flex-1 text-sm"
                      />
                      {headerSelectedFile && (
                        <Button variant="ghost" size="icon" onClick={handleHeaderClearFile} disabled={headerUploading} className="h-9 w-9 shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {headerPreviewUrl && headerSelectedFile && (
                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 shrink-0 rounded-md border bg-white p-1">
                            <img src={headerPreviewUrl} alt="Preview" className="h-full w-full object-contain" />
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="font-medium text-foreground">{headerSelectedFile.name}</p>
                            <p>{formatFileSize(headerSelectedFile.size)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleHeaderUpload}
                    disabled={!headerSelectedFile || headerUploading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {headerUploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Upload Logo Header</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* QR Code Logo Section */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <QrCode className="h-5 w-5" />
                Logo QR Code
              </CardTitle>
              <CardDescription>
                Logo yang ditampilkan di tengah QR Code pada dokumen yang ditandatangani
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Current Logo */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Logo QR Saat Ini</p>
                  {currentQrLogoUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <div className="relative h-28 w-28 rounded-lg border-2 border-dashed border-border p-2 bg-muted/30">
                        <img
                          src={currentQrLogoUrl}
                          alt="Logo QR saat ini"
                          className="h-full w-full object-contain"
                        />
                      </div>
                      <Badge variant="outline" className="gap-1 text-emerald-600 border-emerald-200">
                        <CheckCircle2 className="h-3 w-3" /> Logo QR aktif
                      </Badge>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="flex h-28 w-28 items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30">
                        <div className="text-center">
                          <QrCode className="mx-auto h-8 w-8 text-muted-foreground/40" />
                          <p className="mt-1 text-[10px] text-muted-foreground">Belum ada logo</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Upload Form */}
                <div className="space-y-3">
                  <p className="text-sm font-medium">Upload Logo QR Baru</p>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={qrFileInputRef}
                        type="file"
                        accept="image/png,image/jpeg,image/jpg"
                        onChange={handleQrFileSelect}
                        disabled={qrUploading}
                        className="flex-1 text-sm"
                      />
                      {qrSelectedFile && (
                        <Button variant="ghost" size="icon" onClick={handleQrClearFile} disabled={qrUploading} className="h-9 w-9 shrink-0">
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    {qrPreviewUrl && qrSelectedFile && (
                      <div className="rounded-md border bg-muted/30 p-3">
                        <div className="flex items-center gap-3">
                          <div className="h-16 w-16 shrink-0 rounded-md border bg-white p-1">
                            <img src={qrPreviewUrl} alt="Preview" className="h-full w-full object-contain" />
                          </div>
                          <div className="text-xs text-muted-foreground space-y-0.5">
                            <p className="font-medium text-foreground">{qrSelectedFile.name}</p>
                            <p>{formatFileSize(qrSelectedFile.size)}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={handleQrUpload}
                    disabled={!qrSelectedFile || qrUploading}
                    className="w-full gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    {qrUploading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Mengunggah...</>
                    ) : (
                      <><Upload className="h-4 w-4" /> Upload Logo QR</>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Info Card */}
        <div className="space-y-6">
          <Card className="border-sky-200 dark:border-sky-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Info className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                Informasi Pengaturan
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3 text-sm">
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-medium">Judul & Sub Judul</p>
                    <p className="text-muted-foreground text-xs">Tampil di header navbar dan footer halaman publik</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-medium">Logo Header</p>
                    <p className="text-muted-foreground text-xs">Tampil di header navbar halaman publik. PNG, JPG, WebP. Maks 2MB</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                  <div>
                    <p className="font-medium">Logo QR Code</p>
                    <p className="text-muted-foreground text-xs">Tampil di tengah QR Code. PNG transparan, 200x200px. Maks 2MB</p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="rounded-md bg-muted/50 p-3">
                <p className="text-xs text-muted-foreground">
                  <Settings className="inline h-3 w-3 mr-1 -mt-0.5" />
                  Logo header yang diunggah akan menggantikan logo sebelumnya.
                  Disarankan menggunakan logo dengan background transparan untuk hasil terbaik.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Tips Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Tips</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>
                Untuk logo header, gunakan file PNG dengan background transparan agar terlihat rapi di navbar berwarna.
              </p>
              <p>
                Ukuran gambar logo header yang disarankan adalah 40x40 hingga 80x80 piksel.
              </p>
              <p>
                Untuk logo QR Code, gunakan file PNG transparan ukuran 200x200px agar tidak mengganggu keterbacaan QR Code.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
