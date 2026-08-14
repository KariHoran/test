import type { ValidationStatus } from "@/lib/validation";
import { statusLabel } from "@/lib/validation";
import styles from "../companies/companies.module.css";

interface Props {
  status: string;
}

export default function ValidationBadge({ status }: Props) {
  const s = (status as ValidationStatus) || "unknown";
  const className =
    s === "valid"
      ? styles.statusValid
      : s === "invalid"
        ? styles.statusInvalid
        : styles.statusUnknown;

  return <span className={className}>{statusLabel(s)}</span>;
}
