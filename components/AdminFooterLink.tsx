"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Footer-Link zum Metriken-Dashboard. Wird nur fuer Admins gerendert.
 * Server-side Check via /api/admin/check, damit die ADMIN_EMAILS-Liste
 * nicht im HTML der Homepage landet.
 */
export default function AdminFooterLink() {
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let aborted = false;
    fetch("/api/admin/check", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { isAdmin: false }))
      .then((j: { isAdmin?: boolean }) => {
        if (!aborted) setIsAdmin(!!j.isAdmin);
      })
      .catch(() => {
        /* swallow: kein Admin-Link bei Fehler */
      });
    return () => {
      aborted = true;
    };
  }, []);

  if (!isAdmin) return null;

  return (
    <Link href="/admin/metrics" className="hover:text-tertiary transition-colors">
      Admin · Metriken
    </Link>
  );
}
