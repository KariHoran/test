"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";

interface Props {
  cities: string[];
  initialQ: string;
  initialCity: string;
}

export default function CompaniesFilters({ cities, initialQ, initialCity }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(initialQ);

  useEffect(() => {
    setQ(initialQ);
  }, [initialQ]);

  const pushParams = useCallback(
    (nextQ: string, nextCity: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQ.trim()) params.set("q", nextQ.trim());
      else params.delete("q");
      if (nextCity) params.set("city", nextCity);
      else params.delete("city");

      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `/companies?${qs}` : "/companies");
      });
    },
    [router, searchParams]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      if (q !== initialQ) {
        pushParams(q, initialCity);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [q, initialQ, initialCity, pushParams]);

  return (
    <div className="filters">
      <label>
        Поиск по названию
        <input
          type="search"
          placeholder="Например: Маяк"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          aria-busy={isPending}
        />
      </label>
      <label>
        Город
        <select
          value={initialCity}
          onChange={(e) => pushParams(q, e.target.value)}
        >
          <option value="">Все города</option>
          {cities.map((city) => (
            <option key={city} value={city}>
              {city}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
