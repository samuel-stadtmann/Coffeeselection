"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

type Campaign = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  credit_chf: number;
  max_uses_per_customer: number;
  max_total_uses: number | null;
  current_uses: number;
  valid_from: string;
  valid_until: string | null;
  active: boolean;
  channel: string | null;
};

export default function CampaignRow({ campaign }: { campaign: Campaign }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const toggle = async () => {
    setBusy(true);
    await fetch(`/api/admin/campaigns/${campaign.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !campaign.active }),
    });
    setBusy(false);
    router.refresh();
  };

  const remove = async () => {
    if (!confirm(`Kampagne "${campaign.code}" wirklich löschen?`)) return;
    setBusy(true);
    await fetch(`/api/admin/campaigns/${campaign.id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  };

  const isExpired =
    campaign.valid_until != null && new Date(campaign.valid_until) < new Date();
  const usagePct =
    campaign.max_total_uses != null
      ? Math.round((campaign.current_uses / campaign.max_total_uses) * 100)
      : null;

  return (
    <div className="py-4 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3 md:gap-6 items-start">
      <div>
        <div className="flex items-center gap-3 flex-wrap mb-1">
          <span className="font-headline font-bold text-primary uppercase tracking-tight text-base">
            {campaign.code}
          </span>
          <span className="font-headline text-[10px] uppercase tracking-widest text-tertiary font-bold">
            CHF {Number(campaign.credit_chf).toFixed(2)}
          </span>
          {!campaign.active && (
            <span className="bg-surface-container text-on-surface-variant font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-0.5">
              Inaktiv
            </span>
          )}
          {isExpired && (
            <span className="bg-surface-container text-on-surface-variant font-headline text-[10px] uppercase tracking-widest font-bold px-2 py-0.5">
              Abgelaufen
            </span>
          )}
          {campaign.channel && (
            <span className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant">
              {campaign.channel}
            </span>
          )}
        </div>
        <p className="text-sm text-primary">{campaign.name}</p>
        {campaign.description && (
          <p className="text-xs text-on-surface-variant">{campaign.description}</p>
        )}
        <p className="text-xs text-on-surface-variant mt-1">
          {campaign.current_uses} ×{" "}
          {campaign.max_total_uses != null
            ? `${campaign.current_uses}/${campaign.max_total_uses} (${usagePct}%)`
            : "unbegrenzt"}
          {campaign.max_uses_per_customer > 1 &&
            ` · max ${campaign.max_uses_per_customer} / Kunde`}
          {campaign.valid_until &&
            ` · bis ${new Date(campaign.valid_until).toLocaleDateString("de-CH")}`}
        </p>
      </div>
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={toggle}
          disabled={busy}
          className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-primary transition-colors px-3 py-1 border border-surface-container disabled:opacity-50"
        >
          {campaign.active ? "Deaktivieren" : "Aktivieren"}
        </button>
        <button
          onClick={remove}
          disabled={busy}
          className="font-headline text-[10px] uppercase tracking-widest text-on-surface-variant hover:text-red-600 transition-colors px-3 py-1 border border-surface-container disabled:opacity-50"
        >
          Löschen
        </button>
      </div>
    </div>
  );
}
