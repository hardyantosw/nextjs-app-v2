'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Download,
  Search,
  Loader2,
  ImageOff,
  QrCode,
  Info,
  Eye,
  X,
  FileSignature,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useAppStore } from '@/lib/store';

// Types
interface PegawaiInfo {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  opd: string;
  statusAktif: boolean;
  totalDokumen: number;
}

export default function DownloadTTEPage() {
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // State for pegawai list (admin view)
  const [pegawaiList, setPegawaiList] = useState<PegawaiInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  // State for current pegawai (pegawai view)
  const [myPegawai, setMyPegawai] = useState<PegawaiInfo | null>(null);
  const [loadingMyPegawai, setLoadingMyPegawai] = useState(true);

  // State for preview dialog
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPegawai, setPreviewPegawai] = useState<PegawaiInfo | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch all active pegawai (admin view)
  const fetchPegawaiList = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '100',
        statusAktif: 'true',
      });
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const res = await fetch(`/api/pegawai?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPegawaiList(json.data);
      } else {
        toast.error(json.message || 'Gagal memuat data pegawai');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  // Fetch own pegawai data (pegawai view)
  const fetchMyPegawai = useCallback(async () => {
    if (!user?.pegawaiId) {
      setLoadingMyPegawai(false);
      return;
    }

    setLoadingMyPegawai(true);
    try {
      const res = await fetch(`/api/pegawai?limit=1`);
      const json = await res.json();

      if (json.success && json.data.length > 0) {
        // For pegawai, the API only returns their own data
        setMyPegawai(json.data[0]);
      } else {
        toast.error(json.message || 'Gagal memuat data pegawai');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoadingMyPegawai(false);
    }
  }, [user?.pegawaiId]);

  useEffect(() => {
    if (isAdmin) {
      fetchPegawaiList();
    } else {
      fetchMyPegawai();
    }
  }, [isAdmin, fetchPegawaiList, fetchMyPegawai]);

  // Handle preview
  const handlePreview = (pegawai: PegawaiInfo) => {
    setPreviewPegawai(pegawai);
    setPreviewError(false);
    setPreviewLoading(true);
    setPreviewOpen(true);
  };

  // Handle download
  const handleDownload = (pegawaiId: string) => {
    window.open(`/api/tte-image/${pegawaiId}?qrcode=true`, '_blank');
    toast.success('Download QR Code TTE dimulai');
  };

  // Filter pegawai for admin search
  const filteredPegawai = isAdmin
    ? debouncedSearch
      ? pegawaiList.filter(
          (p) =>
            p.nama.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            p.nip.toLowerCase().includes(debouncedSearch.toLowerCase())
        )
      : pegawaiList
    : [];

  // Info card content
  const InfoCard = () => (
    <Card className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/20">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Info className="size-5 text-amber-600 dark:text-amber-400" />
          <CardTitle className="text-base text-amber-800 dark:text-amber-300">
            Informasi Penggunaan Gambar TTE
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm text-amber-700 dark:text-amber-400">
          <li className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              Gambar TTE ini dapat ditempelkan pada dokumen yang akan ditandatangani
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              QR Code pada gambar TTE dapat dipindai untuk verifikasi keaslian
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              Pastikan gambar TTE ditempatkan pada posisi yang jelas dan tidak terpotong
            </span>
          </li>
          <li className="flex items-start gap-2">
            <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-amber-500" />
            <span>
              Verifikasi dokumen tetap dapat dilakukan melalui QR Code pada gambar TTE
            </span>
          </li>
        </ul>
      </CardContent>
    </Card>
  );

  // Pegawai card component
  const PegawaiCard = ({ pegawai }: { pegawai: PegawaiInfo }) => (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="flex items-start gap-4 min-w-0">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
              <FileSignature className="size-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-base truncate">
                {pegawai.nama}
              </h3>
              <p className="text-sm text-muted-foreground font-mono mt-0.5">
                NIP: {pegawai.nip}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pegawai.jabatan}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                {pegawai.opd}
              </p>
              <Badge className="mt-2 bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800">
                Aktif
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePreview(pegawai)}
              className="gap-1.5"
            >
              <Eye className="size-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
            <Button
              size="sm"
              onClick={() => handleDownload(pegawai.id)}
              className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              <Download className="size-4" />
              Download TTE
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Download TTE Elektronik
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Download gambar Tanda Tangan Elektronik untuk ditempelkan pada dokumen
        </p>
      </div>

      <Separator />

      {/* Info Card */}
      <InfoCard />

      {isAdmin ? (
        /* Admin View */
        <>
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Cari pegawai berdasarkan nama atau NIP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* Pegawai Cards */}
          {loading ? (
            <div className="grid grid-cols-1 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <Skeleton className="size-12 rounded-lg" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-48" />
                        <Skeleton className="h-4 w-36" />
                        <Skeleton className="h-4 w-40" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredPegawai.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <QrCode className="size-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Tidak ada data pegawai aktif
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {debouncedSearch
                  ? 'Coba ubah pencarian Anda'
                  : 'Belum ada pegawai aktif yang terdaftar'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 max-h-[calc(100vh-480px)] overflow-y-auto pr-1">
              {filteredPegawai.map((pegawai) => (
                <PegawaiCard key={pegawai.id} pegawai={pegawai} />
              ))}
            </div>
          )}
        </>
      ) : (
        /* Pegawai View */
        <>
          {loadingMyPegawai ? (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <Skeleton className="size-12 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-48" />
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-32" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : myPegawai ? (
            <PegawaiCard pegawai={myPegawai} />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <ImageOff className="size-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground font-medium">
                    Data pegawai tidak ditemukan
                  </p>
                  <p className="text-muted-foreground text-sm mt-1">
                    Akun Anda belum terhubung dengan data pegawai
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="size-5" />
              Preview Gambar TTE
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {previewPegawai && (
              <div className="text-sm text-muted-foreground">
                <p>
                  <span className="font-medium text-foreground">
                    {previewPegawai.nama}
                  </span>{' '}
                  - NIP: {previewPegawai.nip}
                </p>
              </div>
            )}
            <div className="flex items-center justify-center bg-muted/50 rounded-lg border p-4 min-h-[200px]">
              {previewError ? (
                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                  <ImageOff className="size-10" />
                  <p className="text-sm">Gagal memuat gambar TTE</p>
                </div>
              ) : (
                <>
                  {previewLoading && (
                    <div className="absolute flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-5 animate-spin" />
                      <span className="text-sm">Memuat preview...</span>
                    </div>
                  )}
                  {previewPegawai && (
                    <img
                      src={`/api/tte-image/${previewPegawai.id}?qrcode=true`}
                      alt={`QR Code TTE ${previewPegawai.nama}`}
                      className="max-w-full h-auto"
                      onLoad={() => setPreviewLoading(false)}
                      onError={() => {
                        setPreviewLoading(false);
                        setPreviewError(true);
                      }}
                    />
                  )}
                </>
              )}
            </div>
            {previewPegawai && !previewError && (
              <div className="flex justify-end">
                <Button
                  onClick={() => handleDownload(previewPegawai.id)}
                  className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <Download className="size-4" />
                  Download QR Code TTE
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
