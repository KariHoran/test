import { NextRequest, NextResponse } from "next/server";
import { getContactsByIds } from "@/lib/contacts";
import {
  dedupeContactsByEmail,
  segmentContactsByCity,
  segmentContactsByTitle,
  slugifyFilename,
  type ExportSegment,
} from "@/lib/export-utils";
import type { ExportContactRow } from "@/lib/contacts";

function escapeCsv(value: string | null | undefined): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

const CSV_HEADER = [
  "Имя",
  "Фамилия",
  "Должность",
  "Email",
  "Телефон",
  "Компания",
  "Город",
  "Категория",
  "Рейтинг",
];

function contactsToCsv(contacts: ExportContactRow[]): string {
  const rows = contacts.map((c) =>
    [
      escapeCsv(c.first_name),
      escapeCsv(c.last_name),
      escapeCsv(c.title),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.company_name),
      escapeCsv(c.company_city),
      escapeCsv(c.company_category),
      escapeCsv(c.company_rating != null ? String(c.company_rating) : null),
    ].join(",")
  );
  return "\uFEFF" + [CSV_HEADER.join(","), ...rows].join("\r\n");
}

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const idsRaw = sp.get("ids");
  if (!idsRaw?.trim()) {
    return NextResponse.json({ error: "ids parameter required" }, { status: 400 });
  }

  const ids = idsRaw
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !Number.isNaN(n));

  if (ids.length === 0) {
    return NextResponse.json({ error: "no valid ids" }, { status: 400 });
  }

  let contacts = await getContactsByIds(ids);

  if (sp.get("dedupe") === "true") {
    contacts = dedupeContactsByEmail(contacts);
  }

  const segmentBy = (sp.get("segmentBy") ?? "none") as ExportSegment;
  const segmentKey = sp.get("segmentKey");
  const date = new Date().toISOString().slice(0, 10);

  if (segmentBy === "none" || !segmentBy) {
    const csv = contactsToCsv(contacts);
    const filename = `contacts-export-${date}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const segments =
    segmentBy === "title"
      ? segmentContactsByTitle(contacts)
      : segmentContactsByCity(contacts);

  if (segmentKey) {
    const segmentContacts = segments.get(segmentKey);
    if (!segmentContacts) {
      return NextResponse.json({ error: "segment not found" }, { status: 404 });
    }
    const csv = contactsToCsv(segmentContacts);
    const filename = `contacts-${slugifyFilename(segmentKey)}-${date}.csv`;
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}"`,
      },
    });
  }

  const files = [...segments.entries()].map(([key, list]) => ({
    name: `contacts-${slugifyFilename(key)}-${date}.csv`,
    content: contactsToCsv(list),
    key,
  }));

  if (files.length === 1) {
    return new NextResponse(files[0].content, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${files[0].name}"`,
      },
    });
  }

  return NextResponse.json({
    segmented: true,
    segmentBy,
    segments: files.map((f) => ({ key: f.key, name: f.name, count: f.content.split("\r\n").length - 2 })),
  });
}
