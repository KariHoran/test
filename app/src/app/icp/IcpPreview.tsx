"use client";

import { useEffect, useState } from "react";
import styles from "./icp.module.css";

interface Props {
  formId?: string;
}

export default function IcpPreview({ formId = "icp-form" }: Props) {
  const [companies, setCompanies] = useState<number | null>(null);
  const [contacts, setContacts] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const form = document.getElementById(formId);
    if (!form) return;

    const fetchPreview = () => {
      const fd = new FormData(form as HTMLFormElement);
      const params = new URLSearchParams();

      const q = String(fd.get("q") ?? "").trim();
      if (q) params.set("q", q);

      fd.getAll("cities").forEach((c) => params.append("cities", String(c)));
      fd.getAll("categories").forEach((c) => params.append("categories", String(c)));

      const minRating = String(fd.get("minRating") ?? "");
      if (minRating) params.set("minRating", minRating);

      const minReviews = String(fd.get("minReviews") ?? "");
      if (minReviews) params.set("minReviews", minReviews);

      const hasWebsite = String(fd.get("hasWebsite") ?? "");
      if (hasWebsite) params.set("hasWebsite", hasWebsite);

      fd.getAll("titles").forEach((t) => params.append("titles", String(t)));
      if (fd.get("decisionMakersOnly") === "on") params.set("decisionMakersOnly", "true");
      if (fd.get("validLprOnly") === "on") params.set("validLprOnly", "true");
      if (fd.get("activeOnly") === "on") params.set("activeOnly", "true");

      setLoading(true);
      fetch(`/api/icp/preview?${params.toString()}`)
        .then((r) => r.json())
        .then((data: { companies: number; contacts: number }) => {
          setCompanies(data.companies);
          setContacts(data.contacts);
        })
        .catch(() => {
          setCompanies(null);
          setContacts(null);
        })
        .finally(() => setLoading(false));
    };

    const debounced = () => {
      clearTimeout((window as unknown as { _icpTimer?: ReturnType<typeof setTimeout> })._icpTimer);
      (window as unknown as { _icpTimer?: ReturnType<typeof setTimeout> })._icpTimer = setTimeout(
        fetchPreview,
        400
      );
    };

    fetchPreview();
    form.addEventListener("change", debounced);
    form.addEventListener("input", debounced);
    return () => {
      form.removeEventListener("change", debounced);
      form.removeEventListener("input", debounced);
    };
  }, [formId]);

  return (
    <div className={styles.previewBox}>
      <strong>Предпросмотр ICP</strong>
      {loading ? (
        <span className={styles.previewMuted}> подсчёт…</span>
      ) : companies != null ? (
        <p className={styles.previewText}>
          Найдено ~<strong>{companies}</strong> компаний, ~<strong>{contacts}</strong> контактов
        </p>
      ) : (
        <p className={styles.previewMuted}>Не удалось загрузить предпросмотр</p>
      )}
    </div>
  );
}
