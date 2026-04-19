'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  UserCheck,
  FileCheck,
  Calendar,
  Plus,
  Settings,
  Eye,
  Loader2,
} from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { toast } from 'sonner';

interface DashboardStats {
  totalPegawai: number;
  pegawaiAktif: number;
  totalDokumen: number;
  dokumenBulanIni: number;
}

interface RecentDocument {
  id: string;
  namaFile: string;
  pegawai: {
    nama: string;
    nip: string;
  };
  tglTtd: string | null;
  status: string;
  createdAt: string;
}

export default function DashboardPage() {
  const { setCurrentPage } = useAppStore();

  const [stats, setStats] = useState<DashboardStats>({
    totalPegawai: 0,
    pegawaiAktif: 0,
    totalDokumen: 0,
    dokumenBulanIni: 0,
  });
  const [recentDocs, setRecentDocs] = useState<RecentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [docLoading, setDocLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const [pegawaiRes, aktifRes] = await Promise.all([
        fetch('/api/pegawai?limit=1'),
        fetch('/api/pegawai?limit=1&statusAktif=true'),
      ]);

      if (pegawaiRes.ok) {
        const pegawaiData = await pegawaiRes.json();
        setStats((prev) => ({
          ...prev,
          totalPegawai: pegawaiData.pagination?.total || 0,
        }));
      }

      if (aktifRes.ok) {
        const aktifData = await aktifRes.json();
        setStats((prev) => ({
          ...prev,
          pegawaiAktif: aktifData.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching pegawai stats:', error);
      toast.error('Gagal memuat statistik pegawai');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchDocumentData = useCallback(async () => {
    setDocLoading(true);
    try {
      // Fetch recent documents
      const dokRes = await fetch('/api/dokumen?limit=5');
      if (dokRes.ok) {
        const dokData = await dokRes.json();
        setRecentDocs(dokData.data || []);
        setStats((prev) => ({
          ...prev,
          totalDokumen: dokData.pagination?.total || 0,
        }));
      }

      // Fetch documents this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
        23,
        59,
        59
      );
      const monthRes = await fetch(
        `/api/dokumen?limit=1&startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`
      );
      if (monthRes.ok) {
        const monthData = await monthRes.json();
        setStats((prev) => ({
          ...prev,
          dokumenBulanIni: monthData.pagination?.total || 0,
        }));
      }
    } catch (error) {
      console.error('Error fetching document data:', error);
      toast.error('Gagal memuat data dokumen');
    } finally {
      setDocLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchDocumentData();
  }, [fetchDashboardData, fetchDocumentData]);

  const statCards = [
    {
      title: 'Total Pegawai',
      value: stats.totalPegawai,
      icon: Users,
      color: 'emerald',
      bgColor: 'bg-emerald-50 dark:bg-emerald-950/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      borderColor: 'border-emerald-200 dark:border-emerald-800',
      valueColor: 'text-emerald-700 dark:text-emerald-300',
    },
    {
      title: 'Pegawai Aktif',
      value: stats.pegawaiAktif,
      icon: UserCheck,
      color: 'sky',
      bgColor: 'bg-sky-50 dark:bg-sky-950/30',
      iconColor: 'text-sky-600 dark:text-sky-400',
      borderColor: 'border-sky-200 dark:border-sky-800',
      valueColor: 'text-sky-700 dark:text-sky-300',
    },
    {
      title: 'Dokumen Ditandatangani',
      value: stats.totalDokumen,
      icon: FileCheck,
      color: 'amber',
      bgColor: 'bg-amber-50 dark:bg-amber-950/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      borderColor: 'border-amber-200 dark:border-amber-800',
      valueColor: 'text-amber-700 dark:text-amber-300',
    },
    {
      title: 'Dokumen Bulan Ini',
      value: stats.dokumenBulanIni,
      icon: Calendar,
      color: 'purple',
      bgColor: 'bg-purple-50 dark:bg-purple-950/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      borderColor: 'border-purple-200 dark:border-purple-800',
      valueColor: 'text-purple-700 dark:text-purple-300',
    },
  ];

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    if (status === 'signed') {
      return (
        <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800">
          Ditandatangani
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
        Pending
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Ringkasan sistem Tanda Tangan Elektronik
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card
              key={card.title}
              className={`${card.borderColor} relative overflow-hidden`}
            >
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${card.bgColor}`}
                  >
                    <Icon className={`h-6 w-6 ${card.iconColor}`} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-muted-foreground truncate">
                      {card.title}
                    </p>
                    {loading || docLoading ? (
                      <Loader2 className="mt-1 h-6 w-6 animate-spin text-muted-foreground" />
                    ) : (
                      <p className={`text-2xl font-bold ${card.valueColor}`}>
                        {card.value.toLocaleString('id-ID')}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Aksi Cepat</CardTitle>
          <CardDescription>
            Akses fitur utama dengan cepat
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button
            onClick={() => setCurrentPage('upload-tandatangani')}
            className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Upload & Tanda Tangani
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentPage('pegawai')}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Kelola Pegawai
          </Button>
        </CardContent>
      </Card>

      <Separator />

      {/* Recent Documents */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Dokumen Terbaru</CardTitle>
              <CardDescription>
                5 dokumen terakhir yang ditandatangani
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setCurrentPage('tte-dokumen')}
              className="text-muted-foreground"
            >
              Lihat Semua
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {docLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-sm text-muted-foreground">
                Memuat data dokumen...
              </span>
            </div>
          ) : recentDocs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <FileCheck className="h-10 w-10 text-muted-foreground/50 mb-2" />
              <p className="text-sm text-muted-foreground">
                Belum ada dokumen yang ditandatangani
              </p>
              <Button
                variant="link"
                onClick={() => setCurrentPage('upload-tandatangani')}
                className="mt-2 text-emerald-600"
              >
                Upload dokumen pertama
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Dokumen</TableHead>
                    <TableHead>Penandatangan</TableHead>
                    <TableHead>Tanggal</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentDocs.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">
                        {doc.namaFile}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-sm">
                            {doc.pegawai?.nama || '-'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {doc.pegawai?.nip || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDate(doc.tglTtd || doc.createdAt)}
                      </TableCell>
                      <TableCell>{getStatusBadge(doc.status)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCurrentPage('tte-dokumen')}
                          className="gap-1 h-8"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          <span className="text-xs">Detail</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
