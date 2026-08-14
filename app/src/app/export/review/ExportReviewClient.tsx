"use client";

import { useMemo, useState } from "react";
import type { ExportContactRow } from "@/lib/contacts";
import ValidationBadge from "../../components/ValidationBadge";
import styles from "./export.module.css";

interface Props {
  contacts: ExportContactRow[];
  initialValidOnly: boolean;
}

export default function ExportReviewClient({ contacts, initialValidOnly }: Props) {
  const [validOnly, setValidOnly] = useState(initialValidOnly);
  const [selected, setSelected] = useState<Set<number>>(
    () => new Set(contacts.filter((c) => c.email_status !== "invalid").map((c) => c.id))
  );

  const visible = useMemo(
    () => (validOnly ? contacts.filter((c) => c.email_status === "valid") : contacts),
    [contacts, validOnly]
  );

  const toggleOne = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === visible.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(visible.map((c) => c.id)));
    }
  };

  const selectedIds = [...selected].filter((id) => visible.some((c) => c.id === id));
  const exportUrl = selectedIds.length > 0 ? `/api/export?ids=${selectedIds.join(",")}` : null;

  return (
    <>
      <div className={styles.toolbar}>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={validOnly}
            onChange={(e) => setValidOnly(e.target.checked)}
          />
          Только валидные email
        </label>
        <label className={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={visible.length > 0 && selectedIds.length === visible.length}
            onChange={toggleAll}
          />
          Выбрать все ({visible.length})
        </label>
        <span className={styles.count}>
          К экспорту: <strong>{selectedIds.length}</strong> контактов
        </span>
        {exportUrl ? (
          <a href={exportUrl} className={styles.downloadBtn} download>
            Скачать CSV
          </a>
        ) : (
          <span className={styles.downloadDisabled}>Выберите контакты</span>
        )}
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th />
              <th>Имя</th>
              <th>Фамилия</th>
              <th>Должность</th>
              <th>Email</th>
              <th>Телефон</th>
              <th>Компания</th>
              <th>Email ✓</th>
              <th>Телефон ✓</th>
            </tr>
          </thead>
          <tbody>
            {visible.length === 0 ? (
              <tr>
                <td colSpan={9} className={styles.empty}>
                  Нет контактов для экспорта. Измените фильтр или выберите другие компании.
                </td>
              </tr>
            ) : (
              visible.map((c) => (
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
                  <td>{c.last_name ?? "—"}</td>
                  <td>{c.title ?? "—"}</td>
                  <td>{c.email ?? "—"}</td>
                  <td>{c.phone ?? "—"}</td>
                  <td>{c.company_name}</td>
                  <td>
                    <ValidationBadge status={c.email_status} />
                  </td>
                  <td>
                    <ValidationBadge status={c.phone_status} />
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
