'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  Upload,
  X,
  Newspaper,
  Calendar,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

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

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function BeritaPage() {
  const [beritaList, setBeritaList] = useState<BeritaData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formJudul, setFormJudul] = useState('');
  const [formIsi, setFormIsi] = useState('');
  const [formRingkas, setFormRingkas] = useState('');
  const [formPenulis, setFormPenulis] = useState('');
  const [formKategori, setFormKategori] = useState('');
  const [formPublished, setFormPublished] = useState(false);
  const [formImagePath, setFormImagePath] = useState<string | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBerita = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/berita?admin=true&page=${pagination.page}&limit=${pagination.limit}`);
      if (res.ok) {
        const json = await res.json();
        setBeritaList(json.data || []);
        if (json.pagination) {
          setPagination((prev) => ({ ...prev, ...json.pagination }));
        }
      }
    } catch {
      toast.error('Gagal memuat data berita');
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit]);

  useEffect(() => {
    fetchBerita();
  }, [fetchBerita]);

  function openAddDialog() {
    setSelectedId(null);
    setFormJudul('');
    setFormIsi('');
    setFormRingkas('');
    setFormPenulis('');
    setFormKategori('');
    setFormPublished(false);
    setFormImagePath(null);
    setFormImagePreview(null);
    setDialogOpen(true);
  }

  function openEditDialog(berita: BeritaData) {
    setSelectedId(berita.id);
    setFormJudul(berita.judul);
    setFormIsi(berita.isi);
    setFormRingkas(berita.ringkas || '');
    setFormPenulis(berita.penulis || '');
    setFormKategori(berita.kategori || '');
    setFormPublished(berita.published);
    setFormImagePath(berita.imagePath);
    setFormImagePreview(berita.imagePath ? (berita.imagePath.startsWith('http') ? berita.imagePath : `/api/berita/image/${berita.imagePath}`) : null);
    setDialogOpen(true);
  }

  function openDeleteDialog(id: string) {
    setSelectedId(id);
    setDeleteOpen(true);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/png', 'image/jpeg', 'image/jpg', 'image/webp'].includes(file.type)) {
      toast.error('Format file tidak didukung. Gunakan PNG, JPG, atau WebP');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/berita/upload', { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Upload gagal');
      const data = await res.json();
      setFormImagePath(data.imagePath);
      setFormImagePreview(URL.createObjectURL(file));
      toast.success('Gambar berhasil diunggah');
    } catch {
      toast.error('Gagal mengunggah gambar');
    } finally {
      setUploading(false);
    }
  }

  async function handleSave() {
    if (!formJudul.trim()) {
      toast.error('Judul wajib diisi');
      return;
    }
    if (!formIsi.trim()) {
      toast.error('Isi berita wajib diisi');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        judul: formJudul.trim(),
        isi: formIsi.trim(),
        ringkas: formRingkas.trim() || null,
        penulis: formPenulis.trim() || null,
        kategori: formKategori || null,
        published: formPublished,
        imagePath: formImagePath,
      };

      const res = selectedId
        ? await fetch(`/api/berita/${selectedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/berita', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Gagal menyimpan berita');
      }

      toast.success(selectedId ? 'Berita berhasil diperbarui' : 'Berita berhasil dibuat');
      setDialogOpen(false);
      fetchBerita();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan berita');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/berita/${selectedId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus berita');
      toast.success('Berita berhasil dihapus');
      setDeleteOpen(false);
      fetchBerita();
    } catch {
      toast.error('Gagal menghapus berita');
    }
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }

  const kategoriColor: Record<string, string> = {
    Pengumuman: 'bg-amber-100 text-amber-800 border-amber-200',
    Berita: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    Informasi: 'bg-sky-100 text-sky-800 border-sky-200',
  };

  const startIndex = (pagination.page - 1) * pagination.limit;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Berita</h2>
          <p className="text-muted-foreground">Kelola berita dan informasi di halaman publik</p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
          <Plus className="w-4 h-4" />
          Tambah Berita
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Newspaper className="w-5 h-5 text-emerald-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination.total}</p>
              <p className="text-xs text-muted-foreground">Total Berita</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
              <Eye className="w-5 h-5 text-green-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{beritaList.filter((b) => b.published).length}</p>
              <p className="text-xs text-muted-foreground">Dipublikasi</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
              <EyeOff className="w-5 h-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold">{beritaList.filter((b) => !b.published).length}</p>
              <p className="text-xs text-muted-foreground">Draft</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-sky-700" />
            </div>
            <div>
              <p className="text-2xl font-bold">{pagination.page}</p>
              <p className="text-xs text-muted-foreground">Halaman</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4 flex gap-4">
                <Skeleton className="w-24 h-24 rounded-lg shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : beritaList.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Newspaper className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-2">Belum ada berita</p>
            <Button onClick={openAddDialog} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Berita Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {beritaList.map((berita, index) => (
            <Card key={berita.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    {berita.imagePath ? (
                      <img
                        src={berita.imagePath.startsWith('http') ? berita.imagePath : `/api/berita/image/${berita.imagePath}`}
                        alt={berita.judul}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                        <Newspaper className="w-8 h-8 text-emerald-300" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm line-clamp-2">{berita.judul}</h3>
                      <div className="flex items-center gap-1 shrink-0">
                        <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditDialog(berita)}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(berita.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {berita.ringkas && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1">{berita.ringkas}</p>
                    )}

                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      {berita.kategori && (
                        <Badge className={`text-[10px] ${kategoriColor[berita.kategori] || 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                          {berita.kategori}
                        </Badge>
                      )}
                      <Badge variant={berita.published ? 'default' : 'secondary'} className={`text-[10px] ${berita.published ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                        {berita.published ? <><Eye className="w-3 h-3" /> Published</> : <><EyeOff className="w-3 h-3" /> Draft</>}
                      </Badge>
                      {berita.penulis && (
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <User className="w-3 h-3" /> {berita.penulis}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Calendar className="w-3 h-3" /> {formatDate(berita.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Menampilkan {startIndex + 1}-{Math.min(startIndex + pagination.limit, pagination.total)} dari {pagination.total} berita
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))} disabled={pagination.page <= 1}>
                  Sebelumnya
                </Button>
                <span className="text-sm text-muted-foreground">
                  Hal {pagination.page} / {pagination.totalPages}
                </span>
                <Button variant="outline" size="sm" onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))} disabled={pagination.page >= pagination.totalPages}>
                  Selanjutnya
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Edit Berita' : 'Tambah Berita'}</DialogTitle>
            <DialogDescription>
              {selectedId ? 'Perbarui informasi berita' : 'Buat berita baru untuk halaman publik'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="berita-judul">Judul *</Label>
              <Input id="berita-judul" value={formJudul} onChange={(e) => setFormJudul(e.target.value)} placeholder="Judul berita" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="berita-ringkas">Ringkasan</Label>
              <Textarea id="berita-ringkas" value={formRingkas} onChange={(e) => setFormRingkas(e.target.value)} placeholder="Ringkasan singkat berita" rows={2} />
              <p className="text-[11px] text-muted-foreground">Akan ditampilkan di daftar berita</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="berita-isi">Isi Berita *</Label>
              <Textarea id="berita-isi" value={formIsi} onChange={(e) => setFormIsi(e.target.value)} placeholder="Isi berita lengkap" rows={8} className="min-h-[160px]" />
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar</Label>
              {formImagePreview ? (
                <div className="relative rounded-lg overflow-hidden border">
                  <img src={formImagePreview} alt="Preview" className="w-full h-48 object-cover" />
                  <Button
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 w-7 h-7"
                    onClick={() => {
                      setFormImagePath(null);
                      setFormImagePreview(null);
                    }}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center h-28 border-2 border-dashed rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-5 h-5 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Klik untuk unggah gambar</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP • Maks 5MB</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="berita-penulis">Penulis</Label>
                <Input id="berita-penulis" value={formPenulis} onChange={(e) => setFormPenulis(e.target.value)} placeholder="Nama penulis" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="berita-kategori">Kategori</Label>
                <Select value={formKategori} onValueChange={setFormKategori}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pengumuman">Pengumuman</SelectItem>
                    <SelectItem value="Berita">Berita</SelectItem>
                    <SelectItem value="Informasi">Informasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Publikasikan</Label>
                <p className="text-[11px] text-muted-foreground">
                  {formPublished ? 'Berita akan tampil di halaman publik' : 'Berita masih berupa draft'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={formPublished ? 'default' : 'secondary'} className={`text-[10px] ${formPublished ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-600'}`}>
                  {formPublished ? 'Published' : 'Draft'}
                </Badge>
                <Switch checked={formPublished} onCheckedChange={setFormPublished} />
              </div>
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {selectedId ? 'Simpan Perubahan' : 'Buat Berita'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Berita?</AlertDialogTitle>
            <AlertDialogDescription>
              Berita yang dihapus tidak dapat dikembalikan.
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
