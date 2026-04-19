'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  FileText,
  Calendar,
  Loader2,
  Stamp,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// Types
interface VerificationData {
  isStamp?: boolean;
  namaFile?: string;
  pegawai: {
    nama: string;
    nip: string;
    jabatan: string;
    opd: string;
  };
  tglTtd: string;
  status: string;
  hashFile?: string;
  keterangan?: string;
}

interface VerifikasiPageProps {
  token: string;
}

export default function VerifikasiPage({ token }: VerifikasiPageProps) {
  const [data, setData] = useState<VerificationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchVerification() {
      if (!token) {
        setError('Token verifikasi tidak ditemukan');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch(`/api/verifikasi/${token}`);
        if (!res.ok) {
          const json = await res.json().catch(() => null);
          setError(json?.error || 'Dokumen tidak ditemukan atau token tidak valid');
          return;
        }

        const json = await res.json();
        setData(json.data);
      } catch {
        setError('Gagal terhubung ke server verifikasi');
      } finally {
        setIsLoading(false);
      }
    }

    fetchVerification();
  }, [token]);

  function formatDateTime(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
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

  // Loading State
  if (isLoading) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="size-10 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">
                Memverifikasi dokumen...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error State
  if (error || !data) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg border-red-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-red-100">
              <XCircle className="size-8 text-red-600" />
            </div>
            <CardTitle className="text-xl text-red-800">
              Dokumen Tidak Ditemukan
            </CardTitle>
            <CardDescription className="text-red-600">
              {error || 'Token verifikasi tidak valid atau dokumen telah dihapus'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Verifikasi Gagal
                  </p>
                  <p className="mt-1 text-xs text-red-700">
                    Dokumen yang Anda cari tidak dapat ditemukan. Pastikan tautan verifikasi
                    yang Anda gunakan sudah benar dan belum kadaluarsa.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isStamp = data.isStamp || data.status === 'tte_stamp';

  // TTE Stamp Verification
  if (isStamp) {
    return (
      <div className="flex min-h-[80vh] items-center justify-center p-4">
        <Card className="w-full max-w-lg border-emerald-200">
          <CardHeader className="text-center">
            <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-emerald-100">
              <Stamp className="size-8 text-emerald-600" />
            </div>
            <CardTitle className="text-xl">
              Verifikasi Tanda Tangan Elektronik
            </CardTitle>
            <CardDescription>
              Stempel TTE - Sistem Tanda Tangan Elektronik
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="space-y-3">
              {/* Stamp indicator */}
              <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                <Stamp className="size-5 shrink-0 text-emerald-600 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-emerald-800">Stempel TTE Valid</p>
                  <p className="text-xs text-emerald-700 mt-0.5">
                    Ini adalah stempel Tanda Tangan Elektronik (TTE) yang diterbitkan secara resmi.
                  </p>
                </div>
              </div>

              <Separator />

              {/* Penandatangan Details */}
              <div className="space-y-2.5">
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Informasi Penandatangan
                </h4>

                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  <span className="text-muted-foreground">Nama</span>
                  <span className="font-medium">{data.pegawai.nama}</span>

                  <span className="text-muted-foreground">NIP</span>
                  <span className="font-mono text-xs">{data.pegawai.nip}</span>

                  <span className="text-muted-foreground">Jabatan</span>
                  <span>{data.pegawai.jabatan}</span>

                  <span className="text-muted-foreground">OPD</span>
                  <span>{data.pegawai.opd}</span>
                </div>
              </div>

              <Separator />

              {/* Tanggal Terbit */}
              <div className="flex items-start gap-3">
                <Calendar className="size-5 shrink-0 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Tanggal Diterbitkan</p>
                  <p className="font-medium">{formatDateTime(data.tglTtd)}</p>
                </div>
              </div>

              <Separator />

              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <Badge className="bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100">
                  <CheckCircle className="size-3" />
                  Stempel TTE Valid
                </Badge>
              </div>
            </div>

            <Separator />

            {/* Keterangan */}
            {data.keterangan && (
              <div className="rounded-lg border bg-blue-50 border-blue-200 p-3">
                <div className="flex items-start gap-2">
                  <AlertCircle className="size-4 shrink-0 text-blue-600 mt-0.5" />
                  <p className="text-xs text-blue-800">{data.keterangan}</p>
                </div>
              </div>
            )}

            {/* Legal Note */}
            <div className="rounded-lg border bg-green-50 p-3">
              <div className="flex items-start gap-2">
                <ShieldCheck className="size-4 shrink-0 text-green-600 mt-0.5" />
                <p className="text-xs text-green-800">
                  Stempel TTE ini diterbitkan sesuai Undang-Undang Nomor 11 Tahun 2008
                  tentang Informasi dan Transaksi Elektronik (UU ITE). Dokumen yang menggunakan
                  stempel ini dapat diverifikasi keasliannya melalui QR Code yang tertera.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Regular Document Verification
  return (
    <div className="flex min-h-[80vh] items-center justify-center p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-16 items-center justify-center rounded-full bg-green-100">
            <ShieldCheck className="size-8 text-green-600" />
          </div>
          <CardTitle className="text-xl">
            Verifikasi Dokumen Elektronik
          </CardTitle>
          <CardDescription>
            Sistem Tanda Tangan Elektronik
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-5">
          <div className="space-y-3">
            {/* Nama Dokumen */}
            {data.namaFile && (
              <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/50">
                <FileText className="size-5 shrink-0 text-muted-foreground mt-0.5" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Nama Dokumen</p>
                  <p className="font-medium break-all">{data.namaFile}</p>
                </div>
              </div>
            )}

            <Separator />

            {/* Penandatangan Details */}
            <div className="space-y-2.5">
              <h4 className="text-sm font-semibold text-muted-foreground">
                Informasi Penandatangan
              </h4>

              <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <span className="text-muted-foreground">Nama</span>
                <span className="font-medium">{data.pegawai.nama}</span>

                <span className="text-muted-foreground">NIP</span>
                <span className="font-mono text-xs">{data.pegawai.nip}</span>

                <span className="text-muted-foreground">Jabatan</span>
                <span>{data.pegawai.jabatan}</span>

                <span className="text-muted-foreground">OPD</span>
                <span>{data.pegawai.opd}</span>
              </div>
            </div>

            <Separator />

            {/* Tanggal Tanda Tangan */}
            <div className="flex items-start gap-3">
              <Calendar className="size-5 shrink-0 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Tanggal dan Waktu Tanda Tangan</p>
                <p className="font-medium">{formatDateTime(data.tglTtd)}</p>
              </div>
            </div>

            <Separator />

            {/* Status Keaslian */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status Keaslian</span>
              {data.status === 'signed' ? (
                <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                  <CheckCircle className="size-3" />
                  Valid
                </Badge>
              ) : (
                <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
                  Pending
                </Badge>
              )}
            </div>

            {/* Hash SHA-256 */}
            {data.hashFile && (
              <>
                <Separator />
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">Hash SHA-256</p>
                  <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
                    <code className="flex-1 text-xs font-mono break-all">
                      {truncateHash(data.hashFile)}
                    </code>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-7 shrink-0"
                      onClick={() => handleCopyHash(data.hashFile!)}
                      title="Salin hash lengkap"
                    >
                      <Copy className="size-3.5" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </div>

          <Separator />

          {/* Legal Note */}
          <div className="rounded-lg border bg-green-50 p-3">
            <div className="flex items-start gap-2">
              <ShieldCheck className="size-4 shrink-0 text-green-600 mt-0.5" />
              <p className="text-xs text-green-800">
                Dokumen ini telah ditandatangani secara elektronik sesuai Undang-Undang
                Nomor 11 Tahun 2008 tentang Informasi dan Transaksi Elektronik (UU ITE).
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
