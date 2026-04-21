'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Download,
  Loader2,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Stamp,
  Trash2,
  Upload,
  QrCode,
  Calendar,
  AlertCircle,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/lib/store';

// Types
interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  opd: string;
}

interface Dokumen {
  id: string;
  namaFile: string;
  judulDokumen: string | null;
  pegawaiId: string;
  tglTtd: string | null;
  status: string;
  hashFile: string;
  tokenVerifikasi: string;
  tanggalExpired: string | null;
  aktifSelamanya: boolean;
  keterangan: string | null;
  tembusan: string | null;
  createdAt: string;
  updatedAt: string;
  pegawai: Pegawai;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function DokumenPage() {
  const user = useAppStore((s) => s.user);
  const isAdmin = user?.role === 'admin';

  // Data state
  const [dokumenList, setDokumenList] = useState<Dokumen[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [pegawaiOptions, setPegawaiOptions] = useState<Pegawai[]>([]);

  // Filter state
  const [search, setSearch] = useState('');

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string | null>(null);

  // Add form state
  const [formPegawaiId, setFormPegawaiId] = useState('');
  const [formGeneratedId, setFormGeneratedId] = useState<string | null>(null);
  const [formGenerating, setFormGenerating] = useState(false);
  const [formTteGenerated, setFormTteGenerated] = useState(false);
  const [formJudulDokumen, setFormJudulDokumen] = useState('');
  const [formAktifSelamanya, setFormAktifSelamanya] = useState(true);
  const [formTanggalExpired, setFormTanggalExpired] = useState('');
  const [formKeterangan, setFormKeterangan] = useState('');
  const [formTembusan, setFormTembusan] = useState('');
  const [formSignedFile, setFormSignedFile] = useState<File | null>(null);
  const [formSaving, setFormSaving] = useState(false);

  // Fetch pegawai options
  useEffect(() => {
    async function fetchPegawai() {
      try {
        const res = await fetch('/api/pegawai?limit=100');
        if (res.ok) {
          const json = await res.json();
          setPegawaiOptions(json.data || []);
        }
      } catch {
        // silently fail
      }
    }
    fetchPegawai();
  }, []);

  // Fetch dokumen list
  const fetchDokumen = useCallback(async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      if (search) params.set('search', search);

      const res = await fetch(`/api/dokumen?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data dokumen');
      const json = await res.json();
      setDokumenList(json.data || []);
      setPagination((prev) => ({
        ...prev,
        total: json.pagination?.total || 0,
        totalPages: json.pagination?.totalPages || 0,
      }));
    } catch {
      toast.error('Gagal memuat data dokumen');
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.limit, search]);

  useEffect(() => {
    fetchDokumen();
  }, [fetchDokumen]);

  // Reset form
  function resetForm() {
    setFormPegawaiId(isAdmin ? '' : (user?.pegawaiId || ''));
    setFormGeneratedId(null);
    setFormGenerating(false);
    setFormTteGenerated(false);
    setFormJudulDokumen('');
    setFormAktifSelamanya(true);
    setFormTanggalExpired('');
    setFormKeterangan('');
    setFormTembusan('');
    setFormSignedFile(null);
    setFormSaving(false);
  }

  // Open add dialog
  function openAddDialog() {
    resetForm();
    setAddDialogOpen(true);
  }

  // Handle Generate TTE
  async function handleGenerateTTE() {
    const pegawaiId = isAdmin ? formPegawaiId : user?.pegawaiId;
    if (!pegawaiId) {
      toast.error(isAdmin ? 'Pilih pegawai terlebih dahulu' : 'Akun Anda tidak terhubung ke data pegawai');
      return;
    }

    setFormGenerating(true);
    try {
      const res = await fetch('/api/dokumen/generate-tte', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pegawaiId }),
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Gagal generate TTE');
      }

      const json = await res.json();
      setFormGeneratedId(json.data.id);
      setFormTteGenerated(true);
      toast.success('TTE berhasil di-generate! Silahkan unduh dan tempel ke dokumen Anda.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal generate TTE');
    } finally {
      setFormGenerating(false);
    }
  }

  // Handle Download TTE QR Code
  function handleDownloadTTE() {
    if (!formGeneratedId) return;
    window.open(`/api/dokumen/${formGeneratedId}/qrcode?download=true`, '_blank');
  }

  // Handle Save Document
  async function handleSaveDocument() {
    if (!formGeneratedId) {
      toast.error('Silahkan generate TTE terlebih dahulu');
      return;
    }
    if (!formJudulDokumen.trim()) {
      toast.error('Judul dokumen wajib diisi');
      return;
    }
    if (!formAktifSelamanya && !formTanggalExpired) {
      toast.error('Tanggal expired wajib diisi jika tidak aktif selamanya');
      return;
    }
    if (!formSignedFile) {
      toast.error('Upload file yang telah ditandatangani');
      return;
    }

    setFormSaving(true);
    try {
      const formData = new FormData();
      formData.append('judulDokumen', formJudulDokumen.trim());
      formData.append('aktifSelamanya', String(formAktifSelamanya));
      if (!formAktifSelamanya && formTanggalExpired) {
        formData.append('tanggalExpired', formTanggalExpired);
      }
      if (formKeterangan.trim()) {
        formData.append('keterangan', formKeterangan.trim());
      }
      if (formTembusan.trim()) {
        formData.append('tembusan', formTembusan.trim());
      }
      formData.append('file', formSignedFile);

      const res = await fetch(`/api/dokumen/${formGeneratedId}`, {
        method: 'PUT',
        body: formData,
      });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Gagal menyimpan dokumen');
      }

      toast.success('Dokumen TTE berhasil disimpan!');
      setAddDialogOpen(false);
      fetchDokumen();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan dokumen');
    } finally {
      setFormSaving(false);
    }
  }

  // Handle Delete
  async function handleDelete() {
    if (!selectedDocId) return;
    try {
      const res = await fetch(`/api/dokumen/${selectedDocId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus dokumen');
      toast.success('Dokumen berhasil dihapus');
      setDeleteDialogOpen(false);
      fetchDokumen();
    } catch {
      toast.error('Gagal menghapus dokumen');
    }
  }

  // Handle Download Signed Document
  async function handleDownloadSigned(docId: string) {
    try {
      const response = await fetch(`/api/dokumen/${docId}/download`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Gagal mengunduh dokumen' }));
        toast.error(error.error || 'Gagal mengunduh dokumen');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dokumen_${docId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mengunduh dokumen');
    }
  }

  // Handle Download QR Code for existing doc
  async function handleDownloadStamp(docId: string) {
    try {
      const response = await fetch(`/api/dokumen/${docId}/qrcode?download=true`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Gagal mengunduh QR Code' }));
        toast.error(error.error || 'Gagal mengunduh QR Code');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QRCode_${docId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mengunduh QR Code');
    }
  }

  // Handle Download TTE Stamp for pending documents
  async function handleDownloadTTEStamp(docId: string) {
    try {
      const response = await fetch(`/api/dokumen/${docId}/tte-stamp`, {
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Gagal mengunduh TTE' }));
        toast.error(error.error || 'Gagal mengunduh TTE');
        return;
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `TTE_Stamp_${docId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('TTE berhasil diunduh');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Gagal mengunduh TTE');
    }
  }

  // Format date
  function formatDate(dateStr: string | null): string {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  // Get status badge
  function getStatusBadge(doc: Dokumen) {
    const isExpired = !doc.aktifSelamanya && doc.tanggalExpired && new Date() > new Date(doc.tanggalExpired);

    if (doc.status === 'tte_stamp') {
      return (
        <Badge className="bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100">
          <Stamp className="w-3 h-3" /> TTE Stamp
        </Badge>
      );
    }

    if (doc.status === 'pending') {
      return (
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-100">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    }

    if (isExpired) {
      return (
        <Badge className="bg-red-100 text-red-800 border-red-200 hover:bg-red-100">
          <XCircle className="w-3 h-3" /> Kedaluwarsa
        </Badge>
      );
    }

    return (
      <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
        <CheckCircle className="w-3 h-3" /> Ditandatangani
      </Badge>
    );
  }

  // Get validity text
  function getValidityText(doc: Dokumen) {
    if (doc.aktifSelamanya) {
      return (
        <span className="flex items-center gap-1 text-sm">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
          Aktif selamanya
        </span>
      );
    }
    if (doc.tanggalExpired) {
      const isExpired = new Date() > new Date(doc.tanggalExpired);
      return (
        <span className={`flex items-center gap-1 text-sm ${isExpired ? 'text-red-600' : ''}`}>
          <Clock className="w-3.5 h-3.5" />
          s/d {formatDate(doc.tanggalExpired)}
        </span>
      );
    }
    return <span className="text-sm text-muted-foreground">-</span>;
  }

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">TTE Dokumen</h2>
          <p className="text-muted-foreground">
            {isAdmin
              ? 'Kelola dokumen TTE seluruh pegawai'
              : 'Kelola dokumen TTE Anda'}
          </p>
        </div>
        <Button
          onClick={openAddDialog}
          className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
        >
          <Plus className="w-4 h-4" />
          Tambah TTE Dokumen
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <FileText className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination.total}</p>
              <p className="text-xs text-muted-foreground">Total Dokumen</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {dokumenList.filter((d) => d.status === 'signed' && (d.aktifSelamanya || !d.tanggalExpired || new Date() <= new Date(d.tanggalExpired))).length}
              </p>
              <p className="text-xs text-muted-foreground">Aktif</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {dokumenList.filter((d) => d.status === 'pending').length}
              </p>
              <p className="text-xs text-muted-foreground">Pending</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">
                {dokumenList.filter((d) => !d.aktifSelamanya && d.tanggalExpired && new Date() > new Date(d.tanggalExpired)).length}
              </p>
              <p className="text-xs text-muted-foreground">Kedaluwarsa</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Input
                placeholder="Cari judul dokumen, nama / NIP pegawai..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    setPagination((prev) => ({ ...prev, page: 1 }));
                  }
                }}
              />
            </div>
            <Button
              onClick={() => setPagination((prev) => ({ ...prev, page: 1 }))}
              size="default"
            >
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Table */}
      <Card>
        <CardContent className="pt-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="size-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Memuat data...</span>
            </div>
          ) : dokumenList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <FileText className="size-12 text-muted-foreground/50" />
              <p className="mt-4 text-lg font-medium text-muted-foreground">
                Belum ada dokumen TTE
              </p>
              <p className="text-sm text-muted-foreground">
                {isAdmin
                  ? 'Dokumen TTE pegawai akan muncul di sini'
                  : 'Buat TTE dokumen pertama Anda'}
              </p>
              <Button onClick={openAddDialog} variant="outline" className="mt-4 gap-2">
                <Plus className="w-4 h-4" /> Tambah TTE Dokumen
              </Button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px]">No</TableHead>
                      <TableHead>Judul Dokumen</TableHead>
                      <TableHead>Penandatangan</TableHead>
                      <TableHead>Masa Berlaku</TableHead>
                      <TableHead>Tanggal TTD</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dokumenList.map((doc, index) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">
                          {startIndex + index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <FileText className="size-4 text-muted-foreground shrink-0" />
                            <span
                              className="max-w-[200px] truncate"
                              title={doc.judulDokumen || doc.namaFile}
                            >
                              {doc.judulDokumen || doc.namaFile}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-sm">{doc.pegawai.nama}</p>
                            <p className="text-xs text-muted-foreground font-mono">{doc.pegawai.nip}</p>
                          </div>
                        </TableCell>
                        <TableCell>{getValidityText(doc)}</TableCell>
                        <TableCell className="text-sm">
                          {formatDate(doc.tglTtd)}
                        </TableCell>
                        <TableCell>{getStatusBadge(doc)}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            {doc.status === 'signed' && (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleDownloadSigned(doc.id)}
                                title="Unduh Dokumen"
                              >
                                <Download className="size-4" />
                              </Button>
                            )}
                            {doc.status === 'pending' || doc.status === 'tte_stamp' ? (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8 text-emerald-600 hover:text-emerald-700"
                                  onClick={() => handleDownloadTTEStamp(doc.id)}
                                  title="Unduh Gambar TTE"
                                >
                                  <Stamp className="size-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="size-8"
                                  onClick={() => handleDownloadStamp(doc.id)}
                                  title="Unduh QR Code"
                                >
                                  <QrCode className="size-4" />
                                </Button>
                              </>
                            ) : (
                              <Button
                                variant="ghost"
                                size="icon"
                                className="size-8"
                                onClick={() => handleDownloadStamp(doc.id)}
                                title="Unduh QR Code"
                              >
                                <QrCode className="size-4" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => {
                                setSelectedDocId(doc.id);
                                setDeleteDialogOpen(true);
                              }}
                              title="Hapus"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Pagination */}
              <Separator className="my-4" />
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Menampilkan {startIndex + 1}-
                  {Math.min(startIndex + pagination.limit, pagination.total)} dari{' '}
                  {pagination.total} dokumen
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                    disabled={pagination.page <= 1}
                  >
                    Sebelumnya
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Halaman {pagination.page} dari {pagination.totalPages || 1}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                    disabled={pagination.page >= pagination.totalPages}
                  >
                    Selanjutnya
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add TTE Document Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Stamp className="w-5 h-5 text-emerald-600" />
              Tambah TTE Dokumen
            </DialogTitle>
            <DialogDescription>
              {isAdmin
                ? 'Generate TTE untuk pegawai, unduh stempel, tempel ke dokumen, lalu upload kembali'
                : 'Generate TTE Anda, unduh stempel, tempel ke dokumen, lalu upload kembali'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5">
            {/* Step 1: Select Pegawai (Admin only) */}
            {isAdmin && (
              <div className="space-y-2">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">1</span>
                  Pilih TTE Nama Pegawai
                </Label>
                <Select
                  value={formPegawaiId}
                  onValueChange={(val) => {
                    setFormPegawaiId(val);
                    setFormTteGenerated(false);
                    setFormGeneratedId(null);
                  }}
                  disabled={formTteGenerated}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih pegawai..." />
                  </SelectTrigger>
                  <SelectContent>
                    {pegawaiOptions.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nama} - {p.nip}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Step 2: Generate & Download TTE */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {isAdmin ? '2' : '1'}
                </span>
                Generate & Unduh TTE
              </Label>

              <div className="flex items-center gap-3">
                <Button
                  onClick={handleGenerateTTE}
                  disabled={
                    formGenerating ||
                    formTteGenerated ||
                    (isAdmin && !formPegawaiId)
                  }
                  className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
                >
                  {formGenerating ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      {isAdmin ? 'Generate TTE' : 'Generate TTE Saya'}
                    </>
                  )}
                </Button>

                <Button
                  variant="outline"
                  onClick={handleDownloadTTE}
                  disabled={!formTteGenerated}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Unduh TTE
                </Button>
              </div>

              {formTteGenerated && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-emerald-800">TTE berhasil di-generate!</p>
                    <p className="text-xs text-emerald-700 mt-0.5">
                      Silahkan unduh TTE, tempel ke file dokumen yang akan ditandatangani, lalu upload kembali di bawah.
                    </p>
                  </div>
                </div>
              )}

              {!formTteGenerated && (
                <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 flex items-start gap-2">
                  <Info className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-700">
                    Klik &quot;{isAdmin ? 'Generate TTE' : 'Generate TTE Saya'}&quot; untuk membuat stempel TTE. 
                    Unduh stempel, lalu tempel ke file dokumen yang akan ditandatangani.
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* Step 3: Document Details */}
            <div className="space-y-4">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {isAdmin ? '3' : '2'}
                </span>
                Detail Dokumen
              </Label>

              <div className="space-y-2">
                <Label htmlFor="judulDokumen">Judul Dokumen *</Label>
                <Input
                  id="judulDokumen"
                  value={formJudulDokumen}
                  onChange={(e) => setFormJudulDokumen(e.target.value)}
                  placeholder="Masukkan judul dokumen"
                />
              </div>

              {/* Validity */}
              <div className="space-y-3">
                <Label>Masa Berlaku Dokumen</Label>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      id="aktifSelamanya"
                      checked={formAktifSelamanya}
                      onCheckedChange={(checked) => {
                        setFormAktifSelamanya(checked as boolean);
                        if (checked) setFormTanggalExpired('');
                      }}
                    />
                    <label
                      htmlFor="aktifSelamanya"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Atur aktif sampai di-nonaktifkan manual
                    </label>
                  </div>

                  {!formAktifSelamanya && (
                    <div className="ml-7 space-y-1.5">
                      <Label htmlFor="tanggalExpired" className="text-xs text-muted-foreground">
                        Dokumen valid hingga tanggal:
                      </Label>
                      <Input
                        id="tanggalExpired"
                        type="date"
                        value={formTanggalExpired}
                        onChange={(e) => setFormTanggalExpired(e.target.value)}
                        className="max-w-xs"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Pegawai-only fields */}
              {!isAdmin && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="keterangan">
                      Keterangan <span className="text-muted-foreground font-normal">(Opsional)</span>
                    </Label>
                    <Textarea
                      id="keterangan"
                      value={formKeterangan}
                      onChange={(e) => setFormKeterangan(e.target.value)}
                      placeholder="Keterangan tambahan tentang dokumen"
                      rows={2}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tembusan">
                      Tembusan Dokumen <span className="text-muted-foreground font-normal">(Opsional)</span>
                    </Label>
                    <Input
                      id="tembusan"
                      value={formTembusan}
                      onChange={(e) => setFormTembusan(e.target.value)}
                      placeholder="Tembusan dokumen (pisahkan dengan koma)"
                    />
                  </div>
                </>
              )}
            </div>

            <Separator />

            {/* Step 4: Upload Signed File */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center gap-1.5">
                <span className="flex items-center justify-center w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold">
                  {isAdmin ? '4' : '3'}
                </span>
                Upload File yang Telah Ditandatangani
              </Label>

              <div className="space-y-2">
                {!formSignedFile ? (
                  <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">
                      Klik untuk upload file
                    </span>
                    <span className="text-xs text-muted-foreground mt-1">
                      PDF, DOC, DOCX, JPG, PNG • Maks 25MB
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setFormSignedFile(file);
                      }}
                    />
                  </label>
                ) : (
                  <div className="rounded-lg border bg-muted/30 p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-sm truncate" title={formSignedFile.name}>
                        {formSignedFile.name}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        ({(formSignedFile.size / 1024 / 1024).toFixed(1)} MB)
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 shrink-0"
                      onClick={() => setFormSignedFile(null)}
                    >
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setAddDialogOpen(false)}
            >
              Batal
            </Button>
            <Button
              onClick={handleSaveDocument}
              disabled={!formTteGenerated || !formSignedFile || formSaving}
              className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2"
            >
              {formSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Simpan
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen TTE?</AlertDialogTitle>
            <AlertDialogDescription>
              Dokumen TTE yang dihapus tidak dapat dikembalikan. Data verifikasi terkait juga akan dihapus.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
