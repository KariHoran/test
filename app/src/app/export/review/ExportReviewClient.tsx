"use client";

import { useMemo, useState } from "react";
import type { ExportContactRow } from "@/lib/contacts";
import { isOutreachReady } from "@/lib/validation";
import { EXPORT_PRESETS, type ExportSegment } from "@/lib/export-utils";
import { DEFAULT_EMAIL_TEMPLATE, renderEmailTemplate } from "@/lib/personalization";
import ValidationBadge from "../../components/ValidationBadge";
import styles from "./export.module.css";

interface Props {
  contacts: ExportContactRow[];
  initialValidOnly: boolean;
}

export default function ExportReviewClient({ contacts, initialValidOnly }: Props) {
  const [validOnly, setValidOnly] = useState(initialValidOnly);
  const [validPhoneOnly, setValidPhoneOnly] = useState(false);
  const [outreachReadyOnly, setOutreachReadyOnly] = useState(false);
  const [dedupe, setDedupe] = useState(true);
  const [segmentBy, setSegmentBy] = useState<ExportSegment>("none");
  const [showTemplate, setShowTemplate] = useState(false);
  const [template, setTemplate] = useState(DEFAULT_EMAIL_TEMPLATE);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(contacts.filter((c) => c.email_status !== "invalid").map((c) => c.id))
  );

  const filtered = useMemo(() => {
    let list = contacts;
    if (outreachReadyOnly) {
      list = list.filter((c) => isOutreachReady(c));
    } else {
      if (validOnly) list = list.filter((c) => c.email_status === "valid");
      if (validPhoneOnly) list = list.filter((c) => c.phone_status === "valid");
    }
    if (dedupe) {
      const seen = new Set<string>();
      list = list.filter((c) => {
        const key = (c.email ?? `id:${c.id}`).toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
    return list;
  }, [contacts, validOnly, validPhoneOnly, outreachReadyOnly, dedupe]);

  const applyPreset = (presetId: string) => {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setValidOnly(preset.validOnly);
    setValidPhoneOnly(preset.validPhoneOnly);
    setOutreachReadyOnly(preset.outreachReady);
    setDedupe(preset.dedupe);
  };

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  };

  const selectedIds = [...selected].filter((id) => filtered.some((c) => c.id === id));

  const buildExportUrl = (extra?: Record<string, string>) => {
    if (selectedIds.length === 0) return null;
    const params = new URLSearchParams({ ids: selectedIds.join(",") });
    if (dedupe) params.set("dedupe", "true");
    if (segmentBy !== "none") params.set("segmentBy", segmentBy);
    if (extra) {
      for (const [k, v] of Object.entries(extra)) params.set(k, v);
    }
    return `/api/export?${params.toString()}`;
  };

  const exportUrl = buildExportUrl();
  const previewContact = filtered.find((c) => selected.has(c.id)) ?? filtered[0];
  const previewText = previewContact
    ? renderEmailTemplate(template, {
        firstName: previewContact.first_name,
        lastName: previewContact.last_name,
        title: previewContact.title,
        companyName: previewContact.company_name,
        city: previewContact.company_city,
        category: previewContact.company_category,
        rating: previewContact.company_rating,
      })
    : "";

  const handleSegmentedDownload = async () => {
    const baseUrl = buildExportUrl();
    if (!baseUrl) return;
    const res = await fetch(baseUrl);
    const data = await res.json();
    if (data.segments) {
      for (const seg of data.segments as { key: string; name: string }[]) {
        const url = buildExportUrl({ segmentKey: seg.key });
        if (url) {
          const a = document.createElement("a");
          a.href = url;
          a.download = seg.name;
          a.click();
          await new Promise((r) => setTimeout(r, 300));
        }
      }
    }
  };

  return (
    <>
      <div className={styles.toolbar}>
        <div className={styles.presetRow}>
          <span className={styles.presetLabel}>Пресеты:</span>
          {EXPORT_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={styles.presetBtn}
              onClick={() => applyPreset(p.id)}
            >
              {p.name}
            </button>
          ))}
        </div>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={validOnly}
            disabled={outreachReadyOnly}
            onChange={(e) => setValidOnly(e.target.checked)}
          />
          Только valid email
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={validPhoneOnly}
            disabled={outreachReadyOnly}
            onChange={(e) => setValidPhoneOnly(e.target.checked)}
          />
          Только valid телефон
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={outreachReadyOnly}
            onChange={(e) => setOutreachReadyOnly(e.target.checked)}
          />
          Готов к аутричу
        </label>
        <label className={styles.checkboxLabel}>
          <input type="checkbox" checked={dedupe} onChange={(e) => setDedupe(e.target.checked)} />
          Дедупликация email
        </label>

        <label className={styles.segmentLabel}>
          Сегментация CSV
          <select
            value={segmentBy}
            onChange={(e) => setSegmentBy(e.target.value as ExportSegment)}
          >
            <option value="none">Один файл</option>
            <option value="title">По должности</option>
            <option value="city">По городу</option>
          </select>
        </label>

        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={filtered.length > 0 && selectedIds.length === filtered.length}
            onChange={toggleAll}
          />
          Выбрать все ({filtered.length})
        </label>

        <span className={styles.count}>
          К экспорту: <strong>{selectedIds.length}</strong> контактов
        </span>

        {segmentBy !== "none" && selectedIds.length > 0 ? (
          <button type="button" className={styles.downloadBtn} onClick={handleSegmentedDownload}>
            Скачать сегменты
          </button>
        ) : exportUrl ? (
          <a href={exportUrl} className={styles.downloadBtn} download>
            Скачать CSV
          </a>
        ) : (
          <span className={styles.downloadDisabled}>Выберите контакты</span>
        )}
      </div>

      <div className={styles.templateSection}>
        <button
          type="button"
          className={styles.templateToggle}
          onClick={() => setShowTemplate((v) => !v)}
        >
          {showTemplate ? "Скрыть" : "Показать"} превью персонализации
        </button>
        {showTemplate && (
          <div className={styles.templateGrid}>
            <label>
              Шаблон письма
              <textarea
                rows={8}
                value={template}
                onChange={(e) => setTemplate(e.target.value)}
                className={styles.templateInput}
              />
              <span className={styles.templateHint}>
                Переменные: {"{{firstName}}"}, {"{{companyName}}"}, {"{{title}}"}, {"{{city}}"},
                {" {{category}}"}, {"{{painPoint}}"}
              </span>
            </label>
            <div>
              <strong>Превью</strong>
              <pre className={styles.templatePreview}>{previewText || "—"}</pre>
            </div>
          </div>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th />
              <th>Имя</th>
              <th>Должность</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Компания</th>
              <th>Город</th>
              <th>Email ✓</th>
              <th>Телефон ✓</th>
              <th>Аутрич</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={10} className={styles.empty}>
                  Нет контактов для экспорта. Измените фильтр или выберите другие компании.
                </td>
              </tr>
            ) : (
              filtered.map((c) => (
                <tr
                  key={c.id}
                  className={
                    !selected.has(c.id)
                      ? styles.rowExcluded
                      : c.email_status === "invalid"
                        ? styles.rowInvalid
                        : undefined
                  }
                >
                  <td>
                    <input
                      type="checkbox"
                      checked={selected.has(c.id)}
                      onChange={() => toggleOne(c.id)}
                    />
                  </td>
                  <td>{c.first_name ?? "—"}</td>
                  <td>{c.title ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.company_name}</td>
                  <td>{c.company_city ?? "—"}</td>
                  <td>
                    <ValidationBadge status={c.email_status} />
                  </td>
                  <td>
                    <ValidationBadge status={c.phone_status} />
                  </td>
                  <td>
                    {isOutreachReady(c) ? (
                      <span className={styles.readyBadge}>готов</span>
                    ) : (
                      <span className={styles.notReadyBadge}>—</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
