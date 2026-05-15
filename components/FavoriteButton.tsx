"use client";
import { useRouter, usePathname } from "next/navigation";
import { useFavorites } from "@/lib/favorites";

type Props = {
  type: "coffee" | "roaster";
  id: string;
  className?: string;
  size?: "sm" | "md" | "lg";
  /** Optional Label neben dem Herz (z.B. fuer Coffee-Detail-Page). */
  label?: boolean;
};

const SIZE_CLASS: Record<NonNullable<Props["size"]>, string> = {
  sm: "text-lg",
  md: "text-xl",
  lg: "text-2xl",
};

/**
 * Toggle-Button fuer Favoriten (Coffee oder Roester).
 *
 * - Eingeloggte User: optimistisches Toggle via useFavorites-Hook
 * - Anonyme User: Klick redirected auf /login?next=<aktuelle URL>
 * - Loading-State (Hook noch nicht gesynced): Herz leer, klickbar
 *
 * Bewusst keine Anti-Flicker-Logik mit serverseitigem Initial-Wert —
 * der SessionStorage-Cache aus useFavorites macht das nach dem
 * ersten Login-Sync von selbst.
 */
export default function FavoriteButton({
  type,
  id,
  className = "",
  size = "md",
  label = false,
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const {
    loggedIn,
    isCoffeeFavorite,
    isRoasterFavorite,
    toggleCoffee,
    toggleRoaster,
  } = useFavorites();

  const active = type === "coffee" ? isCoffeeFavorite(id) : isRoasterFavorite(id);

  const handle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (loggedIn === false) {
      router.push(`/login?next=${encodeURIComponent(pathname ?? "/")}`);
      return;
    }
    if (type === "coffee") await toggleCoffee(id);
    else await toggleRoaster(id);
  };

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={active ? "Aus Favoriten entfernen" : "Zu Favoriten hinzufügen"}
      aria-pressed={active}
      className={`inline-flex items-center gap-2 transition-colors ${
        active ? "text-tertiary" : "text-on-surface-variant hover:text-tertiary"
      } ${className}`}
    >
      <span
        className={`material-symbols-outlined ${SIZE_CLASS[size]}`}
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        favorite
      </span>
      {label && (
        <span className="font-headline text-[11px] uppercase tracking-widest font-bold">
          {active ? "Favorit" : "Merken"}
        </span>
      )}
    </button>
  );
}
