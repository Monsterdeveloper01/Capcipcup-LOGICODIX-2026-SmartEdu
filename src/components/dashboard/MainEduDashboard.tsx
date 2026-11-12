"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import AuthLoginModal from "@/components/auth/AuthLoginModal";
import TeacherTaskBuilder from "@/components/lab/TeacherTaskBuilder";
import StudentSubmissionDetailModal from "@/components/lab/StudentSubmissionDetailModal";
import StudentTutorialGuide from "@/components/onboarding/StudentTutorialGuide";
import { DUMMY_TUTORIAL_CLASSROOM, DUMMY_TUTORIAL_TASK } from "@/lib/lab/tutorialConstants";
import { AuthUser } from "@/lib/auth/types";
import { CHEMICAL_CATALOG } from "@/lib/lab/chemicals-db";
import { LabSubmission, LabTask } from "@/lib/lab/types";
import {
  FlaskConical,
  Plus,
  Users,
  Award,
  ClipboardList,
  Play,
  Trash2,
  Copy,
  Check,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  LogIn,
  LogOut,
  ChevronRight,
  School,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Eye,
  Pencil,
  BookOpen,
  RotateCcw,
  Target,
  ShieldCheck,
  ExternalLink,
  X,
  Atom,
  Layers,
  Zap,
  Bot,
  TrendingUp,
  Lightbulb,
  Sunrise,
  Sun,
  Sunset,
  Moon,
  Clock,
  Volume2,
  GraduationCap,
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

const CHEMISTRY_AI_TIPS = [
  {
    title: "Presipitasi & Hasil Kali Kelarutan (Ksp)",
    text: "Pada fenomena 'Hujan Emas', kristal kuning PbI2 berkilau terbentuk saat konsentrasi ion timbal dan iodida melampaui tetapan kelarutannya (Ksp). Kristal ini akan larut kembali bila dipanaskan dan mengkristal kembali saat didinginkan!",
    category: "Kimia Fisik & Larutan",
  },
  {
    title: "Aturan Pengenceran Asam Pekat",
    text: "Ingat prinsip 'Asam ke Air' (Acid to Water)! Selalu tuangkan asam perlahan ke dalam wadah berisi air sambil diaduk perlahan. Jangan pernah menuangkan air ke asam pekat karena pelepasan panas hidrasi seketika dapat memercikkan zat kimia berbahaya ke arahmu.",
    category: "Keselamatan Laboratorium",
  },
  {
    title: "Titik Akhir Titrasi & Indikator Fenolftalein (PP)",
    text: "Indikator PP tidak berwarna pada suasana netral dan asam (pH < 8.2). Begitu tetesan basa terakhir menetralkan asam dan pH naik sedikit ke rentang basa tipis, larutan seketika berubah menjadi merah muda lembayung transparan!",
    category: "Titrasi Asam Basa",
  },
  {
    title: "Reaksi Eksoterm vs Endoterm",
    text: "Reaksi eksotermik (seperti netralisasi kuat atau pembakaran) melepaskan kalor ke lingkungan sehingga dinding tabung terasa hangat/panas. Sebaliknya, reaksi asam asetat dengan baking soda bersifat endotermik yang menyerap kalor sehingga suhu wadah turun sejuk!",
    category: "Termokimia",
  },
  {
    title: "Hukum Kekekalan Massa (Lavoisier)",
    text: "Massa total zat sebelum reaksi selalu sama dengan massa total zat sesudah reaksi dalam sistem tertutup. Selalu pastikan koefisien persamaan reaksi kimiamu seimbang sebelum memprediksi hasil stoikiometri!",
    category: "Stoikiometri Dasar",
  },
];

export default function MainEduDashboard() {
  const router = useRouter();

  // Authentication State
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<"login" | "register">("login");
  const isTeacher = currentUser?.role === "teacher" || currentUser?.role === "superadmin";
  const isStudent = currentUser?.role === "student";

  // Live time ticker for dynamic greeting
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());
  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = useMemo(() => {
    const hours = currentTime.getHours();
    const timeString = currentTime.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

    if (hours >= 4 && hours < 11) {
      return {
        period: "Pagi",
        title: "Selamat Pagi!",
        mascotQuote: "Udara pagi yang segar sangat pas untuk bereksperimen! Siap meracik reaksi kimia hari ini?",
        subtext: "Awali harimu dengan eksperimen sains interaktif di Laboratorium Virtual 3D Capcipcup.",
        icon: Sunrise,
        badgeBg: "bg-[#FEF08A]",
        badgeText: "text-amber-950",
        timeString,
      };
    } else if (hours >= 11 && hours < 15) {
      return {
        period: "Siang",
        title: "Selamat Siang!",
        mascotQuote: "Tetap semangat di tengah hari! Ayo uji coba reaksi eksotermik & perubahan warna larutan!",
        subtext: "Eksplorasi reaksi kimia dan amati presipitasi endapan kristal secara real-time.",
        icon: Sun,
        badgeBg: "bg-[#FED7AA]",
        badgeText: "text-orange-950",
        timeString,
      };
    } else if (hours >= 15 && hours < 18) {
      return {
        period: "Sore",
        title: "Selamat Sore!",
        mascotQuote: "Waktu yang tepat untuk mengulang praktikum atau menyelesaikan tugas lab dari gurumu!",
        subtext: "Tuntaskan misi praktikum sebelum tenggat waktu dan raih nilai terbaik di atas KKM.",
        icon: Sunset,
        badgeBg: "bg-[#FDE047]",
        badgeText: "text-amber-950",
        timeString,
      };
    } else {
      return {
        period: "Malam",
        title: "Selamat Malam!",
        mascotQuote: "Belajar sains di malam hari terasa lebih magis! Jangan lupa istirahat yang cukup ya.",
        subtext: "Meja Sandbox 3D selalu terbuka kapan pun kamu ingin menguji rasa ingin tahumu.",
        icon: Moon,
        badgeBg: "bg-[#C7D2FE]",
        badgeText: "text-indigo-950",
        timeString,
      };
    }
  }, [currentTime]);

  // Mascot Cinematic Entrance Animation State (Only for Guest / Unauthenticated users)
  // Stage flow: "rising" (from bottom to center) -> "greeting" (screen dims, mascot greets) -> "sliding" (mascot slides right) -> "docked" (final layout)
  const [introStage, setIntroStage] = useState<"rising" | "greeting" | "sliding" | "docked">("docked");
  const introAudioRef = useRef<HTMLAudioElement | null>(null);
  const hasPlayedIntroSoundRef = useRef<boolean>(false);

  useEffect(() => {
    // If authentication is still being checked or user is already logged in, stay docked (no dark overlay)
    if (isAuthLoading || currentUser) {
      setIntroStage("docked");
      return;
    }

    // Play intro sound effect (/sound/lucadialessandro-intro-sound-180639.mp3) - STRICTLY 1 KALI SAJA untuk Guest
    const alreadyPlayedInSession =
      typeof window !== "undefined" &&
      sessionStorage.getItem("capcipcup_intro_sound_played") === "true";

    if (alreadyPlayedInSession) {
      setIntroStage("docked");
      return;
    }

    // Start guest cinematic intro only for real unauthenticated guests
    setIntroStage("rising");

    if (!hasPlayedIntroSoundRef.current && !alreadyPlayedInSession) {
      hasPlayedIntroSoundRef.current = true;
      try {
        sessionStorage.setItem("capcipcup_intro_sound_played", "true");
        const audio = new Audio("/sound/lucadialessandro-intro-sound-180639.mp3");
        audio.volume = 0.75;
        audio.loop = false; // Memastikan lagu tidak berulang dan hanya diputar 1 kali
        introAudioRef.current = audio;

        audio.onended = () => {
          introAudioRef.current = null;
        };

        const playPromise = audio.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {
            // If browser autoplay restriction requires a user gesture first,
            // play on first user tap/click/keypress while still in intro
            const playOnGesture = () => {
              if (introAudioRef.current) {
                introAudioRef.current.play().catch(() => {});
              }
              window.removeEventListener("pointerdown", playOnGesture);
              window.removeEventListener("keydown", playOnGesture);
            };
            window.addEventListener("pointerdown", playOnGesture, { once: true });
            window.addEventListener("keydown", playOnGesture, { once: true });
          });
        }
      } catch (e) {
        console.warn("Intro sound playback error:", e);
      }
    }

    // Phase 1 -> Phase 2: Mascot finishes rising from bottom to center after 650ms
    const t1 = setTimeout(() => {
      setIntroStage("greeting");
    }, 650);

    // Phase 2 -> Phase 3: Mascot greets for 2.8s, then smoothly slides to the right
    const t2 = setTimeout(() => {
      setIntroStage("sliding");
    }, 3400);

    // Phase 3 -> Phase 4: Completes sliding into docked hero
    const t3 = setTimeout(() => {
      setIntroStage("docked");
    }, 4100);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (introAudioRef.current) {
        introAudioRef.current.pause();
        introAudioRef.current = null;
      }
    };
  }, [currentUser, isAuthLoading]);

  const handleProceedToDocked = () => {
    if (introStage !== "docked") {
      setIntroStage("sliding");
      setTimeout(() => {
        setIntroStage("docked");
      }, 650);

      // Smoothly fade out audio when user skips or clicks proceed
      if (introAudioRef.current) {
        const a = introAudioRef.current;
        const fadeInterval = setInterval(() => {
          if (a.volume > 0.15) {
            a.volume = Math.max(0, a.volume - 0.2);
          } else {
            clearInterval(fadeInterval);
            a.pause();
            introAudioRef.current = null;
          }
        }, 60);
      }
    }
  };

  // Interactive Onboarding Tutorial for Students (Skenario Orientasi Awal)
  const [isStudentTutorialActive, setIsStudentTutorialActive] = useState(false);
  const hasAutoStartedStudentTutorialRef = useRef<boolean>(false);

  useEffect(() => {
    if (hasAutoStartedStudentTutorialRef.current) return;
    // Only auto-start tutorial if this account has NOT completed the tutorial in the database yet
    if (currentUser?.role === "student" && currentUser.id && !currentUser.hasCompletedTutorial) {
      hasAutoStartedStudentTutorialRef.current = true;
      const timer = setTimeout(() => {
        setIsStudentTutorialActive(true);
      }, 900);
      return () => clearTimeout(timer);
    }
  }, [currentUser]);

  const handleFinishStudentTutorial = async () => {
    setIsStudentTutorialActive(false);
    hasAutoStartedStudentTutorialRef.current = true;
    if (currentUser?.id) {
      // Update local state immediately
      setCurrentUser((prev) => (prev ? { ...prev, hasCompletedTutorial: true } : null));

      // Save permanently to database so other browsers & future logins never replay it
      try {
        await fetch("/api/auth/complete-tutorial", { method: "POST" });
      } catch (err) {
        console.warn("Failed saving tutorial completion to database:", err);
      }
    }
  };

  const handleRestartStudentTutorial = () => {
    setActiveClassroom(null);
    setSelectedTaskForDetail(null);
    setIsStudentTutorialActive(true);
  };

  // Classrooms State
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [isLoadingClassrooms, setIsLoadingClassrooms] = useState(true);
  const [activeClassroom, setActiveClassroom] = useState<Classroom | null>(null);

  // Active Classroom Sub-views for Teacher: "tasks" | "builder" | "members" | "submissions"
  const [classroomTab, setClassroomTab] = useState<"tasks" | "builder" | "members" | "submissions">("tasks");

  // Tasks in Active Classroom
  const [classroomTasks, setClassroomTasks] = useState<LabTask[]>([]);
  const [isLoadingTasks, setIsLoadingTasks] = useState(false);

  // Student Selected Task for Briefing Modal (Alur: Buka Kelas -> Pilih Tugas -> Modal Detail -> Proceed to Lab)
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<LabTask | null>(null);
  const [studentSubmissions, setStudentSubmissions] = useState<LabSubmission[]>([]);
  const [isOpeningLab, setIsOpeningLab] = useState(false);

  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/") {
      setIsOpeningLab(false);
    }
    return () => {
      setIsOpeningLab(false);
    };
  }, [pathname, selectedTaskForDetail]);

  // Members in Active Classroom
  const [classroomMembers, setClassroomMembers] = useState<any[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);

  // Submissions in Active Classroom (Teacher & Student detail view)
  const [classroomSubmissions, setClassroomSubmissions] = useState<any[]>([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
  const [selectedClassroomTaskId, setSelectedClassroomTaskId] = useState<string | null>(null);

  // Edit Task State in Classroom
  const [taskToEdit, setTaskToEdit] = useState<LabTask | null>(null);

  // Create Classroom Modal State
  const [isCreateClassModalOpen, setIsCreateClassModalOpen] = useState(false);
  const [newClassName, setNewClassName] = useState("");

  // Effective Classrooms for Student (inject dummy demo classroom if student has 0 classrooms during tutorial)
  const effectiveStudentClassrooms = useMemo(() => {
    if (isStudent && classrooms.length === 0 && isStudentTutorialActive) {
      return [DUMMY_TUTORIAL_CLASSROOM as any];
    }
    return classrooms;
  }, [classrooms, isStudent, isStudentTutorialActive]);

  // Effective Classroom Tasks (inject dummy demo task if classroom has 0 tasks during tutorial or dummy classroom)
  const effectiveClassroomTasks = useMemo(() => {
    if (
      isStudent &&
      classroomTasks.length === 0 &&
      (activeClassroom?.id === DUMMY_TUTORIAL_CLASSROOM.id || isStudentTutorialActive)
    ) {
      return [DUMMY_TUTORIAL_TASK];
    }
    return classroomTasks;
  }, [classroomTasks, isStudent, activeClassroom, isStudentTutorialActive]);
  const [newClassGrade, setNewClassGrade] = useState("SMA Kelas 11");
  const [newClassCode, setNewClassCode] = useState("");
  const [newClassDesc, setNewClassDesc] = useState("");
  const [isCreatingClass, setIsCreatingClass] = useState(false);
  const [createClassError, setCreateClassError] = useState<string | null>(null);

  // Join Classroom State for Students
  const [joinClassCode, setJoinClassCode] = useState("");
  const [isJoiningClass, setIsJoiningClass] = useState(false);
  const [joinClassMsg, setJoinClassMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // All Tasks assigned to student across all enrolled classrooms
  const [allStudentTasks, setAllStudentTasks] = useState<LabTask[]>([]);
  const [isLoadingAllStudentTasks, setIsLoadingAllStudentTasks] = useState(false);

  // Interactive AI Tips Modal
  const [showAiTipModal, setShowAiTipModal] = useState(false);
  const [currentAiTipIndex, setCurrentAiTipIndex] = useState(0);

  // Copy Code Feedback state
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Check user session on mount
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated && data.user) {
          setCurrentUser(data.user);
        } else {
          setCurrentUser(null);
        }
      })
      .catch((e) => {
        console.warn("Failed fetching session user:", e);
        setCurrentUser(null);
      })
      .finally(() => {
        setIsAuthLoading(false);
      });
  }, []);

  // Fetch Classrooms, Student Submissions & All Student Tasks whenever currentUser changes
  useEffect(() => {
    fetchClassrooms();
    if (currentUser?.role === "student" && currentUser.name) {
      fetch(`/api/lab/submissions?studentName=${encodeURIComponent(currentUser.name)}&studentUsername=${encodeURIComponent(currentUser.username)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.submissions) setStudentSubmissions(data.submissions);
        })
        .catch(() => {});

      setIsLoadingAllStudentTasks(true);
      fetch(`/api/lab/tasks?studentUsername=${encodeURIComponent(currentUser.username)}&studentId=${encodeURIComponent(currentUser.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.tasks) setAllStudentTasks(data.tasks);
        })
        .catch(() => {})
        .finally(() => setIsLoadingAllStudentTasks(false));
    } else {
      setStudentSubmissions([]);
      setAllStudentTasks([]);
    }
  }, [currentUser]);

  const fetchClassrooms = async (userOverride?: AuthUser | null) => {
    setIsLoadingClassrooms(true);
    try {
      const activeUser = userOverride !== undefined ? userOverride : currentUser;
      let url = "/api/lab/classrooms";
      if (activeUser?.role === "student") {
        url = `/api/lab/classrooms?studentUsername=${encodeURIComponent(activeUser.username)}`;
      } else if (activeUser?.role === "teacher") {
        url = `/api/lab/classrooms?teacherId=${encodeURIComponent(activeUser.id)}&teacherName=${encodeURIComponent(activeUser.name)}`;
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

    if (activeClassroom.id === DUMMY_TUTORIAL_CLASSROOM.id) {
      setClassroomTasks([DUMMY_TUTORIAL_TASK]);
      setIsLoadingTasks(false);
      return;
    }

    setIsLoadingTasks(true);
    fetch(`/api/lab/tasks?roomCode=${encodeURIComponent(activeClassroom.classCode)}&classroomId=${encodeURIComponent(activeClassroom.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.tasks) setClassroomTasks(data.tasks);
      })
      .catch((e) => console.warn(e))
      .finally(() => setIsLoadingTasks(false));

    if (isTeacher) {
      setIsLoadingMembers(true);
      fetch(`/api/lab/classrooms/members?classCode=${encodeURIComponent(activeClassroom.classCode)}&classroomId=${encodeURIComponent(activeClassroom.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.members) setClassroomMembers(data.members);
        })
        .catch((e) => console.warn(e))
        .finally(() => setIsLoadingMembers(false));

      setIsLoadingSubmissions(true);
      fetch(`/api/lab/submissions?classroomId=${encodeURIComponent(activeClassroom.id)}&classCode=${encodeURIComponent(activeClassroom.classCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.submissions) {
            setClassroomSubmissions(data.submissions);
          }
        })
        .catch((e) => console.warn(e))
        .finally(() => setIsLoadingSubmissions(false));
    } else if (isStudent && currentUser?.name) {
      fetch(`/api/lab/submissions?studentName=${encodeURIComponent(currentUser.name)}&classroomId=${encodeURIComponent(activeClassroom.id)}&classCode=${encodeURIComponent(activeClassroom.classCode)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.submissions) setStudentSubmissions(data.submissions);
        })
        .catch(() => {});
    }
  }, [activeClassroom, isTeacher, isStudent, currentUser?.name]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setCurrentUser(null);
      setActiveClassroom(null);
      setSelectedTaskForDetail(null);
      setClassrooms([]);
      setClassroomSubmissions([]);
      setStudentSubmissions([]);
      fetchClassrooms(null);
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

      setJoinClassMsg({ type: "success", text: data.message || "Berhasil bergabung ke kelas!" });
      setJoinClassCode("");
      fetchClassrooms();
      if (currentUser?.role === "student") {
        fetch(`/api/lab/tasks?studentUsername=${encodeURIComponent(currentUser.username)}&studentId=${encodeURIComponent(currentUser.id)}`)
          .then((r) => r.json())
          .then((d) => {
            if (d.tasks) setAllStudentTasks(d.tasks);
          })
          .catch(() => {});
      }
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
        const tRes = await fetch(`/api/lab/tasks?roomCode=${activeClassroom.classCode}`);
        const tData = await tRes.json();
        if (tData.tasks) setClassroomTasks(tData.tasks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const classroomAccentPalette = [
    { bg: "bg-[#FEF08A]", tag: "bg-[#FACC15]", iconBg: "bg-[#38BDF8]" },
    { bg: "bg-[#BAE6FD]", tag: "bg-[#38BDF8]", iconBg: "bg-[#34D399]" },
    { bg: "bg-[#A7F3D0]", tag: "bg-[#34D399]", iconBg: "bg-[#FACC15]" },
    { bg: "bg-[#FED7AA]", tag: "bg-[#FB923C]", iconBg: "bg-[#38BDF8]" },
  ];

  // AI Co-Pilot dynamic intelligence for student condition
  const aiStudentInsights = useMemo(() => {
    if (!currentUser || currentUser.role !== "student") return null;

    const totalClasses = classrooms.length;
    const totalTasks = allStudentTasks.length;
    const completedCount = studentSubmissions.length;

    // Set of completed task IDs
    const completedTaskIds = new Set(studentSubmissions.map((s) => String(s.taskId)));

    // Pending tasks (tasks in student's classrooms not yet submitted)
    const pendingTasks = allStudentTasks.filter((t) => !completedTaskIds.has(String(t.id)));

    // Remedial submissions (scores below KKM, default 75)
    const remedialSubmissions = studentSubmissions.filter((s) => {
      const kkm = s.kkmScore !== undefined && s.kkmScore !== null ? s.kkmScore : 75;
      return s.score < kkm;
    });

    // Submissions that passed KKM
    const passedSubmissions = studentSubmissions.filter((s) => {
      const kkm = s.kkmScore !== undefined && s.kkmScore !== null ? s.kkmScore : 75;
      return s.score >= kkm;
    });

    // Average Score
    const avgScore =
      studentSubmissions.length > 0
        ? Math.round(
            studentSubmissions.reduce((acc, cur) => acc + (cur.score || 0), 0) /
              studentSubmissions.length
          )
        : 0;

    // Highest score
    const highestScore =
      studentSubmissions.length > 0
        ? Math.max(...studentSubmissions.map((s) => s.score || 0))
        : 0;

    // Completion percentage
    const completionPercentage =
      totalTasks > 0 ? Math.min(100, Math.round((completedCount / totalTasks) * 100)) : 0;

    let state: "no_class" | "remedial_needed" | "pending_tasks" | "all_completed_success" | "no_tasks_yet";
    let badgeText = "AI Lab Mentor";
    let badgeColor = "bg-[#38BDF8]";
    let cardAccent = "border-slate-900 bg-[#FFE4E6]";
    let headline = "";
    let message = "";
    let motivationalQuote = "";
    let actionLabel = "";
    let actionIcon: any = Play;
    let onActionClick = () => {};

    if (totalClasses === 0) {
      state = "no_class";
      badgeText = "Perlu Kode Kelas";
      badgeColor = "bg-[#FB923C]";
      cardAccent = "border-slate-900 bg-[#FEF9C3]";
      headline = "Belum Terdaftar di Ruang Kelas";
      message =
        "Halo " +
        currentUser.name +
        "! Kamu belum tergabung ke kelas praktikum mana pun. Masukkan 6 digit Kode PIN kelas dari gurumu pada kotak di bawah untuk mengakses tugas dan kuis eksperimen 3D terstruktur.";
      motivationalQuote =
        "Sembari menunggu gurumu memberikan PIN kelas, kamu bisa langsung mencoba mencampur bahan kimia mandiri di Meja Sandbox 3D!";
      actionLabel = "Buka Meja Sandbox 3D";
      actionIcon = FlaskConical;
      onActionClick = () => router.push("/lab?mode=sandbox");
    } else if (remedialSubmissions.length > 0) {
      state = "remedial_needed";
      badgeText = `${remedialSubmissions.length} Tugas Perlu Remedial`;
      badgeColor = "bg-[#FB7185]";
      cardAccent = "border-slate-900 bg-[#FFE4E6]";

      const lowestSub = remedialSubmissions[0];
      const lowestTask = allStudentTasks.find((t) => String(t.id) === String(lowestSub.taskId));
      const taskTitle = lowestTask?.title || lowestSub.taskTitle || "Praktikum Kimia";
      const targetKkm = lowestSub.kkmScore || 75;

      headline = "Peluang Memperbaiki Nilai Terbuka!";
      message =
        "Tetap semangat, " +
        currentUser.name +
        "! Nilaimu pada tugas '" +
        taskTitle +
        "' adalah " +
        lowestSub.score +
        "/100 (KKM: " +
        targetKkm +
        "). Dalam sains kimia, percobaan yang belum maksimal adalah peluang emas untuk menemukan konsep yang tepat!";
      motivationalQuote =
        "Ulangi simulasi reaksi di meja lab 3D virtualmu dan perbaiki skormu hingga melampaui KKM sekarang!";

      actionLabel = "Perbaiki Nilai '" + (taskTitle.length > 20 ? taskTitle.slice(0, 18) + "..." : taskTitle) + "' ->";
      actionIcon = RotateCcw;
      onActionClick = () => {
        if (lowestTask) {
          const cls = classrooms.find(
            (c) => c.id === lowestTask.classroomId || c.classCode === lowestTask.roomCode
          );
          if (cls) setActiveClassroom(cls);
          setSelectedTaskForDetail(lowestTask);
        } else {
          router.push("/lab?mode=sandbox");
        }
      };
    } else if (pendingTasks.length > 0) {
      state = "pending_tasks";
      badgeText = `${pendingTasks.length} Misi Praktikum Menanti`;
      badgeColor = "bg-[#FACC15]";
      cardAccent = "border-slate-900 bg-[#FEF08A]/60";

      const nextTask = pendingTasks[0];
      const cls = classrooms.find(
        (c) => c.id === nextTask.classroomId || c.classCode === nextTask.roomCode
      );

      headline = "Ada Misi Praktikum Baru dari Gurumu!";
      message =
        "Halo " +
        currentUser.name +
        ", kamu memiliki " +
        pendingTasks.length +
        " praktikum yang siap diuji. Misi terdekat: '" +
        nextTask.title +
        "' di kelas " +
        (cls?.name || nextTask.roomCode) +
        ".";
      motivationalQuote =
        "Siapkan sarung tangan lab virtualmu, cermati setiap perubahan warna dan suhu reaksi, lalu tuntaskan kuis evaluasinya!";

      actionLabel = "Mulai Kerjakan Misi Praktikum ->";
      actionIcon = Zap;
      onActionClick = () => {
        if (cls) setActiveClassroom(cls);
        setSelectedTaskForDetail(nextTask);
      };
    } else if (totalTasks > 0 && pendingTasks.length === 0) {
      state = "all_completed_success";
      badgeText = "Seluruh Praktikum Tuntas!";
      badgeColor = "bg-[#34D399]";
      cardAccent = "border-slate-900 bg-[#DCFCE7]";

      headline = "Luar Biasa! Semua Tugas Praktikum Selesai";
      message =
        "Hebat sekali, " +
        currentUser.name +
        "! Seluruh " +
        totalTasks +
        " misi praktikum kimia telah kamu selesaikan dengan hasil memuaskan (Rata-rata: " +
        avgScore +
        "/100, Skor Puncak: " +
        highestScore +
        ").";
      motivationalQuote =
        "Pemahaman konsep reaksi dan stoikiometrimu sangat solid. Mau meracik kombinasi zat kimia unik sesukamu? Meja Sandbox 3D selalu siap!";

      actionLabel = "Eksplorasi Bebas di Sandbox 3D";
      actionIcon = Sparkles;
      onActionClick = () => router.push("/lab?mode=sandbox");
    } else {
      state = "no_tasks_yet";
      badgeText = "Kelas Terhubung";
      badgeColor = "bg-[#38BDF8]";
      cardAccent = "border-slate-900 bg-[#E0F2FE]";

      const firstClass = classrooms[0];
      headline = "Siap untuk Eksperimen Berikutnya!";
      message =
        "Kamu sudah terhubung di kelas " +
        firstClass.name +
        " bersama " +
        firstClass.teacherName +
        ". Gurumu sedang menyusun modul eksperimen terbaru.";
      motivationalQuote =
        "Sembari menunggu instruksi guru, latih kemampuanmu mencampur larutan dan instrumen lab di Meja Sandbox 3D!";

      actionLabel = "Uji Meja Sandbox 3D Bebas";
      actionIcon = FlaskConical;
      onActionClick = () => router.push("/lab?mode=sandbox");
    }

    return {
      state,
      badgeText,
      badgeColor,
      cardAccent,
      headline,
      message,
      motivationalQuote,
      actionLabel,
      actionIcon,
      onActionClick,
      totalClasses,
      totalTasks,
      completedCount,
      pendingCount: pendingTasks.length,
      remedialCount: remedialSubmissions.length,
      avgScore,
      highestScore,
      completionPercentage,
    };
  }, [currentUser, classrooms, allStudentTasks, studentSubmissions, router]);

  return (
    <div className="min-h-screen w-full pop-grid text-slate-900 flex flex-col font-sans select-none antialiased">
      {/* =========================================================================
          TOP NAVBAR (POP-BAUHAUS STUDIO HEADER)
          ========================================================================= */}
      <header className="h-16 border-b-2 border-slate-900 bg-[#FFFDF7]/95 backdrop-blur-sm px-4 sm:px-8 flex items-center justify-between shrink-0 z-20 sticky top-0">
        <button
          type="button"
          onClick={() => setActiveClassroom(null)}
          className="flex items-center gap-3 text-left group cursor-pointer"
        >
          <div className="w-10 h-10 rounded-xl bg-[#FACC15] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center text-slate-900 group-hover:-translate-y-0.5 transition-transform">
            <FlaskConical className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-display font-bold text-slate-900 tracking-tight">
                CupLabs <span className="text-[#2563EB]">Studio</span>
              </h1>
              <span className="text-[10px] bg-[#34D399] text-slate-900 border-2 border-slate-900 px-2 py-0.5 rounded-full font-black uppercase">
                LAB 3D
              </span>
            </div>
            <p className="text-[11px] text-slate-600 font-medium hidden sm:block">
              Laboratorium Sains Virtual Interaktif SMP &amp; SMA
            </p>
          </div>
        </button>

        {/* Right Navigation Controls */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          <Link
            href="/lab?mode=sandbox"
            className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-2"
          >
            <FlaskConical className="w-4 h-4" />
            <span className="hidden sm:inline">Meja Lab Bebas (Sandbox)</span>
            <span className="sm:hidden">Lab 3D</span>
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-3 py-1">
              <div
                className={`w-7 h-7 rounded-lg border-2 border-slate-900 flex items-center justify-center font-black text-xs ${
                  isTeacher ? "bg-[#FACC15] text-slate-900" : "bg-[#38BDF8] text-slate-900"
                }`}
              >
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <div className="text-xs font-extrabold text-slate-900 max-w-[140px] truncate leading-tight">
                  {currentUser.name}
                </div>
                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-wide">
                  {isTeacher ? "Guru Pengampu" : "Siswa Praktikan"}
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Keluar / Ganti Akun"
                className="p-1.5 text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors ml-0.5 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("login");
                  setIsAuthModalOpen(true);
                }}
                className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthModalMode("register");
                  setIsAuthModalOpen(true);
                }}
                className="pop-btn bg-[#38BDF8] hover:bg-[#7dd3fc] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5 transition-transform duration-150 hover:-translate-y-0.5 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-slate-900" />
                <span>Daftar</span>
              </button>
            </div>
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
        {isAuthLoading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3 animate-in fade-in">
            <div className="w-10 h-10 rounded-2xl bg-[#FACC15] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] flex items-center justify-center animate-bounce">
              <FlaskConical className="w-5 h-5 text-slate-900" />
            </div>
            <p className="text-xs font-bold text-slate-600">Memuat dashboard...</p>
          </div>
        ) : isTeacher ? (
          <div className="space-y-6 animate-in fade-in">
            {activeClassroom ? (
              <div className="space-y-6">
                {/* Classroom Navigation Header */}
                <div className="pop-card rounded-3xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setActiveClassroom(null);
                        setClassroomTab("tasks");
                      }}
                      className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Semua Kelas</span>
                    </button>

                    <div className="flex flex-wrap items-center gap-2">
                      <div className="bg-[#FEF08A] px-3 py-1.5 rounded-xl border-2 border-slate-900 flex items-center gap-2">
                        <span className="text-[10px] text-slate-800 font-black uppercase">KODE KELAS:</span>
                        <span className="font-mono font-black text-sm text-slate-900 tracking-wider">
                          {activeClassroom.classCode}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyCode(activeClassroom.classCode)}
                          className="text-slate-700 hover:text-slate-900 p-1 cursor-pointer"
                          title="Salin Kode Kelas"
                        >
                          {copiedCode === activeClassroom.classCode ? (
                            <Check className="w-3.5 h-3.5 text-emerald-700" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>

                      <Link
                        href={`/lab?classCode=${activeClassroom.classCode}&mode=sandbox`}
                        className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        <span>Meja Sandbox Kelas</span>
                      </Link>
                    </div>
                  </div>

                  <div className="border-t-2 border-slate-900/10 pt-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-[#38BDF8] text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                          {activeClassroom.gradeLevel}
                        </span>
                        <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                          {activeClassroom.name}
                        </h2>
                      </div>
                      <p className="text-xs text-slate-600 mt-1">
                        {activeClassroom.description || "Ruang kelas praktikum sains interaktif."}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                      <span className="bg-slate-100 px-3 py-1.5 rounded-xl border-2 border-slate-900 flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                        <span>{classroomMembers.length} Siswa</span>
                      </span>
                      <span className="bg-slate-100 px-3 py-1.5 rounded-xl border-2 border-slate-900 flex items-center gap-1.5">
                        <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{classroomTasks.length} Tugas</span>
                      </span>
                    </div>
                  </div>

                  {/* Classroom Sub-Tabs */}
                  <div className="flex flex-wrap items-center gap-2 border-t-2 border-slate-900/10 pt-3">
                    <button
                      type="button"
                      onClick={() => setClassroomTab("tasks")}
                      className={`pop-btn px-4 py-2 rounded-xl text-xs gap-2 ${
                        classroomTab === "tasks" || classroomTab === "builder"
                          ? "bg-[#38BDF8] text-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <ClipboardList className="w-4 h-4" />
                      <span>Tugas Praktikum ({classroomTasks.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassroomTab("members")}
                      className={`pop-btn px-4 py-2 rounded-xl text-xs gap-2 ${
                        classroomTab === "members"
                          ? "bg-[#38BDF8] text-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-100"
                      }`}
                    >
                      <Users className="w-4 h-4" />
                      <span>Siswa Anggota ({classroomMembers.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setClassroomTab("submissions")}
                      className={`pop-btn px-4 py-2 rounded-xl text-xs gap-2 ${
                        classroomTab === "submissions"
                          ? "bg-[#38BDF8] text-slate-900"
                          : "bg-white text-slate-700 hover:bg-slate-100"
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
                      classroomId={activeClassroom.id}
                      roomCode={activeClassroom.classCode}
                      teacherName={currentUser?.name || "Budi Santoso, S.Pd"}
                      tasks={classroomTasks}
                      taskToEdit={taskToEdit}
                      onTaskCreated={() => {
                        setTaskToEdit(null);
                        fetch(`/api/lab/tasks?roomCode=${activeClassroom.classCode}`)
                          .then((r) => r.json())
                          .then((d) => {
                            if (d.tasks) setClassroomTasks(d.tasks);
                          });
                        setClassroomTab("tasks");
                      }}
                      onCancel={() => {
                        setTaskToEdit(null);
                        setClassroomTab("tasks");
                      }}
                    />
                  </div>
                ) : classroomTab === "tasks" ? (
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-slate-600">
                        Daftar tugas praktikum aktif di kelas{" "}
                        <strong className="text-slate-900">{activeClassroom.name}</strong>
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setTaskToEdit(null);
                          setClassroomTab("builder");
                        }}
                        className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-4 py-2 text-xs rounded-xl gap-2"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Rancang Tugas Baru</span>
                      </button>
                    </div>

                    {isLoadingTasks ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-bold">
                        Memuat tugas praktikum...
                      </div>
                    ) : classroomTasks.length === 0 ? (
                      <div className="pop-card rounded-3xl p-8 text-center space-y-4">
                        <ClipboardList className="w-10 h-10 text-slate-400 mx-auto" />
                        <div className="space-y-1">
                          <p className="font-display font-bold text-base text-slate-900">
                            Belum Ada Tugas di Kelas Ini
                          </p>
                          <p className="text-xs text-slate-600 max-w-md mx-auto">
                            Rancang tugas praktikum pertama menggunakan Mode Analisis RPP AI atau Kustom Mandiri.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setTaskToEdit(null);
                            setClassroomTab("builder");
                          }}
                          className="pop-btn bg-[#FACC15] text-slate-900 px-5 py-2.5 text-xs rounded-xl gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Rancang Tugas Pertama</span>
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        {classroomTasks.map((task) => (
                          <div
                            key={task.id}
                            className="pop-card pop-card-interactive rounded-2xl p-5 space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black bg-[#38BDF8] text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md uppercase">
                                  {task.gradeLevel}
                                </span>
                                <span className="text-[11px] font-mono font-bold text-slate-600">
                                  PIN {task.roomCode}
                                </span>
                              </div>

                              <h4 className="font-display font-bold text-base text-slate-900">{task.title}</h4>
                              <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                                {task.instructions}
                              </p>

                              <div className="flex flex-wrap items-center gap-2 text-[11px] pt-2 border-t-2 border-slate-900/10">
                                <span className="font-bold bg-[#A7F3D0] text-slate-900 border border-slate-900 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <FlaskConical className="w-3 h-3" />
                                  <span>{task.chemicalIds?.length || 0} Reagen</span>
                                </span>
                                <span className="font-bold bg-[#FEF08A] text-slate-900 border border-slate-900 px-2 py-0.5 rounded-lg flex items-center gap-1">
                                  <Award className="w-3 h-3" />
                                  <span>{task.questions?.length || 0} Soal Kuis</span>
                                </span>
                                <span className="font-bold bg-slate-100 text-slate-900 border border-slate-900 px-2 py-0.5 rounded-lg">
                                  KKM {task.kkmScore ?? 75}
                                </span>
                                <span
                                  className={`font-bold px-2 py-0.5 rounded-lg border border-slate-900 ${
                                    task.allowRetakeBelowKkm !== false
                                      ? "bg-[#BAE6FD] text-slate-900"
                                      : "bg-[#FFE4E6] text-slate-900"
                                  }`}
                                >
                                  {task.allowRetakeBelowKkm !== false ? "Remedial Aktif" : "1x Selesai"}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setTaskToEdit(task);
                                  setClassroomTab("builder");
                                }}
                                className="pop-btn bg-[#FEF08A] text-slate-900 px-3 py-2 text-xs rounded-xl gap-1.5"
                              >
                                <Pencil className="w-3.5 h-3.5" />
                                <span>Edit</span>
                              </button>

                              <Link
                                href={`/lab?taskId=${task.id}&mode=sandbox`}
                                className="pop-btn flex-1 py-2 bg-[#34D399] text-slate-900 text-xs rounded-xl gap-1.5"
                              >
                                <Play className="w-3.5 h-3.5" />
                                <span>Uji di Lab 3D</span>
                              </Link>

                              <button
                                type="button"
                                onClick={() => handleDeleteTask(task.id)}
                                className="pop-btn p-2 bg-[#FB7185] text-white rounded-xl"
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
                  <div className="space-y-4">
                    <div className="pop-card rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-900">Siswa Anggota Kelas</h4>
                        <p className="text-xs text-slate-600">
                          Bagikan Kode Kelas{" "}
                          <strong className="font-mono bg-[#FEF08A] px-1.5 py-0.5 rounded border border-slate-900">
                            {activeClassroom.classCode}
                          </strong>{" "}
                          kepada murid untuk bergabung.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopyCode(activeClassroom.classCode)}
                        className="pop-btn bg-white text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Kode Kelas</span>
                      </button>
                    </div>

                    {isLoadingMembers ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-bold">Memuat siswa...</div>
                    ) : classroomMembers.length === 0 ? (
                      <div className="pop-card rounded-2xl p-8 text-center space-y-2">
                        <Users className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          Belum ada siswa yang bergabung di kelas ini.
                        </p>
                      </div>
                    ) : (
                      <div className="pop-card rounded-2xl overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#FEF08A] text-slate-900 text-[10px] uppercase font-black border-b-2 border-slate-900">
                            <tr>
                              <th className="px-4 py-3">Nama Siswa</th>
                              <th className="px-4 py-3">Username</th>
                              <th className="px-4 py-3">Status</th>
                              <th className="px-4 py-3">Bergabung</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y-2 divide-slate-900/10">
                            {classroomMembers.map((m) => (
                              <tr key={m.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-[#38BDF8] border border-slate-900 text-slate-900 flex items-center justify-center font-black text-[11px]">
                                    {m.studentName?.charAt(0) || "S"}
                                  </div>
                                  <span>{m.studentName}</span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 font-mono">{m.studentUsername}</td>
                                <td className="px-4 py-3">
                                  <span className="text-slate-900 font-black text-[10px] bg-[#A7F3D0] border border-slate-900 px-2 py-0.5 rounded-md">
                                    AKTIF
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-slate-600 text-[11px]">
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
                  <div className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <h4 className="font-display font-bold text-sm text-slate-900">
                          Rekap Nilai Siswa Kelas {activeClassroom.name}
                        </h4>
                        <p className="text-xs text-slate-600">
                          Pilih tugas praktikum untuk memfilter nilai spesifik per tugas.
                        </p>
                      </div>

                      {classroomTasks.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-700">Pilih Tugas:</span>
                          <select
                            value={selectedClassroomTaskId || "ALL"}
                            onChange={(e) =>
                              setSelectedClassroomTaskId(e.target.value === "ALL" ? null : e.target.value)
                            }
                            className="text-xs font-bold bg-white border-2 border-slate-900 rounded-xl px-3 py-1.5 text-slate-900 outline-none"
                          >
                            <option value="ALL">Semua Tugas Praktikum</option>
                            {classroomTasks.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title} (PIN {t.roomCode})
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>

                    {isLoadingSubmissions ? (
                      <div className="text-center py-12 text-slate-500 text-xs font-bold">Memuat nilai...</div>
                    ) : classroomTasks.length === 0 ? (
                      <div className="pop-card rounded-2xl p-8 text-center space-y-2">
                        <Award className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-700">
                          Belum ada tugas praktikum di kelas ini.
                        </p>
                        <p className="text-[11px] text-slate-500">
                          Buat tugas praktikum terlebih dahulu agar siswa dapat mengumpulkan laporan & kuis praktikum.
                        </p>
                      </div>
                    ) : classroomSubmissions.length === 0 ? (
                      <div className="pop-card rounded-2xl p-8 text-center space-y-2">
                        <Award className="w-8 h-8 text-slate-400 mx-auto" />
                        <p className="text-xs font-bold text-slate-600">
                          Belum ada siswa yang mengumpulkan kuis praktikum untuk kelas ini.
                        </p>
                      </div>
                    ) : (
                      (() => {
                        const filteredList = classroomSubmissions.filter((s) => {
                          // Pastikan pengumpulan benar-benar terkait tugas di kelas aktif
                          const belongsToThisClass = classroomTasks.some(
                            (t) => String(t.id) === String(s.taskId) || (t.roomCode && String(t.roomCode) === String(s.roomCode))
                          );
                          if (!belongsToThisClass) return false;

                          if (!selectedClassroomTaskId) return true;
                          return String(s.taskId) === String(selectedClassroomTaskId);
                        });

                        return filteredList.length === 0 ? (
                          <div className="pop-card rounded-2xl p-8 text-center text-slate-500 text-xs font-bold">
                            Belum ada pengumpulan untuk tugas praktikum ini.
                          </div>
                        ) : (
                          <div className="pop-card rounded-2xl overflow-hidden">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-[#BAE6FD] text-slate-900 text-[10px] uppercase font-black border-b-2 border-slate-900">
                                <tr>
                                  <th className="px-4 py-3">Nama Siswa</th>
                                  <th className="px-4 py-3">Reaksi 3D</th>
                                  <th className="px-4 py-3">Skor Kuis</th>
                                  <th className="px-4 py-3">Laporan Analisis</th>
                                  <th className="px-4 py-3">Waktu</th>
                                  <th className="px-4 py-3 text-right">Detail</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y-2 divide-slate-900/10">
                                {filteredList.map((s) => (
                                  <tr key={s.id} className="hover:bg-slate-50">
                                    <td className="px-4 py-3 font-bold text-slate-900">{s.studentName}</td>
                                    <td className="px-4 py-3">
                                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                                        <CheckCircle2 className="w-3.5 h-3.5" />
                                        <span>Sukses</span>
                                      </span>
                                    </td>
                                    <td className="px-4 py-3">
                                      <span
                                        className={`font-black px-2 py-0.5 rounded-lg border border-slate-900 text-[11px] ${
                                          s.score >= 80
                                            ? "bg-[#A7F3D0] text-slate-900"
                                            : "bg-[#FEF08A] text-slate-900"
                                        }`}
                                      >
                                        {s.score}/100
                                      </span>
                                    </td>
                                    <td className="px-4 py-3 text-slate-600 max-w-xs truncate">{s.aiAnalysis}</td>
                                    <td className="px-4 py-3 text-slate-500 text-[11px]">
                                      {s.completedAt ? new Date(s.completedAt).toLocaleTimeString("id-ID") : "-"}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                      <button
                                        type="button"
                                        onClick={() => setSelectedSubmission(s)}
                                        className="pop-btn px-3 py-1 bg-[#FEF08A] text-slate-900 rounded-lg text-xs gap-1"
                                      >
                                        <Eye className="w-3.5 h-3.5" />
                                        <span>Detail</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()
                    )}

                    <StudentSubmissionDetailModal
                      submission={selectedSubmission}
                      isTeacherView={true}
                      task={
                        classroomTasks.find((t) => String(t.id) === String(selectedSubmission?.taskId)) ||
                        classroomTasks.find(
                          (t) =>
                            t.roomCode &&
                            selectedSubmission?.roomCode &&
                            String(t.roomCode) === String(selectedSubmission.roomCode)
                        ) ||
                        (selectedClassroomTaskId
                          ? classroomTasks.find((t) => String(t.id) === String(selectedClassroomTaskId))
                          : null)
                      }
                      onClose={() => setSelectedSubmission(null)}
                    />
                  </div>
                )}
              </div>
            ) : (
              /* All Classrooms View for Teacher */
              <div className="space-y-6">
                <div className="pop-card rounded-3xl p-6 sm:p-8 bg-[#FEF9C3] relative overflow-hidden">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="max-w-2xl space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase bg-[#FACC15] text-slate-900 border-2 border-slate-900 px-3 py-0.5 rounded-full">
                          PORTAL GURU PENGAMPU
                        </span>
                        <span className="text-xs font-extrabold text-emerald-800">
                          Sistem Aktif
                        </span>
                      </div>

                      <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
                        Selamat Datang, {currentUser.name}
                      </h2>

                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-medium">
                        Kelola ruang kelas praktikum sains, buat tugas terstruktur dengan bantuan AI, dan uji coba eksperimen 3D sebelum dibagikan ke siswa.
                      </p>

                      <div className="flex flex-wrap items-center gap-3 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreateClassModalOpen(true)}
                          className="pop-btn bg-[#38BDF8] text-slate-900 px-5 py-2.5 text-xs rounded-xl gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Buat Ruang Kelas Baru</span>
                        </button>

                        <Link
                          href="/lab?mode=sandbox"
                          className="pop-btn bg-[#34D399] text-slate-900 px-5 py-2.5 text-xs rounded-xl gap-2"
                        >
                          <FlaskConical className="w-4 h-4" />
                          <span>Buka Meja Lab 3D</span>
                        </Link>
                      </div>
                    </div>

                    <div className="hidden lg:flex items-center justify-center w-36 h-36 rounded-3xl bg-[#38BDF8] border-2 border-slate-900 shadow-[5px_5px_0px_#0f172a] shrink-0">
                      <Atom className="w-16 h-16 text-slate-900" />
                    </div>
                  </div>
                </div>

                {/* Classrooms Grid Section */}
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                        <School className="w-5 h-5 text-[#2563EB]" />
                        <span>Daftar Ruang Kelas ({classrooms.length})</span>
                      </h3>
                      <p className="text-xs text-slate-600">
                        Pilih ruang kelas untuk mengelola tugas praktikum, murid, dan rekap nilai.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsCreateClassModalOpen(true)}
                      className="pop-btn bg-[#FACC15] text-slate-900 px-4 py-2 text-xs rounded-xl gap-1.5"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Buat Kelas</span>
                    </button>
                  </div>

                  {isLoadingClassrooms ? (
                    <div className="text-center py-16 text-slate-500 text-xs font-bold">
                      Memuat ruang kelas...
                    </div>
                  ) : classrooms.length === 0 ? (
                    <div className="pop-card rounded-3xl p-10 text-center space-y-4">
                      <School className="w-12 h-12 text-slate-400 mx-auto" />
                      <div className="space-y-1">
                        <p className="font-display font-bold text-base text-slate-900">Belum Ada Ruang Kelas</p>
                        <p className="text-xs text-slate-600">
                          Buat kelas pertama untuk mulai menugaskan praktikum 3D kepada siswa.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsCreateClassModalOpen(true)}
                        className="pop-btn bg-[#FACC15] text-slate-900 px-5 py-2.5 text-xs rounded-xl"
                      >
                        Buat Ruang Kelas Pertama
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {classrooms.map((cls, idx) => {
                        const palette = classroomAccentPalette[idx % classroomAccentPalette.length];
                        return (
                          <div
                            key={cls.id}
                            onClick={() => {
                              setActiveClassroom(cls);
                              setClassroomTab("tasks");
                            }}
                            className="pop-card pop-card-interactive rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                          >
                            <div className={`${palette.bg} px-5 py-3 border-b-2 border-slate-900 flex items-center justify-between`}>
                              <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                                {cls.gradeLevel}
                              </span>
                              <div
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCopyCode(cls.classCode);
                                }}
                                className="bg-white px-2.5 py-0.5 rounded-lg border border-slate-900 text-xs font-mono font-black text-slate-900 flex items-center gap-1.5"
                                title="Klik untuk salin kode kelas"
                              >
                                <span>PIN {cls.classCode}</span>
                                {copiedCode === cls.classCode ? (
                                  <Check className="w-3 h-3 text-emerald-600" />
                                ) : (
                                  <Copy className="w-3 h-3 text-slate-500" />
                                )}
                              </div>
                            </div>

                            <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                              <div>
                                <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-[#2563EB] transition-colors line-clamp-1">
                                  {cls.name}
                                </h4>
                                <p className="text-xs text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                                  {cls.description || "Ruang kelas praktikum sains interaktif."}
                                </p>
                              </div>

                              <div className="space-y-3 pt-3 border-t-2 border-slate-900/10">
                                <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                                  <span className="flex items-center gap-1.5">
                                    <Users className="w-3.5 h-3.5 text-[#2563EB]" />
                                    {cls.studentCount || 0} Siswa
                                  </span>
                                  <span className="flex items-center gap-1.5">
                                    <ClipboardList className="w-3.5 h-3.5 text-emerald-700" />
                                    {cls.taskCount || 0} Tugas
                                  </span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    type="button"
                                    className="pop-btn flex-1 py-2 bg-[#38BDF8] text-slate-900 text-xs rounded-xl gap-1.5"
                                  >
                                    <span>Buka Kelas</span>
                                    <ChevronRight className="w-3.5 h-3.5" />
                                  </button>

                                  <button
                                    type="button"
                                    onClick={(e) => handleDeleteClassroom(cls.id, e)}
                                    className="pop-btn p-2 bg-[#FB7185] text-white rounded-xl"
                                    title="Hapus Kelas"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : isStudent ? (
          /* =====================================================================
             VIEW 2: STUDENT DASHBOARD -> BUKA KELAS -> PILIH TUGAS -> MODAL DETAIL -> PROCEED TO LAB
             ===================================================================== */
          activeClassroom ? (
            <div className="space-y-6 animate-in fade-in">
              {/* Student Inside Active Classroom Header */}
              <div className="pop-card rounded-3xl p-5 sm:p-6 bg-[#E0F2FE] space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setActiveClassroom(null);
                      setSelectedTaskForDetail(null);
                    }}
                    className="pop-btn bg-white hover:bg-slate-100 text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Kembali ke Dashboard</span>
                  </button>

                  <span className="bg-[#FACC15] px-3 py-1.5 rounded-xl border-2 border-slate-900 font-mono font-black text-xs text-slate-900">
                    PIN {activeClassroom.classCode}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t-2 border-slate-900/15">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2.5 py-0.5 rounded-md">
                        {activeClassroom.gradeLevel}
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        Guru: {activeClassroom.teacherName || "Guru Pengampu"}
                      </span>
                    </div>
                    <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
                      {activeClassroom.name}
                    </h2>
                    <p className="text-xs text-slate-700 mt-1">
                      {activeClassroom.description ||
                        "Pilih tugas praktikum di bawah untuk membaca instruksi, aturan KKM, dan mulai bereksperimen di Meja Lab 3D."}
                    </p>
                  </div>

                  <div className="bg-white border-2 border-slate-900 rounded-2xl px-4 py-2.5 text-center shrink-0">
                    <span className="text-[10px] font-black uppercase text-slate-500 block">
                      TUGAS TERSEDIA
                    </span>
                    <span className="text-xl font-mono font-black text-slate-900">
                      {effectiveClassroomTasks.length}
                    </span>
                  </div>
                </div>
              </div>

              {/* Tasks List Inside Classroom */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <ClipboardList className="w-5 h-5 text-[#2563EB]" />
                  <span>Pilih Tugas Praktikum</span>
                </h3>

                {isLoadingTasks ? (
                  <div className="pop-card rounded-3xl p-10 text-center text-xs font-bold text-slate-600">
                    Memuat daftar tugas dari guru...
                  </div>
                ) : effectiveClassroomTasks.length === 0 ? (
                  <div className="pop-card rounded-3xl p-10 text-center space-y-3 bg-white">
                    <FlaskConical className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-display font-bold text-base text-slate-900">
                      Belum Ada Tugas di Kelas Ini
                    </p>
                    <p className="text-xs text-slate-600 max-w-md mx-auto">
                      Gurumu belum menerbitkan tugas baru. Kamu bisa bereksperimen bebas di Meja Lab Sandbox sambil menunggu!
                    </p>
                    <Link
                      href="/lab?mode=sandbox"
                      className="pop-btn bg-[#34D399] text-slate-900 px-5 py-2.5 text-xs rounded-xl gap-2"
                    >
                      <FlaskConical className="w-4 h-4" />
                      <span>Coba Meja Sandbox 3D</span>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {effectiveClassroomTasks.map((task, idx) => {
                      const sub = studentSubmissions.find((s) => s.taskId === task.id);
                      const kkm = task.kkmScore ?? 75;
                      const isPassed = sub ? sub.score >= kkm : false;
                      const questionCount = task.questions?.length || 0;
                      const accent = classroomAccentPalette[idx % classroomAccentPalette.length];

                      return (
                        <div
                          key={task.id}
                          id={idx === 0 ? "tutorial-first-task" : undefined}
                          onClick={() => setSelectedTaskForDetail(task)}
                          className="pop-card pop-card-interactive rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                        >
                          <div className={`${accent.bg} px-5 py-3 border-b-2 border-slate-900 flex items-center justify-between gap-2`}>
                            <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                              {task.gradeLevel}
                            </span>

                            {sub ? (
                              <span
                                className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border border-slate-900 flex items-center gap-1 ${
                                  isPassed
                                    ? "bg-[#34D399] text-slate-900"
                                    : "bg-[#FB7185] text-white"
                                }`}
                              >
                                {isPassed ? <CheckCircle2 className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                                <span>
                                  {isPassed ? `Tuntas (${sub.score}/100)` : `Remedial (${sub.score}/100)`}
                                </span>
                              </span>
                            ) : (
                              <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2.5 py-0.5 rounded-full">
                                Siap Dikerjakan
                              </span>
                            )}
                          </div>

                          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-2">
                              <h4 className="font-display font-bold text-base sm:text-lg text-slate-900 group-hover:text-[#2563EB] transition-colors">
                                {task.title}
                              </h4>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {task.instructions}
                              </p>
                            </div>

                            <div className="space-y-3 pt-2 border-t-2 border-slate-900/10">
                              <div className="flex flex-wrap items-center gap-2 text-[11px] font-bold">
                                <span className="bg-slate-100 border border-slate-900 px-2 py-0.5 rounded-lg">
                                  {task.chemicalIds?.length || 0} Bahan Kimia
                                </span>
                                <span className="bg-[#FEF08A] border border-slate-900 px-2 py-0.5 rounded-lg">
                                  {questionCount > 0 ? `Ada Kuis (${questionCount} Soal)` : "Tanpa Kuis"}
                                </span>
                                <span className="bg-[#BAE6FD] border border-slate-900 px-2 py-0.5 rounded-lg">
                                  KKM {kkm}
                                </span>
                              </div>

                              <button
                                type="button"
                                id={idx === 0 ? "tutorial-task-detail-btn" : undefined}
                                className="pop-btn w-full py-2.5 bg-[#FACC15] group-hover:bg-[#fde047] text-slate-900 text-xs rounded-xl gap-2"
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>Lihat Detail Tugas &amp; Mulai</span>
                                <ArrowRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Student Main Dashboard (Before clicking a Classroom) */
            <div className="space-y-6 animate-in fade-in">
              {/* Student Hero Banner with Interactive AI Co-Pilot Mentor */}
              <div id="tutorial-student-hero" className="pop-card rounded-3xl p-6 sm:p-8 bg-white border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] relative overflow-hidden">
                <div className="flex flex-col lg:flex-row lg:items-stretch justify-between gap-6">
                  {/* Left Column: Greeting + Dynamic AI Companion Box */}
                  <div className="flex-1 space-y-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-black uppercase bg-[#FACC15] text-slate-900 border-2 border-slate-900 px-3 py-0.5 rounded-full shadow-[2px_2px_0px_#0f172a]">
                        ARENA SISWA PRAKTIKAN
                      </span>
                      {aiStudentInsights && (
                        <span
                          className={`text-xs font-extrabold text-slate-900 border-2 border-slate-900 px-3 py-0.5 rounded-full flex items-center gap-1.5 shadow-[2px_2px_0px_#0f172a] ${aiStudentInsights.badgeColor}`}
                        >
                          <span className="w-2 h-2 rounded-full bg-slate-900 animate-pulse" />
                          <span>{aiStudentInsights.badgeText}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h2 className="text-2xl sm:text-3xl font-display font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                        <span>Halo, {currentUser.name}!</span>
                      </h2>
                      <p className="text-xs text-slate-600 font-semibold mt-0.5">
                        Laboratorium Kimia Virtual 3D • Capcipcup SmartEdu
                      </p>
                    </div>

                    {/* DYNAMIC AI LAB COMPANION SPEECH BOX */}
                    {aiStudentInsights && (
                      <div
                        className={`rounded-2xl border-2 p-4 sm:p-5 relative transition-all ${aiStudentInsights.cardAccent}`}
                      >
                        <div className="flex items-center justify-between gap-2 pb-2 border-b-2 border-slate-900/10 mb-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-slate-900 text-[#FACC15] flex items-center justify-center">
                              <Bot className="w-3.5 h-3.5" />
                            </div>
                            <span className="text-[11px] font-black tracking-wider uppercase text-slate-900">
                              Asisten AI Praktikum
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => {
                              setCurrentAiTipIndex((prev) => (prev + 1) % CHEMISTRY_AI_TIPS.length);
                              setShowAiTipModal(true);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-black uppercase bg-white hover:bg-slate-50 text-slate-900 border border-slate-900 rounded-lg shadow-[2px_2px_0px_#0f172a] hover:translate-x-0.5 hover:translate-y-0.5 transition-all cursor-pointer"
                            title="Buka tips sains kimia interaktif"
                          >
                            <Lightbulb className="w-3 h-3 text-[#FACC15] fill-[#FACC15]" />
                            <span>Tips Sains AI</span>
                          </button>
                        </div>

                        <h4 className="text-sm font-display font-bold text-slate-900 flex items-center gap-2">
                          {aiStudentInsights.state === "remedial_needed" && (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                          {aiStudentInsights.state === "pending_tasks" && (
                            <Zap className="w-4 h-4 text-amber-600 shrink-0" />
                          )}
                          {aiStudentInsights.state === "all_completed_success" && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <span>{aiStudentInsights.headline}</span>
                        </h4>

                        <p className="text-xs text-slate-800 leading-relaxed font-medium mt-1">
                          {aiStudentInsights.message}
                        </p>

                        <div className="mt-2 pt-2 border-t border-slate-900/10 text-[11px] text-slate-600 italic font-medium flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3 text-slate-700 shrink-0" />
                          <span>{aiStudentInsights.motivationalQuote}</span>
                        </div>

                        {/* Interactive Direct Action Buttons */}
                        <div className="pt-3 flex flex-wrap items-center gap-2.5">
                          {aiStudentInsights.actionLabel && (
                            <button
                              type="button"
                              onClick={aiStudentInsights.onActionClick}
                              className={`pop-btn text-xs px-4 py-2 rounded-xl flex items-center gap-2 cursor-pointer ${
                                aiStudentInsights.state === "remedial_needed"
                                  ? "bg-[#FB7185] hover:bg-[#F43F5E] text-white"
                                  : aiStudentInsights.state === "pending_tasks"
                                  ? "bg-[#FACC15] hover:bg-[#EAB308] text-slate-900"
                                  : "bg-[#34D399] hover:bg-[#10B981] text-slate-900"
                              }`}
                            >
                              <aiStudentInsights.actionIcon className="w-3.5 h-3.5" />
                              <span>{aiStudentInsights.actionLabel}</span>
                            </button>
                          )}

                          <Link
                            href="/lab?mode=sandbox"
                            className="pop-btn bg-[#BAE6FD] hover:bg-[#7DD3FC] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5 flex items-center"
                          >
                            <FlaskConical className="w-3.5 h-3.5" />
                            <span>Meja Sandbox 3D</span>
                          </Link>

                          <button
                            type="button"
                            onClick={handleRestartStudentTutorial}
                            className="pop-btn bg-[#FEF08A] hover:bg-[#FDE047] text-slate-900 px-3.5 py-2 text-xs rounded-xl gap-1.5 flex items-center cursor-pointer"
                            title="Panduan Interaktif Siswa dari Prof. Cupcup"
                          >
                            <GraduationCap className="w-3.5 h-3.5 text-slate-900" />
                            <span>Tur Pemandu Lab</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Bauhaus Interactive Stats & Progress Bar */}
                  <div className="w-full lg:w-72 shrink-0 flex flex-col justify-between gap-3">
                    <div className="grid grid-cols-2 lg:grid-cols-1 gap-2.5">
                      {/* Stat 1: Kelas Aktif */}
                      <div className="bg-[#FEF08A] border-2 border-slate-900 rounded-2xl p-3 shadow-[3px_3px_0px_#0f172a] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
                          <School className="w-5 h-5 text-slate-900" />
                        </div>
                        <div>
                          <div className="text-xl font-mono font-black text-slate-900 leading-none">
                            {classrooms.length}
                          </div>
                          <div className="text-[10px] font-black uppercase text-slate-800 tracking-wide mt-0.5">
                            Kelas Terdaftar
                          </div>
                        </div>
                      </div>

                      {/* Stat 2: Misi Tuntas */}
                      <div className="bg-[#A7F3D0] border-2 border-slate-900 rounded-2xl p-3 shadow-[3px_3px_0px_#0f172a] flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
                          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <div className="text-xl font-mono font-black text-slate-900 leading-none">
                            {studentSubmissions.length}{" "}
                            <span className="text-xs font-bold text-slate-600">
                              / {allStudentTasks.length}
                            </span>
                          </div>
                          <div className="text-[10px] font-black uppercase text-slate-800 tracking-wide mt-0.5">
                            Misi Praktikum Tuntas
                          </div>
                        </div>
                      </div>

                      {/* Stat 3: Status Akademik / Remedial Indicator */}
                      <div
                        className={`col-span-2 lg:col-span-1 border-2 border-slate-900 rounded-2xl p-3 shadow-[3px_3px_0px_#0f172a] flex items-center gap-3 ${
                          aiStudentInsights && aiStudentInsights.remedialCount > 0
                            ? "bg-[#FFE4E6]"
                            : "bg-[#BAE6FD]"
                        }`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center shrink-0">
                          {aiStudentInsights && aiStudentInsights.remedialCount > 0 ? (
                            <RotateCcw className="w-5 h-5 text-rose-600 animate-spin-slow" />
                          ) : (
                            <Award className="w-5 h-5 text-sky-600" />
                          )}
                        </div>
                        <div>
                          <div className="text-lg font-mono font-black text-slate-900 leading-none">
                            {aiStudentInsights && aiStudentInsights.remedialCount > 0
                              ? `${aiStudentInsights.remedialCount} Remedial`
                              : `${aiStudentInsights?.avgScore || 0}/100`}
                          </div>
                          <div className="text-[10px] font-black uppercase text-slate-800 tracking-wide mt-0.5">
                            {aiStudentInsights && aiStudentInsights.remedialCount > 0
                              ? "Kesempatan Perbaikan"
                              : "Rata-Rata Skor Kuis"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar: Tingkat Penyelesaian Tugas */}
                    <div className="bg-[#FFFDF7] border-2 border-slate-900 rounded-2xl p-3 shadow-[3px_3px_0px_#0f172a] space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-extrabold text-slate-900">
                        <span className="flex items-center gap-1">
                          <Target className="w-3.5 h-3.5 text-slate-700" />
                          <span>Progress Praktikum</span>
                        </span>
                        <span className="font-mono">{aiStudentInsights?.completionPercentage || 0}%</span>
                      </div>
                      <div className="w-full h-3 bg-slate-100 rounded-full border-2 border-slate-900 overflow-hidden relative">
                        <div
                          className="h-full bg-[#34D399] transition-all duration-500 rounded-full"
                          style={{
                            width: `${aiStudentInsights?.completionPercentage || 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Join Classroom Card */}
              <div className="pop-card rounded-2xl p-5 bg-[#FEF9C3] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4" />
                      <span>Gabung ke Ruang Kelas Baru</span>
                    </h3>
                    <p className="text-xs text-slate-700 font-medium">
                      Masukkan Kode Kelas (PIN) yang diberikan gurumu untuk melihat daftar tugas praktikum.
                    </p>
                  </div>

                  <form onSubmit={handleJoinClassroom} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={joinClassCode}
                      onChange={(e) => setJoinClassCode(e.target.value.toUpperCase())}
                      placeholder="Contoh: LAB889"
                      className="px-4 py-2 bg-white border-2 border-slate-900 text-xs font-mono font-black text-slate-900 rounded-xl outline-none w-44 tracking-wider uppercase"
                    />
                    <button
                      type="submit"
                      disabled={isJoiningClass || !joinClassCode.trim()}
                      className="pop-btn px-5 py-2 bg-[#38BDF8] text-slate-900 text-xs rounded-xl gap-1.5"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>{isJoiningClass ? "Memproses..." : "Gabung Kelas"}</span>
                    </button>
                  </form>
                </div>

                {joinClassMsg && (
                  <div
                    className={`p-3 rounded-xl border-2 border-slate-900 text-xs font-bold flex items-center gap-2 ${
                      joinClassMsg.type === "success"
                        ? "bg-[#A7F3D0] text-slate-900"
                        : "bg-[#FFE4E6] text-slate-900"
                    }`}
                  >
                    {joinClassMsg.type === "success" ? (
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 shrink-0" />
                    )}
                    <span>{joinClassMsg.text}</span>
                  </div>
                )}
              </div>

              {/* Enrolled Classrooms Grid */}
              <div className="space-y-4">
                <h3 className="text-base sm:text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <School className="w-5 h-5 text-[#2563EB]" />
                  <span>Kelas yang Kamu Ikuti ({effectiveStudentClassrooms.length})</span>
                </h3>

                {isLoadingClassrooms ? (
                  <div className="pop-card rounded-2xl p-10 text-center text-slate-600 text-xs font-bold">
                    Memuat kelas...
                  </div>
                ) : effectiveStudentClassrooms.length === 0 ? (
                  <div className="pop-card rounded-3xl p-8 text-center space-y-2 bg-white">
                    <School className="w-10 h-10 text-slate-400 mx-auto" />
                    <p className="font-bold text-sm text-slate-900">Kamu belum bergabung ke kelas mana pun</p>
                    <p className="text-xs text-slate-600">
                      Masukkan kode kelas dari gurumu pada kolom di atas untuk membuka tugas.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {effectiveStudentClassrooms.map((cls, idx) => {
                      const palette = classroomAccentPalette[idx % classroomAccentPalette.length];
                      return (
                        <div
                          key={cls.id}
                          id={idx === 0 ? "tutorial-first-classroom" : undefined}
                          onClick={() => setActiveClassroom(cls)}
                          className="pop-card pop-card-interactive rounded-2xl overflow-hidden cursor-pointer flex flex-col justify-between group"
                        >
                          <div className={`${palette.bg} px-5 py-3 border-b-2 border-slate-900 flex items-center justify-between`}>
                            <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2 py-0.5 rounded-md">
                              {cls.gradeLevel}
                            </span>
                            <span className="text-xs font-mono font-black text-slate-900 bg-white px-2.5 py-0.5 rounded-lg border border-slate-900">
                              PIN {cls.classCode}
                            </span>
                          </div>

                          <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
                            <div className="space-y-1.5">
                              <h4 className="font-display font-bold text-base text-slate-900 group-hover:text-[#2563EB] transition-colors">
                                {cls.name}
                              </h4>
                              <p className="text-xs font-bold text-slate-700">
                                Pengampu: {cls.teacherName || "Guru Sains"}
                              </p>
                              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                                {cls.description || "Ruang praktikum sains interaktif 3D."}
                              </p>
                            </div>

                            <div className="pt-3 border-t-2 border-slate-900/10 flex items-center justify-between gap-2">
                              <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                                <ClipboardList className="w-3.5 h-3.5 text-[#2563EB]" />
                                <span>{cls.taskCount ?? 0} Tugas</span>
                              </span>

                              <button
                                type="button"
                                id={idx === 0 ? "tutorial-buka-kelas-btn" : undefined}
                                className="pop-btn px-4 py-2 bg-[#FACC15] group-hover:bg-[#fde047] text-slate-900 text-xs rounded-xl gap-1.5"
                              >
                                <span>Buka Kelas</span>
                                <ChevronRight className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
        ) : (
          /* =====================================================================
             VIEW 3: GUEST / UNREGISTERED USER CLEAN LANDING (POP-BAUHAUS)
             Tampilan utama bersih sebelum login dengan maskot animasi sinematik, sapaan live, dan tombol aksi
             ===================================================================== */
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-300 py-2 sm:py-6 relative">
            {/* Pop-Bauhaus Master Hero Card */}
            <div
              className={`pop-card rounded-3xl p-6 sm:p-10 bg-white border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] relative overflow-hidden transition-all duration-700 ${
                introStage === "rising" || introStage === "greeting"
                  ? "opacity-30 scale-[0.98] blur-[1px]"
                  : "opacity-100 scale-100 blur-none"
              }`}
            >
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
                {/* Left Column: Live Time Greeting, Text Intro, Speech Bubble & Animated CTAs */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Live Clock & Time of Day Greeting Badges */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div
                      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-slate-900 font-extrabold text-xs shadow-[2px_2px_0px_#0f172a] ${timeGreeting.badgeBg} ${timeGreeting.badgeText}`}
                    >
                      <timeGreeting.icon className="w-4 h-4 animate-pulse" />
                      <span suppressHydrationWarning>{timeGreeting.title}</span>
                    </div>

                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border-2 border-slate-900 bg-white text-slate-800 font-mono font-bold text-xs shadow-[2px_2px_0px_#0f172a]">
                      <Clock className="w-3.5 h-3.5 text-slate-600" />
                      <span suppressHydrationWarning>{timeGreeting.timeString} WIB</span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border-2 border-slate-900 bg-[#E0F2FE] text-sky-950 font-extrabold text-xs shadow-[2px_2px_0px_#0f172a]">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                      <span>Lab Siap Praktik</span>
                    </div>
                  </div>

                  {/* Headline & Description */}
                  <div className="space-y-3">
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-display font-black text-slate-900 leading-[1.12] tracking-tight">
                      Laboratorium Sains 3D{" "}
                      <span className="inline-block bg-[#FACC15] px-3 py-0.5 rounded-2xl border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rotate-[-1deg]">
                        Capcipcup
                      </span>
                    </h1>
                    <p suppressHydrationWarning className="text-sm sm:text-base text-slate-700 leading-relaxed font-medium max-w-xl">
                      {timeGreeting.subtext} Bereksperimen dengan aman tanpa risiko ledakan zat kimia,
                      kendalikan tabung reaksi dengan kamera AI gestur tangan, atau selesaikan misi praktikum dari kelas gurumu.
                    </p>
                  </div>

                  {/* Mascot Speech Bubble (Live Text Greeting based on current hour) */}
                  <div className="relative bg-[#FFFDF7] border-2 border-slate-900 shadow-[4px_4px_0px_#0f172a] rounded-2xl p-4 max-w-xl">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#FACC15] border-2 border-slate-900 flex items-center justify-center shrink-0 shadow-[2px_2px_0px_#0f172a]">
                        <Bot className="w-5 h-5 text-slate-900" />
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                          <span suppressHydrationWarning>Pesan Sahabat Maskot Lab &bull; {timeGreeting.period}</span>
                        </div>
                        <p suppressHydrationWarning className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                          &ldquo;{timeGreeting.mascotQuote}&rdquo;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Animated Action Buttons (Login, Signup, Sandbox) */}
                  <div className="space-y-2 pt-1">
                    <div className="text-[11px] font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      <span>Mulai Petualangan Lab:</span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {/* Button 1: Masuk Akun */}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode("login");
                          setIsAuthModalOpen(true);
                        }}
                        className="pop-btn bg-[#FACC15] hover:bg-[#FDE047] text-slate-900 px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Masuk ke Akun</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>

                      {/* Button 2: Daftar Akun Baru */}
                      <button
                        type="button"
                        onClick={() => {
                          setAuthModalMode("register");
                          setIsAuthModalOpen(true);
                        }}
                        className="pop-btn bg-[#38BDF8] hover:bg-[#7DD3FC] text-slate-900 px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0px_#0f172a] cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-slate-900" />
                        <span>Daftar Akun Baru</span>
                      </button>

                      {/* Button 3: Coba Meja Sandbox 3D */}
                      <Link
                        href="/lab?mode=sandbox"
                        className="pop-btn bg-[#34D399] hover:bg-[#6EE7B7] text-slate-900 px-5 sm:px-6 py-3 rounded-2xl text-xs sm:text-sm font-black gap-2 transition-all duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_#0f172a] active:translate-y-0 active:shadow-[2px_2px_0px_#0f172a]"
                      >
                        <FlaskConical className="w-4 h-4" />
                        <span>Coba Meja Sandbox 3D</span>
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* Right Column: Animated Floating Mascot & Bauhaus Badges */}
                <div className="lg:col-span-5 flex flex-col items-center justify-center relative py-8 select-none">
                  {/* Orbital spinning ring in background */}
                  <div className="absolute w-64 h-64 sm:w-80 sm:h-80 rounded-full border-2 border-dashed border-slate-900/20 mascot-orbital pointer-events-none" />

                  {/* Soft Bauhaus decorative halo */}
                  <div className="absolute w-52 h-52 sm:w-72 sm:h-72 rounded-full bg-[#FEF08A]/45 blur-xl pointer-events-none" />

                  {/* Floating Mascot Image */}
                  <div className="relative z-10 mascot-floating flex flex-col items-center">
                    <img
                      src="/models/img/Gemini_Generated_Image_pnk3ggpnk3ggpnk3-removebg-preview.png"
                      alt="Capcipcup AI Science Mascot"
                      className="w-56 h-56 sm:w-72 sm:h-72 object-contain drop-shadow-[0_14px_24px_rgba(15,23,42,0.18)] pointer-events-none"
                    />
                  </div>

                  {/* Breathing dynamic shadow underneath */}
                  <div className="w-36 h-4 sm:w-48 sm:h-5 bg-slate-900/25 rounded-full blur-xs mascot-shadow-anim mt-1" />

                  {/* Floating Pop-Bauhaus Feature Badges around mascot */}
                  <div className="absolute top-4 left-0 sm:-left-3 bg-white border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 flex items-center gap-1.5 z-20">
                    <Atom className="w-4 h-4 text-[#2563EB]" />
                    <span>Fisika &amp; Kimia 3D</span>
                  </div>

                  <div className="absolute bottom-8 right-0 sm:-right-2 bg-[#FACC15] border-2 border-slate-900 shadow-[3px_3px_0px_#0f172a] rounded-xl px-3 py-1.5 text-xs font-black text-slate-900 flex items-center gap-1.5 z-20">
                    <Zap className="w-4 h-4 text-slate-900" />
                    <span>Kamera AI Tangan</span>
                  </div>
                </div>
              </div>
            </div>

            {/* =========================================================================
                CINEMATIC MASCOT ENTRANCE OVERLAY (SEBELUM LOGIN)
                Mascot muncul dari bawah tengah layar dengan latar menggelap, menyapa ramah, lalu bergeser ke kanan
                ========================================================================= */}
            {!currentUser && introStage !== "docked" && (
              <div
                onClick={handleProceedToDocked}
                className={`fixed inset-0 z-50 flex flex-col items-center justify-center p-4 transition-all duration-700 select-none ${
                  introStage === "sliding"
                    ? "bg-slate-900/0 backdrop-blur-none pointer-events-none"
                    : "bg-slate-900/70 backdrop-blur-[3px] cursor-pointer"
                }`}
              >
                {/* Controls on top right: Sound Indicator & Skip Button */}
                <div className="absolute top-6 right-6 z-20 flex items-center gap-2">
                  <div className="bg-white/95 border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] rounded-xl px-2.5 py-1 flex items-center gap-1.5 text-[11px] font-black text-slate-900">
                    <Volume2 className="w-3.5 h-3.5 text-amber-500 animate-pulse" />
                    <span className="hidden sm:inline">Intro Audio</span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleProceedToDocked();
                    }}
                    className="pop-btn bg-white/95 hover:bg-white text-slate-900 text-xs px-3.5 py-1.5 rounded-xl border-2 border-slate-900 shadow-[2px_2px_0px_#0f172a] gap-1.5 cursor-pointer"
                  >
                    <span>Lewati Intro</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Animated Mascot & Speech Container */}
                <div
                  className={`flex flex-col items-center max-w-lg w-full transition-all duration-700 ease-in-out ${
                    introStage === "rising"
                      ? "translate-y-[70vh] opacity-0 scale-75"
                      : introStage === "greeting"
                      ? "translate-y-0 translate-x-0 opacity-100 scale-100"
                      : /* introStage === 'sliding' */
                        "translate-y-0 translate-x-[26vw] lg:translate-x-[30vw] opacity-0 scale-90"
                  }`}
                >
                  {/* Mascot Center Stage with Glowing Aura */}
                  <div className="relative flex flex-col items-center">
                    {/* Soft Golden/Sky Aura Halo */}
                    <div className="absolute inset-0 bg-[#FEF08A]/40 rounded-full blur-2xl scale-125 pointer-events-none" />

                    <div className="relative z-10">
                      <img
                        src="/models/img/Gemini_Generated_Image_pnk3ggpnk3ggpnk3-removebg-preview.png"
                        alt="Maskot Lab Sains Capcipcup"
                        className={`w-60 h-60 sm:w-72 sm:h-72 object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.4)] pointer-events-none ${
                          introStage === "greeting" ? "mascot-floating" : ""
                        }`}
                      />
                    </div>

                    {/* Dynamic Breathing Shadow */}
                    <div className="w-40 h-4 bg-slate-950/45 rounded-full blur-xs mx-auto mt-2 mascot-shadow-anim" />
                  </div>

                  {/* Mascot Live Speech Bubble (Menyapa saat di tengah layar) */}
                  <div
                    className={`mt-4 sm:mt-6 w-full transition-all duration-500 ease-out ${
                      introStage === "greeting"
                        ? "opacity-100 translate-y-0 scale-100"
                        : "opacity-0 translate-y-6 scale-95 pointer-events-none"
                    }`}
                  >
                    <div className="pop-card bg-[#FFFDF7] border-2 border-slate-900 shadow-[6px_6px_0px_#0f172a] rounded-3xl p-5 sm:p-6 space-y-3.5 text-center relative">
                      {/* Speech bubble pointy arrow on top */}
                      <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-5 h-5 bg-[#FFFDF7] border-t-2 border-l-2 border-slate-900 rotate-45" />

                      {/* Time & Period Pill */}
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        <div
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-slate-900 font-black text-xs shadow-[2px_2px_0px_#0f172a] ${timeGreeting.badgeBg} ${timeGreeting.badgeText}`}
                        >
                          <timeGreeting.icon className="w-3.5 h-3.5 animate-pulse" />
                          <span suppressHydrationWarning>{timeGreeting.title}</span>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border-2 border-slate-900 bg-white text-slate-800 font-mono font-bold text-xs shadow-[2px_2px_0px_#0f172a]">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span suppressHydrationWarning>{timeGreeting.timeString} WIB</span>
                        </div>
                      </div>

                      {/* Greeting text */}
                      <div className="space-y-1">
                        <h2 className="font-display font-black text-lg sm:text-xl text-slate-900 flex items-center justify-center gap-1.5">
                          <span>Halo, Saintis Muda!</span>
                          <Sparkles className="w-5 h-5 text-amber-500" />
                        </h2>
                        <p suppressHydrationWarning className="text-xs sm:text-sm font-bold text-slate-800 leading-relaxed max-w-sm mx-auto">
                          &ldquo;{timeGreeting.mascotQuote}&rdquo;
                        </p>
                      </div>

                      {/* Interactive Proceed Button */}
                      <div className="pt-1 flex flex-col sm:flex-row items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleProceedToDocked();
                          }}
                          className="pop-btn bg-[#FACC15] hover:bg-[#FDE047] text-slate-900 px-6 py-2.5 text-xs font-black rounded-xl gap-2 shadow-[4px_4px_0px_#0f172a] transition-all hover:-translate-y-0.5 active:translate-y-0 active:shadow-[1px_1px_0px_#0f172a] cursor-pointer"
                        >
                          <span>Masuk ke Meja Lab</span>
                          <ArrowRight className="w-4 h-4" />
                        </button>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                          &bull; Sentuh layar untuk lanjut &bull;
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* =========================================================================
          MODAL DETAIL TUGAS SISWA (BRIEFING SEBELUM PROCEED TO LAB)
          ========================================================================= */}
      {isStudent && selectedTaskForDetail && activeClassroom && (() => {
        const task = selectedTaskForDetail;
        const sub = studentSubmissions.find((s) => s.taskId === task.id);
        const kkm = task.kkmScore ?? 75;
        const allowRemed = task.allowRetakeBelowKkm !== false;
        const hasQuiz = (task.questions?.length || 0) > 0;
        const isPassed = sub ? sub.score >= kkm : false;
        const rawIds = task.chemicalIds || [];
        const chemIds: string[] = Array.isArray(rawIds) ? rawIds : [];

        return (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-150">
            <div className="pop-card rounded-3xl w-full max-w-2xl overflow-hidden bg-[#FFFDF7] my-6 animate-in zoom-in-95 duration-200">
              {/* Top Color Header */}
              <div className="bg-[#FACC15] border-b-2 border-slate-900 px-6 py-4 flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-black uppercase bg-white text-slate-900 border border-slate-900 px-2.5 py-0.5 rounded-md">
                      DETAIL MISI PRAKTIKUM
                    </span>
                    <span className="text-[10px] font-black uppercase bg-[#38BDF8] text-slate-900 border border-slate-900 px-2.5 py-0.5 rounded-md">
                      {task.gradeLevel}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900">
                      PIN {activeClassroom.classCode}
                    </span>
                  </div>
                  <h3 className="text-lg sm:text-xl font-display font-bold text-slate-900">
                    {task.title}
                  </h3>
                  <p className="text-xs font-bold text-slate-800">
                    Guru Pengampu: {task.teacherName}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="w-8 h-8 rounded-xl bg-white border-2 border-slate-900 flex items-center justify-center text-slate-900 hover:bg-rose-100 cursor-pointer shrink-0"
                  title="Tutup"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
                {/* 3 Key Rules Cards: Quiz, KKM, Remedial */}
                <div id="tutorial-briefing-rules" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-[#BAE6FD] space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-800">
                      <Award className="w-3.5 h-3.5" />
                      <span>Kuis Evaluasi</span>
                    </div>
                    <div className="font-display font-bold text-sm text-slate-900">
                      {hasQuiz ? `Ada Kuis (${task.questions!.length} Soal)` : "Tanpa Kuis Tertulis"}
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">
                      {hasQuiz ? "Dikerjakan di tab baru setelah praktikum." : "Fokus pada pengamatan reaksi di meja."}
                    </p>
                  </div>

                  <div className="p-3.5 rounded-2xl border-2 border-slate-900 bg-[#A7F3D0] space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-800">
                      <Target className="w-3.5 h-3.5" />
                      <span>Batas Nilai KKM</span>
                    </div>
                    <div className="font-display font-bold text-sm text-slate-900">
                      Minimal {kkm} / 100
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">
                      Capai nilai KKM untuk menuntaskan misi.
                    </p>
                  </div>

                  <div
                    className={`p-3.5 rounded-2xl border-2 border-slate-900 space-y-1 ${
                      allowRemed ? "bg-[#FEF08A]" : "bg-[#FFE4E6]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] font-black uppercase text-slate-800">
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Kebijakan Remedial</span>
                    </div>
                    <div className="font-display font-bold text-sm text-slate-900">
                      {allowRemed ? "Remedial Diizinkan" : "Sekali Selesai"}
                    </div>
                    <p className="text-[11px] text-slate-700 font-medium">
                      {allowRemed
                        ? "Boleh mengulang jika nilai di bawah KKM."
                        : "Tidak ada pengulangan setelah dikumpulkan."}
                    </p>
                  </div>
                </div>

                {/* Instructions Box */}
                <div className="bg-white border-2 border-slate-900 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-black uppercase text-slate-800">
                    <BookOpen className="w-4 h-4 text-[#2563EB]" />
                    <span>Instruksi Praktikum</span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                    {task.instructions}
                  </p>
                </div>

                {/* Chemicals Prepared on Table */}
                <div className="space-y-2">
                  <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="w-4 h-4 text-emerald-700" />
                    <span>Bahan Kimia yang Akan Tersedia di Meja 3D ({chemIds.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {chemIds.map((cid, i) => {
                      const chem = CHEMICAL_CATALOG.find((c) => c.id === cid);
                      return (
                        <div
                          key={`${cid}_${i}`}
                          className="px-3 py-1.5 bg-white border-2 border-slate-900 rounded-xl text-xs font-bold flex items-center gap-2"
                        >
                          <span
                            className="w-3 h-3 rounded-full border border-slate-900 shrink-0"
                            style={{ backgroundColor: chem?.color || "#38bdf8" }}
                          />
                          <span className="font-mono text-slate-900">{chem?.formula || cid}</span>
                          {chem?.name && <span className="text-slate-600 font-medium">({chem.name})</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Existing Student Attempt Summary if already submitted */}
                {sub && (
                  <div
                    className={`p-4 rounded-2xl border-2 border-slate-900 flex flex-wrap items-center justify-between gap-3 ${
                      isPassed ? "bg-[#D1FAE5]" : "bg-[#FFE4E6]"
                    }`}
                  >
                    <div className="space-y-0.5">
                      <span className="text-[10px] font-black uppercase tracking-wide text-slate-700 block">
                        RIWAYAT PENGERJAAN KAMU
                      </span>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>Skor Terakhir: {sub.score}/100</span>
                        <span className="text-xs font-extrabold">
                          ({isPassed ? "Tuntas Lulus KKM" : "Belum Mencapai KKM"})
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedSubmission(sub)}
                        className="pop-btn bg-white text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Laporan</span>
                      </button>

                      {hasQuiz && (
                        <Link
                          href={`/quiz?taskId=${task.id}&classCode=${activeClassroom.classCode}`}
                          className="pop-btn bg-[#FACC15] hover:bg-[#fde047] text-slate-900 px-3 py-1.5 rounded-xl text-xs gap-1 font-bold"
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{!isPassed && allowRemed ? "Ulangi Kuis" : "Review Kuis"}</span>
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Modal Footer with Proceed to Lab */}
              <div className="bg-white border-t-2 border-slate-900 px-6 py-4 flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedTaskForDetail(null)}
                  className="pop-btn bg-slate-100 text-slate-900 px-4 py-2.5 rounded-xl text-xs"
                >
                  Tutup
                </button>

                <button
                  type="button"
                  id="tutorial-proceed-btn"
                  disabled={isOpeningLab}
                  onClick={() => {
                    setIsOpeningLab(true);
                    router.push(
                      `/lab?classCode=${encodeURIComponent(
                        activeClassroom.classCode
                      )}&taskId=${encodeURIComponent(task.id)}&mode=task${
                        isStudentTutorialActive ? "&tutorial=true" : ""
                      }`
                    );
                  }}
                  className="pop-btn bg-[#34D399] hover:bg-[#10B981] text-slate-900 px-6 py-2.5 rounded-xl text-xs sm:text-sm gap-2 disabled:opacity-70"
                >
                  <Play className="w-4 h-4" />
                  <span>
                    {isOpeningLab
                      ? "Membuka Lab 3D..."
                      : sub && (!allowRemed || isPassed)
                      ? "Proceed to Lab (Mode Review)"
                      : sub && allowRemed
                      ? "Proceed to Lab (Remedial)"
                      : "Proceed to Lab"}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Student Submission Detail Modal (For Students viewing from Task Briefing Modal) */}
      {isStudent && selectedSubmission && (
        <StudentSubmissionDetailModal
          submission={selectedSubmission}
          isTeacherView={false}
          task={classroomTasks.find((t) => String(t.id) === String(selectedSubmission.taskId)) || selectedTaskForDetail}
          onClose={() => setSelectedSubmission(null)}
        />
      )}

      {/* =========================================================================
          MODAL 1: BUAT RUANG KELAS BARU (GURU)
          ========================================================================= */}
      {isCreateClassModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="pop-card rounded-3xl w-full max-w-md p-6 space-y-4 bg-[#FFFDF7] animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b-2 border-slate-900/15 pb-3">
              <h3 className="font-display font-bold text-base text-slate-900 flex items-center gap-2">
                <School className="w-5 h-5 text-[#2563EB]" />
                <span>Buat Ruang Kelas Baru</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateClassModalOpen(false)}
                className="w-7 h-7 rounded-lg border border-slate-900 bg-white flex items-center justify-center text-slate-700 hover:bg-rose-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {createClassError && (
              <div className="p-3 bg-[#FFE4E6] border-2 border-slate-900 text-xs font-bold text-slate-900 rounded-xl flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{createClassError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClassroom} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase">Nama Kelas:</label>
                <input
                  type="text"
                  value={newClassName}
                  onChange={(e) => setNewClassName(e.target.value)}
                  placeholder="Contoh: Praktikum Kimia 10 IPA 1"
                  className="w-full p-2.5 bg-white border-2 border-slate-900 text-xs font-semibold text-slate-900 rounded-xl outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 uppercase">Jenjang:</label>
                  <select
                    value={newClassGrade}
                    onChange={(e) => setNewClassGrade(e.target.value)}
                    className="w-full p-2.5 bg-white border-2 border-slate-900 text-xs font-semibold text-slate-900 rounded-xl outline-none"
                  >
                    <option value="SD Kelas 5">SD (Sains Dasar)</option>
                    <option value="SMP Kelas 8">SMP (Zat &amp; Asam Basa)</option>
                    <option value="SMA Kelas 10">SMA Kelas 10</option>
                    <option value="SMA Kelas 11">SMA Kelas 11</option>
                    <option value="SMA Kelas 12">SMA Kelas 12</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-black text-slate-800 uppercase">Kode Kelas (PIN):</label>
                  <input
                    type="text"
                    value={newClassCode}
                    onChange={(e) => setNewClassCode(e.target.value.toUpperCase())}
                    placeholder="Auto (Kosongkan)"
                    className="w-full p-2.5 bg-white border-2 border-slate-900 text-xs font-mono font-bold text-slate-900 rounded-xl outline-none tracking-wider"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-black text-slate-800 uppercase">Deskripsi Kelas:</label>
                <textarea
                  rows={2}
                  value={newClassDesc}
                  onChange={(e) => setNewClassDesc(e.target.value)}
                  placeholder="Materi praktikum, jadwal laboratorium, dll..."
                  className="w-full p-2.5 bg-white border-2 border-slate-900 text-xs text-slate-900 rounded-xl outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t-2 border-slate-900/15">
                <button
                  type="button"
                  onClick={() => setIsCreateClassModalOpen(false)}
                  className="pop-btn px-4 py-2 bg-slate-100 text-slate-900 text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingClass}
                  className="pop-btn px-5 py-2 bg-[#34D399] text-slate-900 text-xs rounded-xl gap-1.5"
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
        initialMode={authModalMode}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAuthModalOpen(false);
          fetchClassrooms(user);
        }}
        currentUser={currentUser}
      />

      {/* =========================================================================
          MODAL 3: AI LAB CHEMISTRY TIPS POP-UP
          ========================================================================= */}
      {showAiTipModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="pop-card bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full border-2 border-slate-900 shadow-[8px_8px_0px_#0f172a] space-y-4 relative">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-[#FACC15] border-2 border-slate-900 flex items-center justify-center text-slate-900 shadow-[2px_2px_0px_#0f172a]">
                  <Lightbulb className="w-5 h-5 fill-[#FACC15]" />
                </div>
                <div>
                  <h3 className="font-display font-bold text-base text-slate-900">
                    Tips Laboratorium AI
                  </h3>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                    {CHEMISTRY_AI_TIPS[currentAiTipIndex].category}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowAiTipModal(false)}
                className="w-8 h-8 rounded-xl border-2 border-slate-900 hover:bg-slate-100 flex items-center justify-center text-slate-900 font-bold cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#FEF08A]/40 border-2 border-slate-900 rounded-2xl p-4 space-y-2">
              <h4 className="font-display font-bold text-sm text-slate-900">
                {CHEMISTRY_AI_TIPS[currentAiTipIndex].title}
              </h4>
              <p className="text-xs text-slate-800 leading-relaxed font-medium">
                {CHEMISTRY_AI_TIPS[currentAiTipIndex].text}
              </p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                Tip {currentAiTipIndex + 1} dari {CHEMISTRY_AI_TIPS.length}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setCurrentAiTipIndex((prev) =>
                      prev === 0 ? CHEMISTRY_AI_TIPS.length - 1 : prev - 1
                    )
                  }
                  className="pop-btn bg-slate-100 hover:bg-slate-200 text-slate-900 text-xs px-3 py-1.5 rounded-xl cursor-pointer"
                >
                  Sebelumnya
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setCurrentAiTipIndex((prev) => (prev + 1) % CHEMISTRY_AI_TIPS.length)
                  }
                  className="pop-btn bg-[#FACC15] hover:bg-[#EAB308] text-slate-900 text-xs px-3.5 py-1.5 rounded-xl cursor-pointer"
                >
                  Tips Berikutnya &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* =========================================================================
          MODAL 4: INTERACTIVE ONBOARDING TUTORIAL GUIDE FOR STUDENTS
          ========================================================================= */}
      {isStudent && isStudentTutorialActive && (
        <StudentTutorialGuide
          isActive={isStudentTutorialActive}
          onClose={handleFinishStudentTutorial}
          activeClassroom={activeClassroom}
          selectedTask={selectedTaskForDetail}
          hasClassrooms={effectiveStudentClassrooms.length > 0}
          onOpenFirstClassroom={() => {
            if (effectiveStudentClassrooms.length > 0) {
              setActiveClassroom(effectiveStudentClassrooms[0]);
            }
          }}
          onOpenFirstTask={() => {
            if (effectiveClassroomTasks.length > 0) {
              setSelectedTaskForDetail(effectiveClassroomTasks[0]);
            }
          }}
        />
      )}
    </div>
  );
}
