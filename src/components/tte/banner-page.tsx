'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Eye,
  EyeOff,
  GripVertical,
  Upload,
  X,
  Image as ImageIcon,
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

interface BannerData {
  id: string;
  judul: string;
  deskripsi: string | null;
  imagePath: string | null;
  urutan: number;
  aktif: boolean;
}

export default function BannerPage() {
  const [banners, setBanners] = useState<BannerData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formJudul, setFormJudul] = useState('');
  const [formDeskripsi, setFormDeskripsi] = useState('');
  const [formUrutan, setFormUrutan] = useState(0);
  const [formAktif, setFormAktif] = useState(true);
  const [formImagePath, setFormImagePath] = useState<string | null>(null);
  const [formImagePreview, setFormImagePreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fetchBanners = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/banner?admin=true');
      if (res.ok) {
        const json = await res.json();
        setBanners(json.data || []);
      }
    } catch {
      toast.error('Gagal memuat data banner');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  function openAddDialog() {
    setSelectedId(null);
    setFormJudul('');
    setFormDeskripsi('');
    setFormUrutan(0);
    setFormAktif(true);
    setFormImagePath(null);
    setFormImagePreview(null);
    setDialogOpen(true);
  }

  function openEditDialog(banner: BannerData) {
    setSelectedId(banner.id);
    setFormJudul(banner.judul);
    setFormDeskripsi(banner.deskripsi || '');
    setFormUrutan(banner.urutan);
    setFormAktif(banner.aktif);
    setFormImagePath(banner.imagePath);
    setFormImagePreview(banner.imagePath ? (banner.imagePath.startsWith('http') ? banner.imagePath : `/api/banner/image/${banner.imagePath}`) : null);
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
      const res = await fetch('/api/banner/upload', { method: 'POST', body: formData });
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

    setSaving(true);
    try {
      const payload = {
        judul: formJudul.trim(),
        deskripsi: formDeskripsi.trim() || null,
        imagePath: formImagePath,
        urutan: formUrutan,
        aktif: formAktif,
      };

      const res = selectedId
        ? await fetch(`/api/banner/${selectedId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        : await fetch('/api/banner', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });

      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || 'Gagal menyimpan banner');
      }

      toast.success(selectedId ? 'Banner berhasil diperbarui' : 'Banner berhasil dibuat');
      setDialogOpen(false);
      fetchBanners();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Gagal menyimpan banner');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId) return;
    try {
      const res = await fetch(`/api/banner/${selectedId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus banner');
      toast.success('Banner berhasil dihapus');
      setDeleteOpen(false);
      fetchBanners();
    } catch {
      toast.error('Gagal menghapus banner');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Kelola Banner</h2>
          <p className="text-muted-foreground">Kelola banner yang tampil di halaman publik</p>
        </div>
        <Button onClick={openAddDialog} className="bg-emerald-700 hover:bg-emerald-800 text-white gap-2">
          <Plus className="w-4 h-4" />
          Tambah Banner
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground/30 mb-3" />
            <p className="text-muted-foreground mb-2">Belum ada banner</p>
            <Button onClick={openAddDialog} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Tambah Banner Pertama
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {banners.map((banner) => (
            <Card key={banner.id} className="overflow-hidden">
              <div className="h-40 bg-muted overflow-hidden">
                {banner.imagePath ? (
                  <img
                    src={banner.imagePath.startsWith('http') ? banner.imagePath : `/api/banner/image/${banner.imagePath}`}
                    alt={banner.judul}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-emerald-50 to-emerald-100">
                    <ImageIcon className="w-10 h-10 text-emerald-300" />
                  </div>
                )}
              </div>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-sm line-clamp-1">{banner.judul}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant={banner.aktif ? 'default' : 'secondary'} className={`text-[10px] ${banner.aktif ? 'bg-emerald-100 text-emerald-800 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {banner.aktif ? <><Eye className="w-3 h-3" /> Aktif</> : <><EyeOff className="w-3 h-3" /> Nonaktif</>}
                    </Badge>
                  </div>
                </div>
                {banner.deskripsi && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{banner.deskripsi}</p>
                )}
                <div className="flex items-center justify-between">
                  <Badge variant="outline" className="text-[10px] gap-1">
                    <GripVertical className="w-3 h-3" /> Urutan: {banner.urutan}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditDialog(banner)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive hover:text-destructive" onClick={() => openDeleteDialog(banner.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedId ? 'Edit Banner' : 'Tambah Banner'}</DialogTitle>
            <DialogDescription>
              {selectedId ? 'Perbarui informasi banner' : 'Buat banner baru untuk halaman publik'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Image Upload */}
            <div className="space-y-2">
              <Label>Gambar Banner</Label>
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
                <label className="flex flex-col items-center justify-center h-32 border-2 border-dashed rounded-lg cursor-pointer hover:border-emerald-400 hover:bg-emerald-50/50 transition-colors">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 text-muted-foreground mb-1" />
                      <span className="text-xs text-muted-foreground">Klik untuk unggah gambar</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploading} />
                </label>
              )}
              <p className="text-[11px] text-muted-foreground">PNG, JPG, WebP • Maks 5MB</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-judul">Judul *</Label>
              <Input id="banner-judul" value={formJudul} onChange={(e) => setFormJudul(e.target.value)} placeholder="Judul banner" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-deskripsi">Deskripsi</Label>
              <Textarea id="banner-deskripsi" value={formDeskripsi} onChange={(e) => setFormDeskripsi(e.target.value)} placeholder="Deskripsi singkat" rows={2} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="banner-urutan">Urutan</Label>
              <Input id="banner-urutan" type="number" value={formUrutan} onChange={(e) => setFormUrutan(parseInt(e.target.value) || 0)} />
              <p className="text-[11px] text-muted-foreground">Angka lebih kecil tampil lebih dulu</p>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label>Aktif</Label>
                <p className="text-[11px] text-muted-foreground">Banner aktif tampil di halaman publik</p>
              </div>
              <Switch checked={formAktif} onCheckedChange={setFormAktif} />
            </div>
          </div>
          <Separator />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-emerald-700 hover:bg-emerald-800 text-white">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {selectedId ? 'Simpan Perubahan' : 'Buat Banner'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Banner?</AlertDialogTitle>
            <AlertDialogDescription>
              Banner yang dihapus tidak dapat dikembalikan. Gambar yang terkait juga akan dihapus.
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
