'use client';

import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

// Types
interface Pegawai {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  opd: string;
  statusAktif: boolean;
  totalDokumen: number;
  createdAt: string;
  updatedAt: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface FormData {
  nama: string;
  nip: string;
  jabatan: string;
  opd: string;
  statusAktif: boolean;
}

const initialFormData: FormData = {
  nama: '',
  nip: '',
  jabatan: '',
  opd: '',
  statusAktif: true,
};

export default function PegawaiPage() {
  // State for data
  const [pegawaiList, setPegawaiList] = useState<Pegawai[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // State for search and filter
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('semua');
  const [page, setPage] = useState(1);

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPegawai, setDeletingPegawai] = useState<Pegawai | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Reset page when filter changes
  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  // Fetch pegawai data
  const fetchPegawai = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }
      if (statusFilter !== 'semua') {
        params.set('statusAktif', statusFilter === 'aktif' ? 'true' : 'false');
      }

      const res = await fetch(`/api/pegawai?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setPegawaiList(json.data);
        setPagination(json.pagination);
      } else {
        toast.error(json.message || 'Gagal memuat data pegawai');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchPegawai();
  }, [fetchPegawai]);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.nama.trim()) {
      errors.nama = 'Nama lengkap wajib diisi';
    }
    if (!formData.nip.trim()) {
      errors.nip = 'NIP wajib diisi';
    }
    if (!formData.jabatan.trim()) {
      errors.jabatan = 'Jabatan wajib diisi';
    }
    if (!formData.opd.trim()) {
      errors.opd = 'OPD wajib diisi';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open dialog for adding
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (pegawai: Pegawai) => {
    setEditingId(pegawai.id);
    setFormData({
      nama: pegawai.nama,
      nip: pegawai.nip,
      jabatan: pegawai.jabatan,
      opd: pegawai.opd,
      statusAktif: pegawai.statusAktif,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/pegawai/${editingId}`
        : '/api/pegawai';
      const method = editingId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(
          editingId
            ? 'Pegawai berhasil diperbarui'
            : 'Pegawai berhasil ditambahkan'
        );
        setDialogOpen(false);
        fetchPegawai();
      } else {
        toast.error(json.message || 'Terjadi kesalahan');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  // Open delete confirmation
  const handleDeleteClick = (pegawai: Pegawai) => {
    setDeletingPegawai(pegawai);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingPegawai) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/pegawai/${deletingPegawai.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        toast.success('Pegawai berhasil dihapus');
        setDeleteDialogOpen(false);
        setDeletingPegawai(null);
        fetchPegawai();
      } else {
        toast.error(json.message || 'Gagal menghapus pegawai');
      }
    } catch {
      toast.error('Terjadi kesalahan saat menghapus data');
    } finally {
      setDeleting(false);
    }
  };

  // Pagination helpers
  const handlePreviousPage = () => {
    if (page > 1) setPage(page - 1);
  };

  const handleNextPage = () => {
    if (page < pagination.totalPages) setPage(page + 1);
  };

  // Row number calculation
  const getRowNumber = (index: number) => {
    return (page - 1) * pagination.limit + index + 1;
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Master Pegawai</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola data pegawai penandatangan elektronik
        </p>
      </div>

      <Separator />

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Daftar Pegawai</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="size-4" />
              Tambah Pegawai
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search and Filter Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan nama atau NIP..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select
              value={statusFilter}
              onValueChange={setStatusFilter}
            >
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="semua">Semua Status</SelectItem>
                <SelectItem value="aktif">Aktif</SelectItem>
                <SelectItem value="tidak_aktif">Tidak Aktif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : pegawaiList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <Search className="size-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Tidak ada data pegawai
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {debouncedSearch || statusFilter !== 'semua'
                  ? 'Coba ubah filter pencarian Anda'
                  : 'Klik "Tambah Pegawai" untuk menambahkan data baru'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">No</TableHead>
                      <TableHead>Nama Lengkap</TableHead>
                      <TableHead>NIP</TableHead>
                      <TableHead>Jabatan</TableHead>
                      <TableHead>OPD</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                      <TableHead className="text-center">Total Dokumen</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pegawaiList.map((pegawai, index) => (
                      <TableRow key={pegawai.id}>
                        <TableCell className="text-center font-medium">
                          {getRowNumber(index)}
                        </TableCell>
                        <TableCell className="font-medium">
                          {pegawai.nama}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {pegawai.nip}
                        </TableCell>
                        <TableCell>{pegawai.jabatan}</TableCell>
                        <TableCell>{pegawai.opd}</TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              pegawai.statusAktif
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                                : 'bg-red-100 text-red-800 border-red-200 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                            }
                          >
                            {pegawai.statusAktif ? 'Aktif' : 'Tidak Aktif'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          {pegawai.totalDokumen}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEdit(pegawai)}
                              title="Edit pegawai"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(pegawai)}
                              title="Hapus pegawai"
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
              <div className="flex items-center justify-between mt-4">
                <p className="text-sm text-muted-foreground">
                  Menampilkan{' '}
                  <span className="font-medium">
                    {(page - 1) * pagination.limit + 1}
                  </span>{' '}
                  -{' '}
                  <span className="font-medium">
                    {Math.min(page * pagination.limit, pagination.total)}
                  </span>{' '}
                  dari <span className="font-medium">{pagination.total}</span>{' '}
                  pegawai
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePreviousPage}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="size-4" />
                    Sebelumnya
                  </Button>
                  <div className="flex items-center gap-1">
                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                      .filter((p) => {
                        // Show first, last, current, and adjacent pages
                        return (
                          p === 1 ||
                          p === pagination.totalPages ||
                          Math.abs(p - page) <= 1
                        );
                      })
                      .map((p, i, arr) => {
                        // Add ellipsis indicator
                        const prevVal = arr[i - 1];
                        const showEllipsis = prevVal !== undefined && p - prevVal > 1;
                        return (
                          <span key={p} className="flex items-center">
                            {showEllipsis && (
                              <span className="px-1 text-muted-foreground text-sm">
                                ...
                              </span>
                            )}
                            <Button
                              variant={p === page ? 'default' : 'outline'}
                              size="sm"
                              className="size-8 p-0"
                              onClick={() => setPage(p)}
                            >
                              {p}
                            </Button>
                          </span>
                        );
                      })}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={page >= pagination.totalPages}
                  >
                    Selanjutnya
                    <ChevronRight className="size-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            setFormErrors({});
          }
          setDialogOpen(open);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit Pegawai' : 'Tambah Pegawai Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Perbarui informasi pegawai di bawah ini.'
                : 'Isi data pegawai baru yang akan ditambahkan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Nama Lengkap */}
            <div className="grid gap-2">
              <Label htmlFor="nama">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama"
                placeholder="Masukkan nama lengkap"
                value={formData.nama}
                onChange={(e) =>
                  setFormData({ ...formData, nama: e.target.value })
                }
                aria-invalid={!!formErrors.nama}
              />
              {formErrors.nama && (
                <p className="text-sm text-destructive">{formErrors.nama}</p>
              )}
            </div>

            {/* NIP */}
            <div className="grid gap-2">
              <Label htmlFor="nip">
                NIP <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nip"
                placeholder="Masukkan NIP"
                value={formData.nip}
                onChange={(e) =>
                  setFormData({ ...formData, nip: e.target.value })
                }
                aria-invalid={!!formErrors.nip}
              />
              {formErrors.nip && (
                <p className="text-sm text-destructive">{formErrors.nip}</p>
              )}
            </div>

            {/* Jabatan */}
            <div className="grid gap-2">
              <Label htmlFor="jabatan">
                Jabatan <span className="text-destructive">*</span>
              </Label>
              <Input
                id="jabatan"
                placeholder="Masukkan jabatan"
                value={formData.jabatan}
                onChange={(e) =>
                  setFormData({ ...formData, jabatan: e.target.value })
                }
                aria-invalid={!!formErrors.jabatan}
              />
              {formErrors.jabatan && (
                <p className="text-sm text-destructive">{formErrors.jabatan}</p>
              )}
            </div>

            {/* OPD */}
            <div className="grid gap-2">
              <Label htmlFor="opd">
                OPD <span className="text-destructive">*</span>
              </Label>
              <Input
                id="opd"
                placeholder="Masukkan OPD"
                value={formData.opd}
                onChange={(e) =>
                  setFormData({ ...formData, opd: e.target.value })
                }
                aria-invalid={!!formErrors.opd}
              />
              {formErrors.opd && (
                <p className="text-sm text-destructive">{formErrors.opd}</p>
              )}
            </div>

            {/* Status Aktif */}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="space-y-0.5">
                <Label htmlFor="statusAktif">Status Aktif</Label>
                <p className="text-sm text-muted-foreground">
                  Aktifkan jika pegawai masih bertugas
                </p>
              </div>
              <Switch
                id="statusAktif"
                checked={formData.statusAktif}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, statusAktif: checked })
                }
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              disabled={submitting}
            >
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting && <Loader2 className="size-4 animate-spin" />}
              {editingId ? 'Simpan Perubahan' : 'Tambah Pegawai'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Hapus Pegawai</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus pegawai{' '}
              <span className="font-semibold text-foreground">
                {deletingPegawai?.nama}
              </span>{' '}
              (NIP: {deletingPegawai?.nip})? Tindakan ini tidak dapat dibatalkan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={deleting}
              className="bg-destructive text-white hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="size-4 animate-spin" />}
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
