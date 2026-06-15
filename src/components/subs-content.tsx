"use client";

import { SUBSCRIPTIONS, type SubscriptionId } from "@/lib/subscriptions";
import { SubValueCard } from "@/components/sub-value-card";
import { useApp } from "@/components/providers";

export function SubsContent() {
  const { t } = useApp();
  // EA Play Pro is a tier inside the EA Play card. Prime Gaming is bundled with
  // Amazon Prime (no standalone TR price) so it isn't a value card.
  const HIDDEN: SubscriptionId[] = ["eaplaypro", "luna"];
  const ids = (Object.keys(SUBSCRIPTIONS) as SubscriptionId[]).filter((id) => !HIDDEN.includes(id));

  return (
    <div className="mx-auto w-[min(100%-2rem,64rem)] pt-8">
      <h1 className="font-display mb-2 text-2xl font-bold text-bright sm:text-3xl">
        {t.subsPage}
      </h1>
      <p className="mb-6 max-w-2xl text-sm text-muted">{t.tagline}</p>
      <div className="flex flex-col gap-4">
        {ids.map((id) =>
          id === "eaplay" ? (
            <SubValueCard key="ea" id="eaplay" mergeIds={["eaplay", "eaplaypro"]} />
          ) : (
            <SubValueCard key={id} id={id} />
          )
        )}
      </div>
    </div>
  );
}
