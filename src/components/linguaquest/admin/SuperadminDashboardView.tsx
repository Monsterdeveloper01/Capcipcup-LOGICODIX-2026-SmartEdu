"use client";

import { useState, useEffect } from "react";
import {
  ShieldAlert,
  Users,
  Database,
  Cpu,
  Trash2,
  UserPlus,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Terminal,
  Activity,
  Layers,
  Sparkles,
} from "lucide-react";

export default function SuperadminDashboardView() {
  const [stats, setStats] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [newName, setNewName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState("student");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [resStats, resUsers] = await Promise.all([
        fetch("/api/admin/stats"),
        fetch("/api/admin/users"),
      ]);

      const dataStats = await resStats.json();
      const dataUsers = await resUsers.json();

      if (resStats.ok) setStats(dataStats.stats);
      if (resUsers.ok) setUsers(dataUsers.users);
    } catch (err) {
      console.warn("Gagal fetch data admin:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName || !newUsername || !newEmail || !newPassword) return;

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create",
          name: newName,
          username: newUsername,
          email: newEmail,
          password: newPassword,
          role: newRole,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat user.");

      setMessage(`Sukses: Akun ${newUsername} (${newRole}) berhasil dibuat!`);
      setShowAddModal(false);
      setNewName("");
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      fetchData();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateRole = async (userId: string, targetRole: string) => {
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_role",
          id: userId,
          role: targetRole,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.warn("Gagal update role:", err);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Hapus akun ${username}? Tindakan ini permanen.`)) return;

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          id: userId,
        }),
      });

      if (res.ok) {
        fetchData();
      }
    } catch (err) {
      console.warn("Gagal hapus user:", err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 font-mono">
      {/* Header Banner */}
      <div className="border-4 border-black dark:border-white bg-[#111317] p-6 sm:p-7 shadow-[6px_6px_0px_#000000] dark:shadow-[6px_6px_0px_#ef4444] flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-[#ef4444] text-xs font-black uppercase tracking-widest">
            <Terminal className="w-4 h-4 stroke-[3]" />
            <span>[SUPERADMIN CONTROL TOWER // FULL ROOT ACCESS]</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-white uppercase tracking-tight">
            MANAJEMEN PENGGUNA & INFRASTRUKTUR SISTEM
          </h2>
          <p className="text-xs text-zinc-300 max-w-2xl leading-relaxed">
            Kelola hak akses pengguna (Siswa, Guru, Superadmin), monitor data speaking session MariaDB, dan audit konfigurasi AI Engine secara langsung.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="brutal-btn-yellow px-4 py-2.5 text-xs font-black flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>[ + TAMBAH AKUN USER ]</span>
          </button>
          <button
            onClick={fetchData}
            className="brutal-btn-dark px-3 py-2.5 text-xs font-black"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-[#4ade80] text-black border-2 border-black font-black text-xs">
          {message}
        </div>
      )}

      {/* Platform Telemetry Metrics (4 Brutalist Stat Blocks) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-400 uppercase block">[TOTAL PENGGUNA]</span>
          <span className="text-3xl font-black text-[#facc15]">{stats?.totalUsers || 0}</span>
          <p className="text-[10px] text-zinc-400">
            {stats?.totalStudents || 0} Siswa • {stats?.totalTeachers || 0} Guru
          </p>
        </div>

        <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-400 uppercase block">[SESI SPEAKING RECORDED]</span>
          <span className="text-3xl font-black text-[#22d3ee]">{stats?.totalSpeakingSessions || 0}</span>
          <p className="text-[10px] text-zinc-400">Rata-rata Skor: {stats?.avgOverallScore || 0}%</p>
        </div>

        <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-400 uppercase block">[BENDA SCAN TERSIMPAN]</span>
          <span className="text-3xl font-black text-[#4ade80]">{stats?.totalScannedItems || 0}</span>
          <p className="text-[10px] text-zinc-400">Di Database MariaDB</p>
        </div>

        <div className="p-4 bg-black border-2 border-white shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-400 uppercase block">[QUEST RPG TERBUAT]</span>
          <span className="text-3xl font-black text-[#ef4444]">{stats?.totalQuests || 0}</span>
          <p className="text-[10px] text-zinc-400">Skenario Percakapan Aktif</p>
        </div>
      </div>

      {/* Infrastructure Diagnostics Banner */}
      <div className="border-3 border-black dark:border-white bg-[#0f1115] p-4 shadow-[4px_4px_0px_#000000] space-y-2 text-xs">
        <span className="font-black text-[#facc15] uppercase block">[DIAGNOSTIK INFRASTRUKTUR SISTEM]:</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-300">
          <div className="p-2.5 bg-black border border-zinc-700 flex items-center justify-between">
            <span>DATABASE:</span>
            <span className="font-bold text-[#4ade80]">{stats?.databaseStatus || "CHECKING..."}</span>
          </div>
          <div className="p-2.5 bg-black border border-zinc-700 flex items-center justify-between">
            <span>AI VISION ENGINE:</span>
            <span className={`font-bold ${stats?.geminiVisionStatus?.includes("CONFIGURED") ? "text-[#4ade80]" : "text-[#facc15]"}`}>
              {stats?.geminiVisionStatus || "CHECKING..."}
            </span>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="border-3 border-black dark:border-white bg-[#111317] p-6 shadow-[5px_5px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-3">
          <div>
            <span className="text-xs font-black uppercase text-[#22d3ee]">
              [TABEL MANAJEMEN PENGGUNA TERDAFTAR]
            </span>
            <h3 className="font-black text-lg text-white uppercase tracking-tight">
              Daftar Semua Akun di MariaDB
            </h3>
          </div>
          <span className="text-xs text-zinc-400 font-bold">
            Total: {users.length} Akun
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-400">
            [MEMUAT DATA PENGGUNA DARI DATABASE...]
          </div>
        ) : (
          <div className="overflow-x-auto border-2 border-black">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#facc15] text-black font-black uppercase border-b-2 border-black">
                <tr>
                  <th className="p-3">Nama</th>
                  <th className="p-3">Username</th>
                  <th className="p-3">Email</th>
                  <th className="p-3">Role Saat Ini</th>
                  <th className="p-3">Level / XP</th>
                  <th className="p-3">Sesi Speaking</th>
                  <th className="p-3 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800 bg-[#0a0b0e] text-zinc-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-900 transition-colors">
                    <td className="p-3 font-bold text-white flex items-center gap-2">
                      <span>{u.avatarUrl || "👤"}</span>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 font-black text-[#22d3ee]">{u.username}</td>
                    <td className="p-3 text-zinc-400">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`px-2 py-1 border font-black uppercase text-[11px] bg-black ${
                          u.role === "superadmin"
                            ? "text-[#ef4444] border-[#ef4444]"
                            : u.role === "teacher"
                            ? "text-[#22d3ee] border-[#22d3ee]"
                            : "text-[#facc15] border-[#facc15]"
                        }`}
                      >
                        <option value="student">STUDENT (SISWA)</option>
                        <option value="teacher">TEACHER (GURU)</option>
                        <option value="superadmin">SUPERADMIN</option>
                      </select>
                    </td>
                    <td className="p-3">
                      Lvl {u.level} • <span className="text-[#facc15] font-bold">{u.xp} XP</span>
                    </td>
                    <td className="p-3 font-bold">{u.sessionsCount || 0} Sesi</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="px-2 py-1 bg-red-950 text-red-300 hover:bg-red-800 hover:text-white border border-red-700 text-[11px] font-black"
                        title="Hapus Pengguna"
                      >
                        [HAPUS]
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah User Baru */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="border-4 border-black dark:border-white bg-[#111317] p-6 max-w-md w-full shadow-[8px_8px_0px_#000000] dark:shadow-[8px_8px_0px_#facc15] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-800 pb-2">
              <span className="text-xs font-black uppercase text-[#facc15]">
                [TAMBAH AKUN PENGGUNA BARU]
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-400 hover:text-white font-black"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white focus:border-[#facc15] focus:outline-none"
                  placeholder="Contoh: Rina Melati, M.Pd"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">Username (Untuk Login):</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white focus:border-[#facc15] focus:outline-none"
                  placeholder="Contoh: rina_guru"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">Email:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white focus:border-[#facc15] focus:outline-none"
                  placeholder="rina@capcipcup.edu"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">Password:</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white focus:border-[#facc15] focus:outline-none"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="font-bold text-zinc-300 block mb-1 uppercase">Role Pengguna:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-black border-2 border-white text-white font-bold"
                >
                  <option value="student">Student (Siswa)</option>
                  <option value="teacher">Teacher (Guru)</option>
                  <option value="superadmin">Superadmin</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="brutal-btn-dark px-4 py-2"
                >
                  BATAL
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="brutal-btn-yellow px-5 py-2 font-black"
                >
                  {isSubmitting ? "[ MENYIMPAN... ]" : "[ SIMPAN PENGGUNA ]"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

