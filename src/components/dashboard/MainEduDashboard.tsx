"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AuthLoginModal from "@/components/auth/AuthLoginModal";
import TeacherTaskBuilder from "@/components/lab/TeacherTaskBuilder";
import { AuthUser } from "@/lib/auth/types";
import { LabTask } from "@/lib/lab/types";
import {
  FlaskConical,
  GraduationCap,
  Plus,
  Users,
  BookOpen,
  Award,
  ClipboardList,
  Play,
  Trash2,
  Copy,
  Check,
  Search,
  ArrowLeft,
  Sparkles,
  LogIn,
  LogOut,
  ChevronRight,
  School,
  UserCheck,
  FileText,
  CheckCircle2,
  AlertCircle,
  RotateCcw,
  SlidersHorizontal,
  ExternalLink,
} from "lucide-react";

interface Classroom {
  id: string;
  classCode: string;
  name: string;
  gradeLevel: string;
  academicYear?: string;
  teacherId?: string;
  teacherName?: string;
  description?: string;
  studentCount?: number;
  taskCount?: number;
}

export default function MainEduDashboard() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isTeacher = currentUser?.role === "teacher" || currentUser?.role === "superadmin";

  // Classrooms State
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);

  // Active Classroom Sub-views for Teacher: "tasks" | "builder" | "members" | "submissions"
  const [classroomTab, setClassroomTab] = useState<"tasks" | "builder" | "members" | "submissions">("tasks");

  // Tasks in Active Classroom
  const [classroomTasks, setClassroomTasks] = useState<LabTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Members in Active Classroom
  const [classroomMembers, setClassroomMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Submissions in Active Classroom
  const [classroomSubmissions, setClassroomSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Create Classroom Modal State
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");
  const [newClassGrade, setNewClassGrade] = useState("SMA Kelas 11");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState<string | null>(null);

  // Join Classroom State for Students
  const [joinClassCode, setJoinClassCode] = useState("");
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [joinClassMsg, setJoinClassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Copy Code Feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Check user session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        }
      })
      .catch((e) => console.warn("Failed fetching session user:", e));
  }, []);

  // Fetch Classrooms whenever currentUser changes
  useEffect(() => {
    fetchClassrooms();
  }, [currentUser]);

  const fetchClassrooms = async () => {
    setIsLoadingClassrooms(true);
    try {
      let url = "/api/lab/classrooms";
      if (currentUser?.role === "student") {
        url = `/api/lab/classrooms?studentUsername=${currentUser.username}`;
      }
      const res = await fetch(url);
      const data = await res.json();
      if (res.ok && data.classrooms) {
        setClassrooms(data.classrooms);
      }
    } catch (e) {
      console.warn("Fetch classrooms error:", e);
    } finally {
      setIsLoadingClassrooms(false);
    }
  };

  // Fetch data for Active Classroom
  useEffect(() => {
    if (!activeClassroom) return;

    // Fetch Tasks for this room
    setIsLoadingTasks(true);
    fetch(`/api/lab/tasks?roomCode=${activeClassroom.classCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setClassroomTasks(data.tasks);
      })
      .catch((e) => console.warn(e))
      .finally(() => setIsLoadingTasks(false));

    // Fetch Members
    setIsLoadingMembers(true);
    fetch(`/api/lab/classrooms/members?classCode=${activeClassroom.classCode}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.members) setClassroomMembers(data.members);
      })
      .catch((e) => console.warn(e))
      .finally(() => setIsLoadingMembers(false));

    // Fetch Submissions
    setIsLoadingSubmissions(true);
    fetch(`/api/lab/submissions`)
      .then((res) => res.json())
      .then((data) => {
        if (data.submissions) {
          // Filter by tasks belonging to this classroom
          setClassroomSubmissions(data.submissions);
        }
      })
      .catch((e) => console.warn(e))
      .finally(() => setIsLoadingSubmissions(false));
  }, [activeClassroom]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setActiveClassroom(null);
      fetchClassrooms();
    } catch (e) {
      console.warn("Logout error:", e);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  // Teacher: Create New Classroom
  const handleCreateClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) {
      setCreateClassError("Nama kelas wajib diisi.");
      return;
    }

    setIsCreatingClass(true);
    setCreateClassError(null);

    try {
      const res = await fetch("/api/lab/classrooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newClassName.trim(),
          gradeLevel: newClassGrade,
          classCode: newClassCode.trim() || undefined,
          description: newClassDesc.trim() || undefined,
          teacherId: currentUser?.id,
          teacherName: currentUser?.name || "Budi Santoso, S.Pd",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal membuat kelas.");

      setIsCreateClassModalOpen(false);
      setNewClassName("");
      setNewClassCode("");
      setNewClassDesc("");
      fetchClassrooms();
      setActiveClassroom(data.classroom);
      setClassroomTab("tasks");
    } catch (err: any) {
      setCreateClassError(err.message || "Gagal membuat kelas.");
    } finally {
      setIsCreatingClass(false);
    }
  };

  // Teacher: Delete Classroom
  const handleDeleteClassroom = async (classroomId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Apakah Anda yakin ingin menghapus ruang kelas ini beserta anggotanya?")) return;

    try {
      const res = await fetch(`/api/lab/classrooms?id=${classroomId}`, { method: "DELETE" });
      if (res.ok) {
        if (activeClassroom?.id === classroomId) setActiveClassroom(null);
        fetchClassrooms();
      }
    } catch (e) {
      console.error("Delete classroom error:", e);
    }
  };

  // Student: Join Classroom by Code
  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinClassCode.trim()) return;

    setIsJoiningClass(true);
    setJoinClassMsg(null);

    try {
      const res = await fetch("/api/lab/classrooms/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          classCode: joinClassCode.trim(),
          userId: currentUser?.id,
          studentName: currentUser?.name || "Ahmad Faiz",
          studentUsername: currentUser?.username || "siswa",
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal bergabung ke kelas.");

      setJoinClassMsg({ type: "success", text: data.message || "Berhasil bergabung!" });
      setJoinClassCode("");
      fetchClassrooms();
    } catch (err: any) {
      setJoinClassMsg({ type: "error", text: err.message || "Gagal bergabung." });
    } finally {
      setIsJoiningClass(false);
    }
  };

  // Delete Task in Classroom
  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus tugas praktikum ini?")) return;
    try {
      const res = await fetch(`/api/lab/tasks?id=${taskId}`, { method: "DELETE" });
      if (res.ok && activeClassroom) {
        // Refresh tasks
        const tRes = await fetch(`/api/lab/tasks?roomCode=${activeClassroom.classCode}`);
        const tData = await tRes.json();
        if (tData.tasks) setClassroomTasks(tData.tasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#1e1f22] text-[#dbdee1] flex flex-col font-sans select-none antialiased">
      {/* =========================================================================
          TOP NAVBAR
          ========================================================================= */}
      <header className="h-16 border-b border-[#202225] bg-[#2b2d31] px-4 sm:px-8 flex items-center justify-between shrink-0 shadow-md z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#5865F2] to-[#4752c4] flex items-center justify-center text-white shadow-lg">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black text-white tracking-tight">
                Capcipcup <span className="text-[#5865F2]">SmartEdu</span>
              </h1>
              <span className="text-[10px] bg-[#5865F2] text-white px-2 py-0.5 rounded-full font-bold">
                KIMIA 3D
              </span>
            </div>
            <p className="text-[11px] text-[#949ba4] hidden sm:block">
              Platform Pembelajaran & Laboratorium Virtual Sains Interaktif
            </p>
          </div>
        </div>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-3">
          {/* Direct Link to 3D Virtual Lab */}
          <Link
            href="/lab?mode=sandbox"
            className="px-3.5 py-2 bg-gradient-to-r from-[#23a55a] to-[#1f9250] hover:from-[#1f9250] hover:to-[#17723e] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-md transition-all hover:scale-105"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Buka Meja Lab 3D (Sandbox)</span>
            <span className="sm:hidden">Lab 3D</span>
          </Link>

          {/* Account Status */}
          {currentUser ? (
            <div className="flex items-center gap-2 bg-[#1e1f22] border border-[#3b3e45] rounded-xl px-3 py-1.5 shadow-sm">
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs ${
                  isTeacher ? "bg-[#FEE75C] text-black" : "bg-[#5865F2] text-white"
                }`}
              >
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-bold text-white max-w-[140px] truncate leading-tight">
                  {currentUser.name}
                </div>
                <span className="text-[10px] text-[#949ba4] font-medium">
                  {isTeacher ? "Guru Pengampu" : "Siswa Praktikan"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Ganti Akun"
                className="p-1 text-[#949ba4] hover:text-[#ed4245] rounded-lg hover:bg-[#35373c] transition-colors ml-1 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(true)}
              className="px-4 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow"
            >
              <LogIn className="w-4 h-4" />
              <span>Masuk Akun</span>
            </button>
          )}
        </div>
      </header>

      {/* =========================================================================
          MAIN DASHBOARD BODY
          ========================================================================= */}
      <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-8 space-y-6">
        {/* =====================================================================
            VIEW 1: TEACHER DASHBOARD (GURU PENGAMPU)
            ===================================================================== */}
        {isTeacher ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Active Classroom Selected View */}
            {activeClassroom ? (
              <div className="space-y-6">
                {/* Classroom Navigation Header */}
                <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl p-5 shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveClassroom(null);
                        setClassroomTab("tasks");
                      }}
                      className="px-3 py-1.5 bg-[#1e1f22] hover:bg-[#35373c] border border-[#3b3e45] text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Kembali ke Semua Kelas</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <div className="bg-[#1e1f22] px-3 py-1 rounded-xl border border-[#3b3e45] flex items-center gap-2">
                        <span className="text-[10px] text-[#949ba4] font-bold uppercase">KODE KELAS:</span>
                        <span className="font-mono font-black text-sm text-[#57F287] tracking-wider">
                          {activeClassroom.classCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(activeClassroom.classCode)}
                          className="text-[#949ba4] hover:text-white p-1"
                          title="Salin Kode Kelas"
                        >
                          {copiedCode === activeClassroom.classCode ? (
                            <Check className="w-3.5 h-3.5 text-[#57F287]" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <Link
                        href={`/lab?classCode=${activeClassroom.classCode}&mode=sandbox`}
                        className="px-3.5 py-1.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Meja Sandbox Kelas</span>
                      </Link>
                    </div>
                  </div>

                  <div className="border-t border-[#3b3e45] pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
                          {activeClassroom.gradeLevel}
                        </span>
                        <h2 className="text-lg sm:text-xl font-extrabold text-white">
                          {activeClassroom.name}
                        </h2>
                      </div>
                      <p className="text-xs text-[#949ba4] mt-1">
                        {activeClassroom.description || "Ruang kelas praktikum sains interaktif."}
                      </p>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-[#dbdee1]">
                      <span className="bg-[#1e1f22] px-3 py-1.5 rounded-lg border border-[#3b3e45] font-semibold">
                        👥 {classroomMembers.length} Siswa Terdaftar
                      </span>
                      <span className="bg-[#1e1f22] px-3 py-1.5 rounded-lg border border-[#3b3e45] font-semibold">
                        📋 {classroomTasks.length} Tugas Diterbitkan
                      </span>
                    </div>
                  </div>

                  {/* Classroom Sub-Tabs */}
                  <div className="flex items-center gap-2 border-t border-[#3b3e45] pt-3">
                    <button
                      type="button"
                      onClick={() => setClassroomTab("tasks")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        classroomTab === "tasks" || classroomTab === "builder"
                          ? "bg-[#5865F2] text-white shadow"
                          : "bg-[#1e1f22] text-[#949ba4] hover:text-white"
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Tugas Praktikum ({classroomTasks.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassroomTab("members")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        classroomTab === "members"
                          ? "bg-[#5865F2] text-white shadow"
                          : "bg-[#1e1f22] text-[#949ba4] hover:text-white"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Siswa Anggota Kelas ({classroomMembers.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassroomTab("submissions")}
                      className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                        classroomTab === "submissions"
                          ? "bg-[#5865F2] text-white shadow"
                          : "bg-[#1e1f22] text-[#949ba4] hover:text-white"
                      }`}
                    >
                      <Award className="w-4 h-4" />
                      <span>Rekap Nilai Siswa</span>
                    </button>
                  </div>
                </div>

                {/* Sub-Tab 1: Task Builder & Tasks */}
                {classroomTab === "builder" ? (
                  <div className="space-y-4">
                    <TeacherTaskBuilder
                      roomCode={activeClassroom.classCode}
                      teacherName={currentUser?.name || "Budi Santoso, S.Pd"}
                      tasks={classroomTasks}
                      onTaskCreated={() => {
                        // Refresh tasks
                        fetch(`/api/lab/tasks?roomCode=${activeClassroom.classCode}`)
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.tasks) setClassroomTasks(d.tasks);
                          });
                        setClassroomTab("tasks");
                      }}
                      onCancel={() => setClassroomTab("tasks")}
                    />
                  </div>
                ) : classroomTab === "tasks" ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#949ba4]">
                        Daftar tugas praktikum yang aktif di kelas <strong>{activeClassroom.name}</strong>.
                      </span>

                      <button
                        type="button"
                        onClick={() => setClassroomTab("builder")}
                        className="px-4 py-2 bg-gradient-to-r from-[#5865F2] to-[#4752c4] hover:from-[#4752c4] hover:to-[#3b43a3] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-[1.02]"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Rancang Tugas Baru di Kelas Ini</span>
                      </button>
                    </div>

                    {isLoadingTasks ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs">
                        <div className="w-6 h-6 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                        Memuat tugas praktikum...
                      </div>
                    ) : classroomTasks.length === 0 ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-8 space-y-4">
                        <ClipboardList className="w-10 h-10 text-[#949ba4] mx-auto opacity-40" />
                        <div className="space-y-1">
                          <p className="font-bold text-sm text-white">Belum Ada Tugas di Kelas Ini</p>
                          <p className="text-[11px] text-[#949ba4] max-w-md mx-auto">
                            Rancang tugas praktikum pertama untuk kelas ini menggunakan <strong>Mode Analisis RPP Otomatis AI</strong> atau <strong>Kustom Mandiri</strong>.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setClassroomTab("builder")}
                          className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl shadow-md"
                        >
                          + Rancang Tugas Praktikum Sekarang
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {classroomTasks.map((task) => (
                          <div
                            key={task.id}
                            className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] rounded-2xl p-5 space-y-3 transition-colors flex flex-col justify-between shadow-md"
                          >
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black bg-[#5865F2] text-white px-2 py-0.5 rounded uppercase">
                                  {task.gradeLevel}
                                </span>
                                <span className="text-[11px] text-[#949ba4]">Kelas: {task.roomCode}</span>
                              </div>

                              <h4 className="font-bold text-sm text-white">{task.title}</h4>
                              <p className="text-xs text-[#dbdee1] leading-relaxed line-clamp-3">
                                {task.instructions}
                              </p>

                              <div className="flex items-center justify-between text-xs pt-2 border-t border-[#3b3e45]">
                                <span className="text-[#57F287] font-semibold">
                                  🔬 {task.chemicalIds?.length || 0} Reagen di Meja 3D
                                </span>
                                <span className="text-[#FEE75C] font-semibold">
                                  📝 {task.questions?.length || 0} Butir Kuis
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <Link
                                href={`/lab?taskId=${task.id}&mode=sandbox`}
                                className="flex-1 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Uji Coba di Lab 3D (Sandbox)</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 bg-[#ed4245]/20 hover:bg-[#ed4245] text-[#ed4245] hover:text-white rounded-xl transition-colors"
                                title="Hapus Tugas"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : classroomTab === "members" ? (
                  /* Sub-Tab 2: Members */
                  <div className="space-y-4">
                    <div className="p-4 bg-[#2b2d31] border border-[#3b3e45] rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-white">Siswa Anggota Kelas</h4>
                        <p className="text-xs text-[#949ba4]">
                          Bagikan Kode Kelas <strong className="text-[#57F287] font-mono">{activeClassroom.classCode}</strong> kepada murid agar bergabung ke kelas ini.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activeClassroom.classCode)}
                        className="px-3 py-1.5 bg-[#1e1f22] hover:bg-[#35373c] border border-[#3b3e45] text-xs font-bold text-white rounded-xl flex items-center gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Kelas</span>
                      </button>
                    </div>

                    {isLoadingMembers ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs">Memuat siswa...</div>
                    ) : classroomMembers.length === 0 ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-6 space-y-2">
                        <Users className="w-8 h-8 text-[#949ba4] mx-auto opacity-40" />
                        <p>Belum ada siswa yang bergabung di kelas ini.</p>
                      </div>
                    ) : (
                      <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl overflow-hidden shadow">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#1e1f22] text-[#949ba4] text-[10px] uppercase font-bold border-b border-[#3b3e45]">
                            <tr>
                              <th className="px-4 py-3">Nama Siswa</th>
                              <th className="px-4 py-3">Username</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Bergabung</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#3b3e45]">
                            {classroomMembers.map((m) => (
                              <tr key={m.id} className="hover:bg-[#35373c]/50">
                                <td className="px-4 py-3 font-bold text-white flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#5865F2] text-white flex items-center justify-center font-bold text-[10px]">
                                    {m.studentName?.charAt(0) || "S"}
                                  </div>
                                  <span>{m.studentName}</span>
                                </td>
                                <td className="px-4 py-3 text-[#949ba4] font-mono">{m.studentUsername}</td>
                                <td className="px-4 py-3">
                                  <span className="text-[#57F287] font-bold text-[10px] bg-[#23a55a]/20 px-2 py-0.5 rounded">
                                    Aktif
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[#949ba4] text-[11px]">
                                  {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString("id-ID") : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Sub-Tab 3: Submissions */
                  <div className="space-y-4">
                    <h4 className="font-bold text-sm text-white">Rekap Nilai Siswa Kelas {activeClassroom.name}</h4>
                    {isLoadingSubmissions ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs">Memuat nilai...</div>
                    ) : classroomSubmissions.length === 0 ? (
                      <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-6 space-y-2">
                        <Award className="w-8 h-8 text-[#949ba4] mx-auto opacity-40" />
                        <p>Belum ada siswa yang mengumpulkan kuis praktikum.</p>
                      </div>
                    ) : (
                      <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl overflow-hidden shadow">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#1e1f22] text-[#949ba4] text-[10px] uppercase font-bold border-b border-[#3b3e45]">
                            <tr>
                              <th className="px-4 py-3">Nama Siswa</th>
                              <th className="px-4 py-3">Reaksi 3D</th>
                              <th className="px-4 py-3">Skor Kuis</th>
                              <th className="px-4 py-3">Laporan Analisis</th>
                              <th className="px-4 py-3">Waktu</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#3b3e45]">
                            {classroomSubmissions.map((s) => (
                              <tr key={s.id} className="hover:bg-[#35373c]/50">
                                <td className="px-4 py-3 font-bold text-white">{s.studentName}</td>
                                <td className="px-4 py-3">
                                  <span className="text-[#57F287] font-semibold">✓ Sukses</span>
                                </td>
                                <td className="px-4 py-3">
                                  <span
                                    className={`font-black px-2 py-0.5 rounded text-[11px] ${
                                      s.score >= 80
                                        ? "bg-[#57F287]/20 text-[#57F287]"
                                        : "bg-[#FEE75C]/20 text-[#FEE75C]"
                                    }`}
                                  >
                                    {s.score}/100
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-[#dbdee1] max-w-xs truncate">{s.aiAnalysis}</td>
                                <td className="px-4 py-3 text-[#949ba4] text-[11px]">
                                  {s.completedAt ? new Date(s.completedAt).toLocaleTimeString("id-ID") : "-"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              /* All Classrooms View for Teacher */
              <div className="space-y-6">
                {/* Teacher Hero Welcome Banner */}
                <div className="bg-gradient-to-r from-[#2b2d31] via-[#1e1f22] to-[#2b2d31] border border-[#3b3e45] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
                  <div className="max-w-2xl space-y-3 z-10 relative">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-[#FEE75C] text-black px-2.5 py-0.5 rounded-full shadow">
                        PORTAL UTAMA GURU
                      </span>
                      <span className="text-xs text-[#57F287] font-bold">
                        ● Sistem Pembelajaran Aktif
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                      Selamat Datang, {currentUser.name} 👨‍🏫
                    </h2>

                    <p className="text-xs sm:text-sm text-[#dbdee1] leading-relaxed">
                      Kelola ruang kelas praktikum sains, terbitkan tugas dengan <strong>AI RPP Generator</strong>, dan uji coba eksperimen di laboratorium 3D secara leluasa.
                    </p>

                    <div className="flex flex-wrap items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setIsCreateClassModalOpen(true)}
                        className="px-4 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        <span>+ Buat Ruang Kelas Baru</span>
                      </button>

                      <Link
                        href="/lab?mode=sandbox"
                        className="px-4 py-2.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-xl flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>Masuk Meja Lab 3D (Sandbox Guru)</span>
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Classrooms Grid Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <School className="w-5 h-5 text-[#5865F2]" />
                        <span>Daftar Ruang Kelas Anda ({classrooms.length})</span>
                      </h3>
                      <p className="text-xs text-[#949ba4]">
                        Pilih salah satu kelas untuk memberikan tugas praktikum, melihat murid, atau menyalin kode kelas.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreateClassModalOpen(true)}
                      className="px-3.5 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors shadow"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Kelas</span>
                    </button>
                  </div>

                  {isLoadingClassrooms ? (
                    <div className="text-center py-16 text-[#949ba4] text-xs">
                      <div className="w-8 h-8 border-2 border-[#5865F2] border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      Memuat ruang kelas...
                    </div>
                  ) : classrooms.length === 0 ? (
                    <div className="text-center py-16 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-3xl bg-[#2b2d31] p-8 space-y-4">
                      <School className="w-12 h-12 text-[#949ba4] mx-auto opacity-40" />
                      <div className="space-y-1">
                        <p className="font-bold text-base text-white">Belum Ada Ruang Kelas</p>
                        <p className="text-xs text-[#949ba4]">
                          Anda belum memiliki ruang kelas. Buat kelas pertama untuk mulai menugaskan praktikum 3D kepada siswa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateClassModalOpen(true)}
                        className="px-5 py-2.5 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl shadow-lg"
                      >
                        + Buat Ruang Kelas Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {classrooms.map((cls) => (
                        <div
                          key={cls.id}
                          onClick={() => {
                            setActiveClassroom(cls);
                            setClassroomTab("tasks");
                          }}
                          className="bg-[#2b2d31] hover:bg-[#35373c] border border-[#3b3e45] hover:border-[#5865F2] rounded-2xl p-5 space-y-4 transition-all duration-200 cursor-pointer shadow-lg hover:shadow-xl group flex flex-col justify-between"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-black uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
                                {cls.gradeLevel}
                              </span>

                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(cls.classCode);
                                }}
                                className="bg-[#1e1f22] px-2.5 py-0.5 rounded-lg border border-[#3b3e45] text-xs font-mono font-bold text-[#57F287] flex items-center gap-1.5 hover:border-[#57F287] transition-colors"
                                title="Klik untuk salin kode kelas"
                              >
                                <span>PIN {cls.classCode}</span>
                                {copiedCode === cls.classCode ? (
                                  <Check className="w-3 h-3 text-[#57F287]" />
                                ) : (
                                  <Copy className="w-3 h-3 text-[#949ba4]" />
                                )}
                              </div>
                            </div>

                            <div>
                              <h4 className="font-extrabold text-base text-white group-hover:text-[#5865F2] transition-colors line-clamp-1">
                                {cls.name}
                              </h4>
                              <p className="text-xs text-[#949ba4] mt-1 line-clamp-2 leading-relaxed">
                                {cls.description || "Ruang kelas praktikum sains interaktif."}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-3 pt-3 border-t border-[#3b3e45]">
                            <div className="flex items-center justify-between text-xs text-[#dbdee1]">
                              <span className="flex items-center gap-1.5 font-medium">
                                <Users className="w-3.5 h-3.5 text-[#5865F2]" />
                                {cls.studentCount || 0} Siswa
                              </span>
                              <span className="flex items-center gap-1.5 font-medium">
                                <ClipboardList className="w-3.5 h-3.5 text-[#FEE75C]" />
                                {cls.taskCount || 0} Tugas
                              </span>
                            </div>

                            <div className="flex items-center gap-2 pt-1">
                              <button
                                type="button"
                                className="flex-1 py-2 bg-[#5865F2] group-hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center justify-center gap-1.5"
                              >
                                <span>Buka Kelas</span>
                                <ChevronRight className="w-3.5 h-3.5" />
                              </button>

                              <button
                                type="button"
                                onClick={(e) => handleDeleteClassroom(cls.id, e)}
                                className="p-2 bg-[#ed4245]/20 hover:bg-[#ed4245] text-[#ed4245] hover:text-white rounded-xl transition-colors"
                                title="Hapus Kelas"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : currentUser?.role === "student" ? (
          /* =====================================================================
              VIEW 2: STUDENT DASHBOARD (SISWA PRAKTIKAN)
              ===================================================================== */
          <div className="space-y-6 animate-in fade-in">
            {/* Student Hero Banner */}
            <div className="bg-gradient-to-r from-[#2b2d31] via-[#1e1f22] to-[#2b2d31] border border-[#3b3e45] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
              <div className="max-w-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase bg-[#5865F2] text-white px-2.5 py-0.5 rounded-full shadow">
                    DASHBOARD SISWA
                  </span>
                  <span className="text-xs text-[#57F287] font-bold">
                    ● Siap Praktikum 3D
                  </span>
                </div>

                <h2 className="text-xl sm:text-3xl font-black text-white tracking-tight">
                  Halo, {currentUser.name} 🎓
                </h2>

                <p className="text-xs sm:text-sm text-[#dbdee1] leading-relaxed">
                  Gabung ke ruang kelas gurumu dengan memasukkan Kode Kelas, kerjakan eksperimen interaktif di laboratorium 3D, dan amati reaksi kimia secara langsung!
                </p>

                <div className="pt-2">
                  <Link
                    href="/lab?mode=sandbox"
                    className="px-4 py-2.5 bg-[#23a55a] hover:bg-[#1f9250] text-white text-xs font-bold rounded-xl inline-flex items-center gap-2 shadow-lg transition-transform hover:scale-105"
                  >
                    <FlaskConical className="w-4 h-4" />
                    <span>Eksplorasi Bebas di Meja Lab 3D (Mode Sandbox)</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Join Classroom Card */}
            <div className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl p-5 shadow-lg space-y-3">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#5865F2]" />
                <span>Gabung ke Ruang Kelas Guru</span>
              </h3>
              <p className="text-xs text-[#949ba4]">
                Minta Kode Kelas (PIN) dari gurumu untuk bergabung dan menerima tugas praktikum.
              </p>

              <form onSubmit={handleJoinClassroom} className="flex flex-wrap items-center gap-2 pt-1">
                <input
                  type="text"
                  value={joinClassCode}
                  onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())}
                  placeholder="Contoh: LAB889"
                  className="px-4 py-2 bg-[#1e1f22] border border-[#3b3e45] text-xs font-mono font-bold text-white rounded-xl outline-none focus:border-[#5865F2] w-48 tracking-wider"
                />
                <button
                  type="submit"
                  disabled={isJoiningClass || !joinClassCode.trim()}
                  className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-colors shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isJoiningClass ? "Memproses..." : "Gabung Kelas"}</span>
                </button>
              </form>

              {joinClassMsg && (
                <div
                  className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
                    joinClassMsg.type === "success"
                      ? "bg-[#57F287]/20 border border-[#57F287] text-[#57F287]"
                      : "bg-[#ed4245]/20 border border-[#ed4245] text-[#f2f3f5]"
                  }`}
                >
                  {joinClassMsg.type === "success" ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-[#ed4245]" />
                  )}
                  <span>{joinClassMsg.text}</span>
                </div>
              )}
            </div>

            {/* Enrolled Classrooms Grid */}
            <div className="space-y-4">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <School className="w-5 h-5 text-[#5865F2]" />
                <span>Kelas yang Anda Ikuti ({classrooms.length})</span>
              </h3>

              {isLoadingClassrooms ? (
                <div className="text-center py-12 text-[#949ba4] text-xs">Memuat kelas...</div>
              ) : classrooms.length === 0 ? (
                <div className="text-center py-12 text-[#949ba4] text-xs border border-dashed border-[#3b3e45] rounded-2xl bg-[#2b2d31] p-6 space-y-2">
                  <p>Anda belum bergabung ke kelas mana pun.</p>
                  <p className="text-[11px] text-[#949ba4]">Masukkan kode kelas dari guru di form atas.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classrooms.map((cls) => (
                    <div
                      key={cls.id}
                      className="bg-[#2b2d31] border border-[#3b3e45] rounded-2xl p-5 space-y-3 shadow-md flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase bg-[#5865F2] text-white px-2 py-0.5 rounded">
                            {cls.gradeLevel}
                          </span>
                          <span className="text-xs font-mono font-bold text-[#57F287] bg-[#1e1f22] px-2 py-0.5 rounded border border-[#3b3e45]">
                            PIN {cls.classCode}
                          </span>
                        </div>

                        <h4 className="font-bold text-base text-white">{cls.name}</h4>
                        <p className="text-xs text-[#949ba4]">Guru: {cls.teacherName}</p>
                        <p className="text-xs text-[#dbdee1] line-clamp-2 leading-relaxed">
                          {cls.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#3b3e45] flex items-center gap-2">
                        <Link
                          href={`/lab?classCode=${cls.classCode}&mode=task`}
                          className="flex-1 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl transition-colors shadow text-center flex items-center justify-center gap-1.5"
                        >
                          <Play className="w-3.5 h-3.5" />
                          <span>Mulai Tugas Lab</span>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* =====================================================================
              VIEW 3: GUEST / UNREGISTERED USER LANDING
              ===================================================================== */
          <div className="space-y-8 py-6 max-w-4xl mx-auto text-center animate-in fade-in">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#5865F2] to-[#4752c4] flex items-center justify-center text-white shadow-2xl mx-auto">
              <FlaskConical className="w-8 h-8" />
            </div>

            <div className="space-y-3">
              <span className="text-xs font-black uppercase bg-[#5865F2] text-white px-3 py-1 rounded-full shadow">
                VIRTUAL SCIENCE LABORATORY
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                Simulasi Praktikum Kimia 3D & Manajemen Kelas Interaktif
              </h2>
              <p className="text-sm text-[#dbdee1] max-w-xl mx-auto leading-relaxed">
                Platform canggih untuk guru merancang tugas praktikum menggunakan <strong>Gemini AI RPP Auto-Pilot</strong> dan siswa bereksperimen langsung di meja 3D dengan deteksi reaksi spontan & sensor tangan.
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-6 py-3 bg-[#5865F2] hover:bg-[#4752c4] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk Akun (Guru / Siswa)</span>
              </button>

              <Link
                href="/lab?mode=sandbox"
                className="px-6 py-3 bg-[#23a55a] hover:bg-[#1f9250] text-white font-bold text-xs sm:text-sm rounded-xl shadow-xl transition-transform hover:scale-105 flex items-center gap-2"
              >
                <FlaskConical className="w-4 h-4" />
                <span>Coba Meja Lab 3D Langsung (Sandbox)</span>
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL 1: BUAT RUANG KELAS BARU (GURU)
          ========================================================================= */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#313338] border border-[#3b3e45] rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#3b3e45] pb-3">
              <h3 className="font-extrabold text-base text-white flex items-center gap-2">
                <School className="w-5 h-5 text-[#5865F2]" />
                <span>Buat Ruang Kelas Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateClassModalOpen(false)}
                className="text-[#949ba4] hover:text-white"
              >
                ✕
              </button>
            </div>

            {createClassError && (
              <div className="p-3 bg-[#ed4245]/20 border border-[#ed4245] text-xs font-semibold text-white rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-[#ed4245] shrink-0" />
                <span>{createClassError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-[#dbdee1] uppercase">Nama Kelas:</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: Praktikum Kimia 10 IPA 1"
                  className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-semibold text-white rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#dbdee1] uppercase">Jenjang:</label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] text-xs font-semibold text-white rounded-xl outline-none"
                  >
                    <option value="SD Kelas 5">SD (Sains Dasar)</option>
                    <option value="SMP Kelas 8">SMP (Zat & Asam Basa)</option>
                    <option value="SMA Kelas 10">SMA Kelas 10</option>
                    <option value="SMA Kelas 11">SMA Kelas 11</option>
                    <option value="SMA Kelas 12">SMA Kelas 12</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-[#dbdee1] uppercase">
                    Kode Kelas (PIN):
                  </label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                    placeholder="Auto (Kosongkan)"
                    className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs font-mono font-bold text-[#57F287] rounded-xl outline-none tracking-wider"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-[#dbdee1] uppercase">Deskripsi Kelas:</label>
                <textarea
                  rows={2}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="Materi praktikum, jadwal laboratorium, dll..."
                  className="w-full p-2.5 bg-[#1e1f22] border border-[#3b3e45] focus:border-[#5865F2] text-xs text-white rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#3b3e45]">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="px-4 py-2 bg-[#35373c] hover:bg-[#404249] text-white text-xs font-semibold rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="px-5 py-2 bg-[#5865F2] hover:bg-[#4752c4] text-white text-xs font-bold rounded-xl shadow flex items-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCreatingClass ? "Membuat..." : "Buat Kelas"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          MODAL 2: AUTH LOGIN MODAL
          ========================================================================= */}
      <AuthLoginModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          fetchClassrooms();
        }}
        currentUser={currentUser}
      />
    </div>
  );
}

