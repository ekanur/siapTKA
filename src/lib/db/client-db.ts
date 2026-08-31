import Dexie, { Table } from "dexie";

export interface CachedSoal {
  id: string;
  mapel: string;
  kisiKisiId?: string | null;
  topik?: string;
  tipeSoal: "PILIHAN_GANDA" | "MCMA" | "PGK_KATEGORI" | string;
  pertanyaan: string;
  opsiJawaban: string; // JSON string
  kunciJawaban: string; // Salted hash or master key
  pembahasan: string;
  status: string;
  updatedAt?: string;
}

export interface OfflineSubmission {
  id: string; // UUID
  siswaId: string;
  soalId: string;
  mapel: string;
  tipeSoal: string;
  jawabanSiswa: string; // JSON string
  isBenar: boolean;
  skor: number;
  waktuPengerjaan: number; // in seconds
  submittedAt: number; // timestamp
  syncStatus: "PENDING" | "SYNCED" | "FAILED";
  syncedAt?: number;
}

export interface SyncMeta {
  key: string;
  value: string | number;
}

export class SiapTkaDexieDB extends Dexie {
  soal!: Table<CachedSoal, string>;
  offlineSubmissions!: Table<OfflineSubmission, string>;
  syncMeta!: Table<SyncMeta, string>;

  constructor() {
    super("SiapTkaOfflineDB");
    this.version(1).stores({
      soal: "id, mapel, tipeSoal, status",
      offlineSubmissions: "id, siswaId, soalId, mapel, syncStatus, submittedAt",
      syncMeta: "key",
    });
  }
}

export const clientDb = new SiapTkaDexieDB();