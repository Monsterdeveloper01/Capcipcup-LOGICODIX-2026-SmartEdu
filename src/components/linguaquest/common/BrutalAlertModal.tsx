"use client";

import { AlertCircle, CheckCircle2, Info, HelpCircle, X } from "lucide-react";

export type ModalType = "info" | "success" | "warning" | "danger" | "confirm";

export interface ModalConfig {
  isOpen: boolean;
  type?: ModalType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

export default function BrutalAlertModal({
  isOpen,
  type = "info",
  title,
  message,
  confirmText = "[ OKE / MENGERTI ]",
  cancelText = "[ BATAL ]",
  onConfirm,
  onCancel,
}: ModalConfig) {
  if (!isOpen) return null;

  const isConfirm = type === "confirm" || Boolean(onCancel);

  const typeConfig = {
    info: {
      badgeBg: "bg-[#22d3ee] text-black",
      badgeText: "[ INFORMASI SISTEM ]",
      icon: <Info className="w-6 h-6 stroke-[2.5] text-cyan-900" />,
      btnClass: "brutal-btn-yellow",
    },
    success: {
      badgeBg: "bg-[#4ade80] text-black",
      badgeText: "[ BERHASIL // SUCCESS ]",
      icon: <CheckCircle2 className="w-6 h-6 stroke-[2.5] text-emerald-950" />,
      btnClass: "brutal-btn-yellow",
    },
    warning: {
      badgeBg: "bg-[#facc15] text-black",
      badgeText: "[ PERHATIAN // WARNING ]",
      icon: <AlertCircle className="w-6 h-6 stroke-[2.5] text-amber-950" />,
      btnClass: "brutal-btn-yellow",
    },
    danger: {
      badgeBg: "bg-[#ef4444] text-white",
      badgeText: "[ PERINGATAN SISTEM // ERROR ]",
      icon: <AlertCircle className="w-6 h-6 stroke-[2.5] text-red-600" />,
      btnClass: "brutal-btn-red text-white",
    },
    confirm: {
      badgeBg: "bg-[#facc15] text-black",
      badgeText: "[ KONFIRMASI TINDAKAN ]",
      icon: <HelpCircle className="w-6 h-6 stroke-[2.5] text-black" />,
      btnClass: "brutal-btn-yellow",
    },
  }[type] || {
    badgeBg: "bg-[#facc15] text-black",
    badgeText: "[ NOTIFIKASI ]",
    icon: <Info className="w-6 h-6 stroke-[2.5] text-black" />,
    btnClass: "brutal-btn-yellow",
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 font-mono">
      <div className="border-4 border-black bg-white max-w-md w-full p-6 shadow-[8px_8px_0px_#000000] space-y-4 text-black">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-black pb-3">
          <div className="flex items-center gap-2.5">
            <span className="p-1.5 bg-zinc-100 border-2 border-black">
              {typeConfig.icon}
            </span>
            <div>
              <span className={`text-[10px] font-black uppercase px-2 py-0.5 border border-black ${typeConfig.badgeBg}`}>
                {typeConfig.badgeText}
              </span>
              <h3 className="text-base font-black uppercase text-black mt-1">
                {title}
              </h3>
            </div>
          </div>
          <button
            onClick={onCancel || onConfirm}
            className="p-1 bg-black text-white hover:bg-zinc-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Message */}
        <div className="p-3.5 bg-zinc-50 border-2 border-black text-xs leading-relaxed text-zinc-900 font-bold whitespace-pre-line">
          {message}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          {isConfirm && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="brutal-btn-white px-4 py-2 text-xs font-mono font-black uppercase"
            >
              {cancelText}
            </button>
          )}
          <button
            type="button"
            onClick={onConfirm}
            className={`${typeConfig.btnClass} px-5 py-2 text-xs font-mono font-black uppercase shadow-[3px_3px_0px_#000000]`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

