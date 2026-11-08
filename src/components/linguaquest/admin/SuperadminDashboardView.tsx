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
      console.warn("Gagal ubah role user:", err);
    }
  };

  const handleDeleteUser = async (userId: string, usernameTarget: string) => {
    if (!confirm(`Yakin ingin menghapus pengguna '${usernameTarget}'?`)) return;

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
      {/* Header Banner (Clean Light Desk) */}
      <div className="border-2 border-black bg-white p-6 sm:p-7 shadow-[4px_4px_0px_#000000] flex flex-wrap items-center justify-between gap-6">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-red-600 text-xs font-black uppercase tracking-widest">
            <span className="w-2.5 h-2.5 bg-red-600 border border-black inline-block" />
            <span>[SUPERADMIN CONTROL TOWER // FULL ROOT ACCESS]</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-black uppercase tracking-tight">
            MANAJEMEN PENGGUNA & INFRASTRUKTUR SISTEM
          </h2>
          <p className="text-xs text-zinc-700 max-w-2xl leading-relaxed">
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
            className="brutal-btn-white px-3 py-2.5 text-xs font-black"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {message && (
        <div className="p-3 bg-emerald-100 text-emerald-900 border-2 border-emerald-700 font-black text-xs">
          {message}
        </div>
      )}

      {/* Platform Telemetry Metrics (4 Brutalist Stat Blocks) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase block">[TOTAL PENGGUNA]</span>
          <span className="text-3xl font-black text-amber-600">{stats?.totalUsers || 0}</span>
          <p className="text-[10px] text-zinc-600">
            {stats?.totalStudents || 0} Siswa • {stats?.totalTeachers || 0} Guru
          </p>
        </div>

        <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase block">[SESI SPEAKING RECORDED]</span>
          <span className="text-3xl font-black text-cyan-700">{stats?.totalSpeakingSessions || 0}</span>
          <p className="text-[10px] text-zinc-600">Rata-rata Skor: {stats?.avgOverallScore || 0}%</p>
        </div>

        <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase block">[BENDA SCAN TERSIMPAN]</span>
          <span className="text-3xl font-black text-emerald-700">{stats?.totalScannedItems || 0}</span>
          <p className="text-[10px] text-zinc-600">Di Database MariaDB</p>
        </div>

        <div className="p-4 bg-white border-2 border-black shadow-[3px_3px_0px_#000000] space-y-1">
          <span className="text-[10px] font-black text-zinc-600 uppercase block">[QUEST RPG TERBUAT]</span>
          <span className="text-3xl font-black text-red-600">{stats?.totalQuests || 0}</span>
          <p className="text-[10px] text-zinc-600">Skenario Percakapan Aktif</p>
        </div>
      </div>

      {/* Infrastructure Diagnostics Banner */}
      <div className="border-2 border-black bg-zinc-50 p-4 shadow-[3px_3px_0px_#000000] space-y-2 text-xs">
        <span className="font-black text-black uppercase block">[DIAGNOSTIK INFRASTRUKTUR SISTEM]:</span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-zinc-800">
          <div className="p-2.5 bg-white border border-black flex items-center justify-between">
            <span className="font-bold">DATABASE:</span>
            <span className="font-bold text-emerald-700">{stats?.databaseStatus || "CHECKING..."}</span>
          </div>
          <div className="p-2.5 bg-white border border-black flex items-center justify-between">
            <span className="font-bold">AI VISION ENGINE:</span>
            <span className={`font-bold ${stats?.geminiVisionStatus?.includes("CONFIGURED") ? "text-emerald-700" : "text-amber-700"}`}>
              {stats?.geminiVisionStatus || "CHECKING..."}
            </span>
          </div>
        </div>
      </div>

      {/* User Management Table */}
      <div className="border-2 border-black bg-white p-6 shadow-[4px_4px_0px_#000000] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-3">
          <div>
            <span className="text-xs font-black uppercase text-cyan-800">
              [TABEL MANAJEMEN PENGGUNA TERDAFTAR]
            </span>
            <h3 className="font-black text-lg text-black uppercase tracking-tight">
              Daftar Semua Akun di MariaDB
            </h3>
          </div>
          <span className="text-xs text-zinc-600 font-bold">
            Total: {users.length} Akun
          </span>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-zinc-600">
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
              <tbody className="divide-y divide-zinc-200 bg-white text-zinc-800">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 font-bold text-black flex items-center gap-2">
                      <span>{u.avatarUrl || "👤"}</span>
                      <span>{u.name}</span>
                    </td>
                    <td className="p-3 font-black text-cyan-800">{u.username}</td>
                    <td className="p-3 text-zinc-600">{u.email}</td>
                    <td className="p-3">
                      <select
                        value={u.role}
                        onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                        className={`px-2 py-1 border-2 font-black uppercase text-[11px] bg-white ${
                          u.role === "superadmin"
                            ? "text-red-700 border-red-700"
                            : u.role === "teacher"
                            ? "text-cyan-800 border-cyan-800"
                            : "text-amber-800 border-amber-800"
                        }`}
                      >
                        <option value="student">STUDENT (SISWA)</option>
                        <option value="teacher">TEACHER (GURU)</option>
                        <option value="superadmin">SUPERADMIN</option>
                      </select>
                    </td>
                    <td className="p-3">
                      Lvl {u.level} • <span className="text-amber-700 font-bold">{u.xp} XP</span>
                    </td>
                    <td className="p-3 font-bold">{u.sessionsCount || 0} Sesi</td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDeleteUser(u.id, u.username)}
                        className="px-2.5 py-1 bg-red-100 text-red-800 hover:bg-red-600 hover:text-white border border-red-600 text-[11px] font-black cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="border-2 border-black bg-white p-6 max-w-md w-full shadow-[6px_6px_0px_#000000] space-y-4">
            <div className="flex items-center justify-between border-b-2 border-zinc-200 pb-2">
              <span className="text-xs font-black uppercase text-black">
                [TAMBAH AKUN PENGGUNA BARU]
              </span>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-zinc-600 hover:text-black font-black"
              >
                [X]
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-black block mb-1 uppercase">Nama Lengkap:</label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black focus:bg-white focus:outline-none"
                  placeholder="Contoh: Rina Melati, M.Pd"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">Username (Untuk Login):</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black focus:bg-white focus:outline-none"
                  placeholder="Contoh: rina_guru"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">Email:</label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black focus:bg-white focus:outline-none"
                  placeholder="rina@capcipcup.edu"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">Password:</label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black focus:bg-white focus:outline-none"
                  placeholder="Minimal 6 karakter"
                />
              </div>

              <div>
                <label className="font-bold text-black block mb-1 uppercase">Role Pengguna:</label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full px-3 py-2 bg-zinc-50 border-2 border-black text-black font-bold"
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
                  className="brutal-btn-white px-4 py-2"
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
