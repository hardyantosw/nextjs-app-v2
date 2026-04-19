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
  UserCog,
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
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAppStore } from '@/lib/store';

// Types
interface PegawaiOption {
  id: string;
  nama: string;
  nip: string;
}

interface UserWithPegawai {
  id: string;
  username: string;
  nama: string;
  role: 'admin' | 'pegawai';
  pegawaiId: string | null;
  pegawai: PegawaiOption | null;
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
  username: string;
  password: string;
  nama: string;
  role: 'admin' | 'pegawai';
  pegawaiId: string;
}

const initialFormData: FormData = {
  username: '',
  password: '',
  nama: '',
  role: 'pegawai',
  pegawaiId: '',
};

export default function UsersPage() {
  const user = useAppStore((s) => s.user);

  // State for data
  const [usersList, setUsersList] = useState<UserWithPegawai[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);

  // State for search
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);

  // State for pegawai dropdown options
  const [pegawaiOptions, setPegawaiOptions] = useState<PegawaiOption[]>([]);
  const [loadingPegawai, setLoadingPegawai] = useState(false);

  // State for dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // State for delete confirmation
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState<UserWithPegawai | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch users data
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      if (debouncedSearch) {
        params.set('search', debouncedSearch);
      }

      const res = await fetch(`/api/users?${params.toString()}`);
      const json = await res.json();

      if (json.success) {
        setUsersList(json.data);
        setPagination(json.pagination);
      } else {
        toast.error(json.message || 'Gagal memuat data user');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data');
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Fetch pegawai options for dropdown
  const fetchPegawaiOptions = useCallback(async () => {
    setLoadingPegawai(true);
    try {
      const res = await fetch('/api/pegawai?limit=100');
      const json = await res.json();

      if (json.success) {
        setPegawaiOptions(json.data);
      } else {
        toast.error(json.message || 'Gagal memuat data pegawai');
      }
    } catch {
      toast.error('Terjadi kesalahan saat memuat data pegawai');
    } finally {
      setLoadingPegawai(false);
    }
  }, []);

  // Validate form
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.username.trim()) {
      errors.username = 'Username wajib diisi';
    }
    if (!editingId && !formData.password.trim()) {
      errors.password = 'Password wajib diisi';
    }
    if (!formData.nama.trim()) {
      errors.nama = 'Nama lengkap wajib diisi';
    }
    if (formData.role === 'pegawai' && !formData.pegawaiId) {
      errors.pegawaiId = 'Pegawai wajib dipilih untuk role pegawai';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Open dialog for adding
  const handleAdd = () => {
    setEditingId(null);
    setFormData(initialFormData);
    setFormErrors({});
    fetchPegawaiOptions();
    setDialogOpen(true);
  };

  // Open dialog for editing
  const handleEdit = (userItem: UserWithPegawai) => {
    setEditingId(userItem.id);
    setFormData({
      username: userItem.username,
      password: '',
      nama: userItem.nama,
      role: userItem.role,
      pegawaiId: userItem.pegawaiId || '',
    });
    setFormErrors({});
    fetchPegawaiOptions();
    setDialogOpen(true);
  };

  // Handle role change
  const handleRoleChange = (newRole: string) => {
    const role = newRole as 'admin' | 'pegawai';
    setFormData({
      ...formData,
      role,
      pegawaiId: role === 'admin' ? '' : formData.pegawaiId,
    });
    // Clear pegawaiId error when switching to admin
    if (role === 'admin') {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next.pegawaiId;
        return next;
      });
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      const url = editingId
        ? `/api/users/${editingId}`
        : '/api/users';
      const method = editingId ? 'PUT' : 'POST';

      const body: Record<string, unknown> = {
        username: formData.username,
        nama: formData.nama,
        role: formData.role,
        pegawaiId: formData.role === 'pegawai' ? formData.pegawaiId : null,
      };

      // Only include password if provided
      if (formData.password) {
        body.password = formData.password;
      }

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const json = await res.json();

      if (json.success) {
        toast.success(
          editingId
            ? 'User berhasil diperbarui'
            : 'User berhasil ditambahkan'
        );
        setDialogOpen(false);
        fetchUsers();
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
  const handleDeleteClick = (userItem: UserWithPegawai) => {
    if (userItem.id === user?.id) {
      toast.error('Tidak dapat menghapus akun sendiri');
      return;
    }
    setDeletingUser(userItem);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const handleDeleteConfirm = async () => {
    if (!deletingUser) return;

    setDeleting(true);
    try {
      const res = await fetch(`/api/users/${deletingUser.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();

      if (json.success) {
        toast.success('User berhasil dihapus');
        setDeleteDialogOpen(false);
        setDeletingUser(null);
        fetchUsers();
      } else {
        toast.error(json.message || 'Gagal menghapus user');
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
        <h1 className="text-2xl font-bold tracking-tight">Pengaturan User</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Kelola akun pengguna sistem Tanda Tangan Elektronik
        </p>
      </div>

      <Separator />

      {/* Main Card */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Daftar User</CardTitle>
            <Button onClick={handleAdd} size="sm">
              <Plus className="size-4" />
              Tambah User
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan username atau nama..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Data Table */}
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : usersList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-muted p-4 mb-4">
                <UserCog className="size-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground font-medium">
                Tidak ada data user
              </p>
              <p className="text-muted-foreground text-sm mt-1">
                {debouncedSearch
                  ? 'Coba ubah pencarian Anda'
                  : 'Klik "Tambah User" untuk menambahkan user baru'}
              </p>
            </div>
          ) : (
            <>
              <div className="rounded-md border overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[50px] text-center">No</TableHead>
                      <TableHead>Username</TableHead>
                      <TableHead>Nama</TableHead>
                      <TableHead className="text-center">Role</TableHead>
                      <TableHead>Pegawai Terkait</TableHead>
                      <TableHead className="text-center">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {usersList.map((userItem, index) => (
                      <TableRow key={userItem.id}>
                        <TableCell className="text-center font-medium">
                          {getRowNumber(index)}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {userItem.username}
                        </TableCell>
                        <TableCell className="font-medium">
                          {userItem.nama}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            className={
                              userItem.role === 'admin'
                                ? 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800'
                                : 'bg-emerald-100 text-emerald-800 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800'
                            }
                          >
                            {userItem.role === 'admin' ? 'Admin' : 'Pegawai'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {userItem.pegawai ? (
                            <div>
                              <p className="font-medium text-sm">
                                {userItem.pegawai.nama}
                              </p>
                              <p className="text-xs text-muted-foreground font-mono">
                                {userItem.pegawai.nip}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8"
                              onClick={() => handleEdit(userItem)}
                              title="Edit user"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(userItem)}
                              title="Hapus user"
                              disabled={userItem.id === user?.id}
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
              <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-3">
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
                  user
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
                        return (
                          p === 1 ||
                          p === pagination.totalPages ||
                          Math.abs(p - page) <= 1
                        );
                      })
                      .map((p, i, arr) => {
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
              {editingId ? 'Edit User' : 'Tambah User Baru'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Perbarui informasi user di bawah ini.'
                : 'Isi data user baru yang akan ditambahkan.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            {/* Username */}
            <div className="grid gap-2">
              <Label htmlFor="username">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                placeholder="Masukkan username"
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                aria-invalid={!!formErrors.username}
              />
              {formErrors.username && (
                <p className="text-sm text-destructive">{formErrors.username}</p>
              )}
            </div>

            {/* Password */}
            <div className="grid gap-2">
              <Label htmlFor="password">
                Password{' '}
                {!editingId && <span className="text-destructive">*</span>}
                {editingId && (
                  <span className="text-muted-foreground text-xs font-normal">
                    (kosongkan jika tidak ingin mengubah)
                  </span>
                )}
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={editingId ? 'Kosongkan jika tidak diubah' : 'Masukkan password'}
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                aria-invalid={!!formErrors.password}
              />
              {formErrors.password && (
                <p className="text-sm text-destructive">{formErrors.password}</p>
              )}
            </div>

            {/* Nama Lengkap */}
            <div className="grid gap-2">
              <Label htmlFor="nama-user">
                Nama Lengkap <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama-user"
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

            {/* Role */}
            <div className="grid gap-2">
              <Label htmlFor="role">
                Role <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.role}
                onValueChange={handleRoleChange}
              >
                <SelectTrigger id="role">
                  <SelectValue placeholder="Pilih role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="pegawai">Pegawai</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Pegawai (only shown when role is pegawai) */}
            {formData.role === 'pegawai' && (
              <div className="grid gap-2">
                <Label htmlFor="pegawai-select">
                  Pegawai <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={formData.pegawaiId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pegawaiId: value })
                  }
                >
                  <SelectTrigger id="pegawai-select">
                    <SelectValue placeholder="Pilih pegawai" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingPegawai ? (
                      <SelectItem value="_loading" disabled>
                        Memuat data pegawai...
                      </SelectItem>
                    ) : pegawaiOptions.length === 0 ? (
                      <SelectItem value="_empty" disabled>
                        Tidak ada data pegawai
                      </SelectItem>
                    ) : (
                      pegawaiOptions.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.nama} - {p.nip}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {formErrors.pegawaiId && (
                  <p className="text-sm text-destructive">{formErrors.pegawaiId}</p>
                )}
              </div>
            )}
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
              {editingId ? 'Simpan Perubahan' : 'Tambah User'}
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
            <AlertDialogTitle>Konfirmasi Hapus User</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin menghapus user{' '}
              <span className="font-semibold text-foreground">
                {deletingUser?.nama}
              </span>{' '}
              (Username: {deletingUser?.username})? Tindakan ini tidak dapat dibatalkan.
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
