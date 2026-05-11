import { redirect } from "next/navigation";
import { getRoasterUser } from "@/lib/roaster/auth";

// /roaster ist der Einstiegspunkt — Nicht-eingeloggte landen auf /roaster/login,
// eingeloggte Roester-User direkt auf /roaster/dashboard. Die alte Mock-
// Dashboard-Seite wurde im Zuge von P13/P15 abgeloest.
export default async function RoasterIndexPage() {
  const u = await getRoasterUser();
  if (u) redirect("/roaster/dashboard");
  redirect("/roaster/login");
}
