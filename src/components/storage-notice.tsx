"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers";

const KEY = "pricespawn-storage-notice";

export function StorageNotice({ show, onClose }: { show: boolean; onClose: () => void }) {
  const { t } = useApp();
  const [seen, setSeen] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSeen(localStorage.getItem(KEY) === "1");
  }, []);

  if (!show || seen) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(KEY, "1");
    } catch {
      // ignore
    }
    setSeen(true);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={dismiss}
    >
      <div className="panel-strong w-full max-w-md rounded-2xl p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-display mb-2 text-lg font-bold text-bright">{t.storageNoticeTitle}</h3>
        <p className="mb-5 text-sm text-muted">{t.storageNoticeBody}</p>
        <button
          onClick={dismiss}
          className="w-full rounded-full bg-accent-strong px-5 py-2.5 text-sm font-bold text-white transition-transform hover:scale-[1.02] cursor-pointer"
        >
          {t.storageNoticeOk}
        </button>
      </div>
    </div>
  );
}
