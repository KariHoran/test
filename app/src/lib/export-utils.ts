import type { ExportContactRow } from "./contacts";
import { titleMatchesOption } from "./icp-types";

export type ExportSegment = "none" | "title" | "city";

export interface ExportPreset {
  id: string;
  name: string;
  validOnly: boolean;
  validPhoneOnly: boolean;
  lprOnly: boolean;
  outreachReady: boolean;
  dedupe: boolean;
}

export const EXPORT_PRESETS: ExportPreset[] = [
  {
    id: "all-valid-lpr",
    name: "Только valid + ЛПР + без generic",
    validOnly: true,
    validPhoneOnly: false,
    lprOnly: true,
    outreachReady: false,
    dedupe: true,
  },
  {
    id: "outreach-ready",
    name: "Готов к аутричу",
    validOnly: true,
    validPhoneOnly: true,
    lprOnly: true,
    outreachReady: true,
    dedupe: true,
  },
  {
    id: "max-reach",
    name: "Максимальный охват",
    validOnly: false,
    validPhoneOnly: false,
    lprOnly: true,
    outreachReady: false,
    dedupe: false,
  },
];

export function dedupeContactsByEmail(contacts: ExportContactRow[]): ExportContactRow[] {
  const seen = new Set<string>();
  const result: ExportContactRow[] = [];
  for (const c of contacts) {
    const key = (c.email ?? `id:${c.id}`).toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(c);
  }
  return result;
}

export function segmentContactsByTitle(
  contacts: ExportContactRow[]
): Map<string, ExportContactRow[]> {
  const segments = new Map<string, ExportContactRow[]>();
  const titleKeys = ["CEO", "HR", "Маркетинг", "Продажи"] as const;

  for (const key of titleKeys) {
    segments.set(key, []);
  }
  segments.set("Другое", []);

  for (const c of contacts) {
    const title = c.title ?? "";
    let matched = false;
    for (const key of titleKeys) {
      if (titleMatchesOption(title, key)) {
        segments.get(key)!.push(c);
        matched = true;
        break;
      }
    }
    if (!matched) {
      segments.get("Другое")!.push(c);
    }
  }

  for (const [key, list] of segments) {
    if (list.length === 0) segments.delete(key);
  }
  return segments;
}

export function segmentContactsByCity(contacts: ExportContactRow[]): Map<string, ExportContactRow[]> {
  const segments = new Map<string, ExportContactRow[]>();
  for (const c of contacts) {
    const city = c.company_city?.trim() || "Без города";
    if (!segments.has(city)) segments.set(city, []);
    segments.get(city)!.push(c);
  }
  return segments;
}

export function slugifyFilename(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-zа-яё0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40) || "segment";
}
