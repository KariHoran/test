import { NextRequest, NextResponse } from "next/server";
import { getContactsByIds } from "@/lib/contacts";

function escapeCsv(value: string | null | undefined): string {
  const s = value ?? "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export async function GET(request: NextRequest) {
  const idsRaw = request.nextUrl.searchParams.get("ids");
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

  const contacts = await getContactsByIds(ids);

  const header = ["Имя", "Фамилия", "Должность", "Email", "Телефон", "Компания", "Город"];
  const rows = contacts.map((c) =>
    [
      escapeCsv(c.first_name),
      escapeCsv(c.last_name),
      escapeCsv(c.title),
      escapeCsv(c.email),
      escapeCsv(c.phone),
      escapeCsv(c.company_name),
      escapeCsv(c.company_city),
    ].join(",")
  );

  const csv = "\uFEFF" + [header.join(","), ...rows].join("\r\n");
  const filename = `dealrocket-export-${new Date().toISOString().slice(0, 10)}.csv`;

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
