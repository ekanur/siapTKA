const MONTH_NAMES_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * Format a Date to Indonesian date string, e.g. "10 September 2026"
 */
export function formatDateIndo(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "-";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "-";
  return `${d.getDate()} ${MONTH_NAMES_ID[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Format date range into Indonesian format, e.g.
 * - "21 – 27 September 2026" (same month & year)
 * - "27 Juli – 27 September 2026" (different month, same year)
 * - "26 Oktober 2026 – 2 Januari 2027" (different year)
 */
export function formatDateRangeIndo(
  startInput: Date | string | null | undefined,
  endInput: Date | string | null | undefined,
  suffix = ""
): string {
  if (!startInput && !endInput) return "-";
  if (!endInput) return formatDateIndo(startInput) + (suffix ? ` (${suffix})` : "");
  if (!startInput) return `s.d. ${formatDateIndo(endInput)}` + (suffix ? ` (${suffix})` : "");

  const start = new Date(startInput);
  const end = new Date(endInput);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) return "-";

  const sDay = start.getDate();
  const sMonth = start.getMonth();
  const sYear = start.getFullYear();

  const eDay = end.getDate();
  const eMonth = end.getMonth();
  const eYear = end.getFullYear();

  let formatted = "";
  if (sYear === eYear && sMonth === eMonth) {
    if (sDay === eDay) {
      formatted = `${sDay} ${MONTH_NAMES_ID[sMonth]} ${sYear}`;
    } else {
      formatted = `${sDay} – ${eDay} ${MONTH_NAMES_ID[sMonth]} ${sYear}`;
    }
  } else if (sYear === eYear) {
    formatted = `${sDay} ${MONTH_NAMES_ID[sMonth]} – ${eDay} ${MONTH_NAMES_ID[eMonth]} ${sYear}`;
  } else {
    formatted = `${sDay} ${MONTH_NAMES_ID[sMonth]} ${sYear} – ${eDay} ${MONTH_NAMES_ID[eMonth]} ${eYear}`;
  }

  return suffix ? `${formatted} (${suffix})` : formatted;
}

/**
 * Returns timeline status based on current date
 * "BERLANGSUNG" (Active/Ongoing) | "SELESAI" (Passed/Ended) | "MENDATANG" (Upcoming)
 */
export function getMilestoneStatus(
  startDateInput: Date | string | null | undefined,
  endDateInput: Date | string | null | undefined,
  nowInput: Date | string = new Date()
): "BERLANGSUNG" | "SELESAI" | "MENDATANG" {
  const now = new Date(nowInput);

  const start = startDateInput ? new Date(startDateInput) : null;
  const end = endDateInput ? new Date(endDateInput) : null;

  if (end) {
    end.setHours(23, 59, 59, 999);
  }
  if (start) {
    start.setHours(0, 0, 0, 0);
  }

  if (end && now > end) {
    return "SELESAI";
  }

  if (start && now < start) {
    return "MENDATANG";
  }

  return "BERLANGSUNG";
}

/**
 * Converts a Date object or ISO string to YYYY-MM-DD for <input type="date" />
 */
export function toInputDateString(dateInput: Date | string | null | undefined): string {
  if (!dateInput) return "";
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}
