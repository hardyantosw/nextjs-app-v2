'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Upload,
  FileText,
  CheckCircle,
  Shield,
  Download,
  Eye,
  RotateCcw,
  X,
  Loader2,
  Lock,
} from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/lib/store';

// --- Types ---

interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  opd: string;
  statusAktif: boolean;
}

interface DokumenResult {
  id: string;
  namaFile: string;
  pegawai: Pegawai;
  tglTtd: string;
  tokenVerifikasi: string;
  status: string;
  createdAt: string;
}

type PageState = 'form' | 'loading' | 'success';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

// --- Helpers ---

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// --- Component ---

export default function UploadPage() {
  // Get current user from store for role-based restrictions
  const user = useAppStore((s) => s.user);
  const isPegawai = user?.role === 'pegawai';

  // State
  const [pageState, setPageState] = useState<PageState>('form');
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [pegawaiLoading, setPegawaiLoading] = useState(true);
  const [selectedPegawaiId, setSelectedPegawaiId] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [result, setResult] = useState<DokumenResult | null>(null);
  const [loadingText, setLoadingText] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch pegawai list on mount
  useEffect(() => {
    async function fetchPegawai() {
      try {
        setPegawaiLoading(true);
        const res = await fetch(
          '/api/pegawai?limit=100&statusAktif=true'
        );
        const json = await res.json();

        if (json.success && Array.isArray(json.data)) {
          setPegawaiList(json.data);
          // Auto-select pegawai if user is pegawai role
          if (isPegawai && user?.pegawaiId) {
            setSelectedPegawaiId(user.pegawaiId);
          }
        } else {
          toast.error('Gagal memuat data pegawai');
        }
      } catch {
        toast.error('Gagal memuat data pegawai');
      } finally {
        setPegawaiLoading(false);
      }
    }
    fetchPegawai();
  }, [isPegawai, user?.pegawaiId]);

  // File validation
  const validateFile = useCallback((file: File): string | null => {
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      return 'Hanya file PDF yang diperbolehkan';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `Ukuran file maksimal 25MB. File Anda: ${formatFileSize(file.size)}`;
    }
    return null;
  }, []);

  // Handle file selection
  const handleFileSelect = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        toast.error(error);
        return;
      }
      setSelectedFile(file);
    },
    [validateFile]
  );

  // Drag & Drop handlers
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(true);
    },
    []
  );

  const handleDragLeave = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        handleFileSelect(files[0]);
      }
    },
    [handleFileSelect]
  );

  // Submit / Sign document
  const handleSubmit = useCallback(async () => {
    if (!selectedFile) {
      toast.error('Silakan pilih file PDF terlebih dahulu');
      return;
    }
    if (!selectedPegawaiId) {
      toast.error('Silakan pilih penandatangan terlebih dahulu');
      return;
    }

    setPageState('loading');
    setLoadingText('Mengunggah dokumen...');

    try {
      // Simulate progress steps
      const progressTimer = setInterval(() => {
        setLoadingText((prev) => {
          if (prev === 'Mengunggah dokumen...') return 'Memverifikasi dokumen...';
          if (prev === 'Memverifikasi dokumen...') return 'Menandatangani dokumen...';
          if (prev === 'Menandatangani dokumen...') return 'Membuat QR Code verifikasi...';
          return prev;
        });
      }, 1500);

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('pegawaiId', selectedPegawaiId);

      const res = await fetch('/api/dokumen', {
        method: 'POST',
        body: formData,
      });

      clearInterval(progressTimer);

      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || 'Gagal menandatangani dokumen');
      }

      const json = await res.json();
      setResult(json.data);
      setPageState('success');
      toast.success('Dokumen berhasil ditandatangani!');
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Terjadi kesalahan saat menandatangani dokumen';
      toast.error(message);
      setPageState('form');
    }
  }, [selectedFile, selectedPegawaiId]);

  // Reset form
  const handleReset = useCallback(() => {
    setSelectedFile(null);
    setSelectedPegawaiId('');
    setResult(null);
    setPageState('form');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Open preview
  const handlePreview = useCallback(() => {
    if (!result) return;
    window.open(`/api/dokumen/${result.id}/preview`, '_blank');
  }, [result]);

  // Download
  const handleDownload = useCallback(() => {
    if (!result) return;
    const link = document.createElement('a');
    link.href = `/api/dokumen/${result.id}/download`;
    link.download = result.namaFile;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [result]);

  // Selected pegawai info
  const selectedPegawai = pegawaiList.find((p) => p.id === selectedPegawaiId);

  // ============================
  // Render: Loading State
  // ============================
  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-6 py-10">
            <div className="relative">
              <Shield className="size-16 text-primary animate-pulse" />
              <Loader2 className="size-6 text-primary absolute -bottom-1 -right-1 animate-spin" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-semibold">Menandatangani Dokumen</h3>
              <p className="text-sm text-muted-foreground">{loadingText}</p>
            </div>
            <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
              <div className="bg-primary h-full rounded-full animate-[progress_3s_ease-in-out_infinite]" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================
  // Render: Success State
  // ============================
  if (pageState === 'success' && result) {
    return (
      <div className="flex items-center justify-center py-8">
        <Card className="w-full max-w-2xl border-green-200 bg-green-50/50 dark:border-green-900 dark:bg-green-950/20">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
              <CheckCircle className="size-10 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-xl text-green-800 dark:text-green-300">
              Dokumen Berhasil Ditandatangani
            </CardTitle>
            <CardDescription className="text-green-700/70 dark:text-green-400/70">
              Tanda tangan elektronik telah diterapkan pada dokumen
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Document Info */}
            <div className="rounded-lg border border-green-200 bg-white dark:border-green-800 dark:bg-card p-4 space-y-3">
              <div className="flex items-start gap-3">
                <FileText className="size-5 text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium truncate">{result.namaFile}</p>
                  <p className="text-sm text-muted-foreground">Dokumen PDF</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground">Penandatangan</p>
                  <p className="font-medium">{result.pegawai?.nama || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">NIP</p>
                  <p className="font-medium">{result.pegawai?.nip || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Jabatan</p>
                  <p className="font-medium">{result.pegawai.jabatan}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Waktu Penandatanganan</p>
                  <p className="font-medium">{formatDateTime(result.tglTtd)}</p>
                </div>
              </div>

              <Separator />

              {/* Token Verifikasi */}
              <div>
                <p className="text-muted-foreground text-sm mb-1">Token Verifikasi</p>
                <Badge variant="secondary" className="font-mono text-xs break-all">
                  {result.tokenVerifikasi}
                </Badge>
              </div>
            </div>

            {/* QR Code */}
            <div className="rounded-lg border border-green-200 bg-white dark:border-green-800 dark:bg-card p-4">
              <p className="text-sm font-medium mb-3 text-center">QR Code Verifikasi</p>
              <div className="flex justify-center">
                <div className="border border-dashed border-green-300 dark:border-green-700 rounded-lg p-4 bg-white">
                  <img
                    src={`/api/dokumen/${result.id}/qrcode`}
                    alt="QR Code Verifikasi"
                    className="size-40 object-contain"
                  />
                </div>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Scan QR Code untuk memverifikasi keaslian dokumen
              </p>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Eye className="size-4" />
              Lihat PDF
            </Button>
            <Button
              onClick={handleDownload}
              variant="outline"
              className="w-full sm:w-auto"
            >
              <Download className="size-4" />
              Unduh PDF
            </Button>
            <Button
              onClick={handleReset}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
            >
              <RotateCcw className="size-4" />
              Tanda Tangani Lagi
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  // ============================
  // Render: Form State
  // ============================
  return (
    <div className="flex items-center justify-center py-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
              <Shield className="size-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-xl">Tanda Tangani Dokumen</CardTitle>
              <CardDescription>
                Unggah dokumen PDF dan terapkan tanda tangan elektronik (TTE)
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Pegawai Selection */}
          <div className="space-y-2">
            <Label htmlFor="pegawai-select">
              Penandatangan (Pegawai)
              {isPegawai && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-muted-foreground font-normal">
                  <Lock className="size-3" /> Hanya TTE Anda
                </span>
              )}
            </Label>
            <Select
              value={selectedPegawaiId}
              onValueChange={setSelectedPegawaiId}
              disabled={isPegawai}
            >
              <SelectTrigger className="w-full" id="pegawai-select">
                <SelectValue placeholder={pegawaiLoading ? 'Memuat data pegawai...' : 'Pilih penandatangan'} />
              </SelectTrigger>
              <SelectContent>
                {pegawaiList.length === 0 && !pegawaiLoading && (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    Tidak ada pegawai aktif
                  </div>
                )}
                {pegawaiList.map((p) => (
                  <SelectItem key={p.id} value={p.id} textValue={p.nama}>
                    <div className="flex flex-col gap-0.5">
                      <span className="font-medium">{p.nama}</span>
                      <span className="text-xs text-muted-foreground">
                        NIP: {p.nip} &middot; {p.jabatan}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedPegawai && (
              <div className="rounded-md border bg-muted/50 p-3 text-sm space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Nama:</span>
                  <span className="font-medium">{selectedPegawai.nama}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">NIP:</span>
                  <span className="font-medium">{selectedPegawai.nip}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Jabatan:</span>
                  <span className="font-medium">{selectedPegawai.jabatan}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">OPD:</span>
                  <span className="font-medium">{selectedPegawai.opd}</span>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* File Upload Area */}
          <div className="space-y-2">
            <Label>Dokumen PDF</Label>
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                relative flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed p-8
                cursor-pointer transition-colors duration-200
                ${
                  isDragOver
                    ? 'border-primary bg-primary/5'
                    : selectedFile
                      ? 'border-green-300 bg-green-50/50 dark:border-green-800 dark:bg-green-950/20'
                      : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/50'
                }
              `}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                onChange={handleInputChange}
                className="hidden"
              />

              {selectedFile ? (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                    <FileText className="size-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-center">
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-2 right-2 size-7 p-0 text-muted-foreground hover:text-destructive"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                  >
                    <X className="size-4" />
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                    <Upload className="size-6 text-muted-foreground" />
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      {isDragOver ? 'Lepaskan file di sini' : 'Seret & lepaskan file PDF di sini'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      atau klik untuk memilih file &middot; Maks. 25MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            onClick={handleSubmit}
            disabled={!selectedFile || !selectedPegawaiId || pegawaiLoading}
            className="w-full"
            size="lg"
          >
            <Shield className="size-4" />
            Tanda Tangani Dokumen
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
