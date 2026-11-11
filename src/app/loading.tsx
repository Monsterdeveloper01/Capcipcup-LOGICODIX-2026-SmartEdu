import { FlaskConical } from "lucide-react";

export default function GlobalLoading() {
  return (
    <div className="min-h-screen w-full bg-[#FFFDF7] pop-dots flex items-center justify-center p-4 font-sans">
      <div className="pop-card rounded-3xl px-8 py-7 bg-white flex flex-col items-center gap-4 max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-2xl bg-[#FACC15] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center">
          <FlaskConical className="w-7 h-7 text-slate-900 animate-bounce" />
        </div>
        <div className="w-10 h-10 border-4 border-slate-900/20 border-t-slate-900 rounded-full animate-spin" />
        <div className="space-y-1">
          <p className="text-sm font-black uppercase tracking-wider text-slate-900">
            Memuat Ruang Belajar...
          </p>
          <p className="text-xs font-medium text-slate-600">
            Menyiapkan laboratorium dan data kelas untukmu.
          </p>
        </div>
      </div>
    </div>
  );
}

