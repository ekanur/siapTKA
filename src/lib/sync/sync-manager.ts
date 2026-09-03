import { clientDb, CachedSoal, OfflineSubmission } from "@/lib/db/client-db";
import { encryptAnswerKey, encryptExplanation, isEncrypted } from "@/lib/security/crypto";

export interface SyncStatusResult {
  cachedQuestionsCount: number;
  pendingSubmissionsCount: number;
  lastBankSoalSync: string | null;
  isOnline: boolean;
}

/**
 * Downloads active questions from server to local IndexedDB, ensuring kunciJawaban is always encrypted
 */
export async function downloadActiveBankSoal(mapel?: string): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    const url = mapel ? `/api/sync/bank-soal?mapel=${encodeURIComponent(mapel)}` : `/api/sync/bank-soal`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Gagal mengunduh bank soal dari server");

    const data = await res.json();
    const rawQuestions: CachedSoal[] = data.soal || [];

    // Ensure all stored questions have encrypted kunciJawaban & pembahasan
    const questions: CachedSoal[] = rawQuestions.map((q) => ({
      ...q,
      kunciJawaban: isEncrypted(q.kunciJawaban) ? q.kunciJawaban : encryptAnswerKey(q.kunciJawaban, q.id),
      pembahasan: isEncrypted(q.pembahasan) ? q.pembahasan : encryptExplanation(q.pembahasan || "", q.id),
    }));

    // Save to Dexie IndexedDB
    await clientDb.transaction("rw", clientDb.soal, clientDb.syncMeta, async () => {
      if (questions.length > 0) {
        await clientDb.soal.bulkPut(questions);
      }
      await clientDb.syncMeta.put({
        key: "lastBankSoalSync",
        value: new Date().toISOString(),
      });
    });

    return { success: true, count: questions.length };
  } catch (error: any) {
    console.error("Sync bank soal error:", error);
    return { success: false, count: 0, error: error.message || "Gagal sinkronisasi bank soal" };
  }
}

/**
 * Uploads pending offline submissions from IndexedDB to server
 */
export async function syncPendingSubmissions(): Promise<{ success: boolean; syncedCount: number; error?: string }> {
  try {
    if (typeof window === "undefined" || !navigator.onLine) {
      return { success: false, syncedCount: 0, error: "Perangkat sedang offline" };
    }

    const pendingList = await clientDb.offlineSubmissions
      .where("syncStatus")
      .equals("PENDING")
      .toArray();

    if (pendingList.length === 0) {
      return { success: true, syncedCount: 0 };
    }

    // Send batch sync request to server
    const res = await fetch("/api/sync/progres", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ submissions: pendingList }),
    });

    if (!res.ok) {
      throw new Error("Server gagal memproses sinkronisasi");
    }

    const result = await res.json();

    // Mark as SYNCED in Dexie
    const syncedIds: string[] = result.syncedIds || pendingList.map((s) => s.id);
    await clientDb.transaction("rw", clientDb.offlineSubmissions, clientDb.syncMeta, async () => {
      for (const id of syncedIds) {
        await clientDb.offlineSubmissions.update(id, {
          syncStatus: "SYNCED",
          syncedAt: Date.now(),
        });
      }
      await clientDb.syncMeta.put({
        key: "lastSubmissionSync",
        value: new Date().toISOString(),
      });
    });

    return { success: true, syncedCount: syncedIds.length };
  } catch (error: any) {
    console.error("Auto sync submission error:", error);
    return { success: false, syncedCount: 0, error: error.message || "Gagal sinkronisasi jawaban" };
  }
}

/**
 * Ensures all questions currently stored in client IndexedDB have encrypted kunciJawaban & pembahasan
 */
export async function secureOfflineDatabase(): Promise<number> {
  try {
    if (typeof window === "undefined") return 0;
    const allQuestions = await clientDb.soal.toArray();
    const unencrypted = allQuestions.filter(
      (s) => !isEncrypted(s.kunciJawaban) || (!!s.pembahasan && !isEncrypted(s.pembahasan))
    );

    if (unencrypted.length === 0) return 0;

    const updated = unencrypted.map((q) => ({
      ...q,
      kunciJawaban: isEncrypted(q.kunciJawaban) ? q.kunciJawaban : encryptAnswerKey(q.kunciJawaban, q.id),
      pembahasan: isEncrypted(q.pembahasan) ? q.pembahasan : encryptExplanation(q.pembahasan || "", q.id),
    }));

    await clientDb.soal.bulkPut(updated);
    return updated.length;
  } catch (e) {
    console.error("Error securing offline database:", e);
    return 0;
  }
}

/**
 * Gets overview stats of offline storage
 */
export async function getOfflineSyncStatus(): Promise<SyncStatusResult> {
  // Auto-migrate any unencrypted legacy records in IndexedDB
  await secureOfflineDatabase();

  const cachedQuestionsCount = await clientDb.soal.count();
  const pendingSubmissionsCount = await clientDb.offlineSubmissions
    .where("syncStatus")
    .equals("PENDING")
    .count();

  const meta = await clientDb.syncMeta.get("lastBankSoalSync");
  const isOnline = typeof window !== "undefined" ? navigator.onLine : true;

  return {
    cachedQuestionsCount,
    pendingSubmissionsCount,
    lastBankSoalSync: meta ? String(meta.value) : null,
    isOnline,
  };
}