import type { Metadata } from "next";
import Link from "next/link";
import RoasterForm from "@/components/roaster-form/RoasterForm";

export const metadata: Metadata = {
  title: "Admin · Neue Rösterei — Coffee Selection",
  robots: { index: false, follow: false },
};

export default function AdminNewRoasterPage() {
  return (
    <>
      <div className="mb-8">
        <Link
          href="/admin/roasters"
          className="font-headline text-[10px] uppercase tracking-widest text-tertiary hover:text-primary inline-block mb-4"
        >
          ← Zurück zu allen Röstern
        </Link>
        <h1 className="text-4xl md:text-5xl text-primary uppercase tracking-tight font-headline font-bold mb-2">
          Neue Rösterei
        </h1>
        <p className="text-on-surface-variant text-sm max-w-2xl">
          Stammdaten der Rösterei anlegen. Nach dem Speichern landest du auf der
          Röster-Übersicht, dort kannst du im nächsten Schritt User einladen
          (→ „User verwalten").
        </p>
      </div>

      <RoasterForm
        submitEndpoint="/api/admin/roasters"
        submitMethod="POST"
        afterSaveHref="/admin/roasters"
      />
    </>
  );
}
