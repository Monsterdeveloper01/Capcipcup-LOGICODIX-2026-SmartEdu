import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// GET /api/teacher/classes: Ambil daftar seluruh kelas milik guru
export async function GET() {
  try {
    const classes = await query<any[]>(`
      SELECT c.id, c.class_code as classCode, c.name, c.grade_level as gradeLevel,
             c.academic_year as academicYear, c.teacher_id as teacherId, c.teacher_name as teacherName,
             c.description, c.created_at as createdAt,
             (SELECT COUNT(*) FROM classroom_members cm WHERE cm.classroom_id = c.id) as membersCount,
             (SELECT COUNT(*) FROM quests q WHERE q.classroom_id = c.id OR q.room_code = c.class_code) as tasksCount
      FROM classrooms c
      ORDER BY c.created_at DESC
    `);

    return NextResponse.json({
      success: true,
      classes: classes || [],
    });
  } catch (err: any) {
    console.error("Fetch teacher classes error:", err);
    return NextResponse.json(
      { error: "Gagal mengambil daftar kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// POST /api/teacher/classes: Buat kelas baru
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      customPin,
      gradeLevel = "Kelas 10 SMK",
      academicYear = "2026/2027",
      teacherId = "usr_teacher_01",
      teacherName = "Budi Santoso, S.Pd",
      description = "Kelas Speaking Kurikulum Merdeka",
    } = body;

    if (!name || !name.trim()) {
      return NextResponse.json(
        { error: "Nama kelas wajib diisi (misal: 'Kelas 10 RPL A')." },
        { status: 400 }
      );
    }

    const classCode = customPin?.trim().toUpperCase() || `EDU${Math.floor(100 + Math.random() * 900)}`;
    const newId = `cls_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    // Periksa apakah PIN sudah dipakai kelas lain
    const existing = await query<any[]>("SELECT id FROM classrooms WHERE class_code = ? LIMIT 1", [classCode]);
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `PIN Kelas [${classCode}] sudah digunakan oleh kelas lain. Gunakan PIN unik lainnya.` },
        { status: 400 }
      );
    }

    await query(
      `INSERT INTO classrooms (id, class_code, name, grade_level, academic_year, teacher_id, teacher_name, description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [newId, classCode, name.trim(), gradeLevel, academicYear, teacherId, teacherName, description]
    );

    return NextResponse.json({
      success: true,
      message: `Kelas [${name}] berhasil dibuat dengan PIN ${classCode}!`,
      classroom: {
        id: newId,
        classCode,
        name: name.trim(),
        gradeLevel,
        academicYear,
        teacherName,
        membersCount: 0,
        tasksCount: 0,
      },
    });
  } catch (err: any) {
    console.error("Create class error:", err);
    return NextResponse.json(
      { error: "Gagal membuat kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// PUT /api/teacher/classes: Sunting data kelas
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, classCode, gradeLevel, academicYear, description } = body;

    if (!id || !name || !classCode) {
      return NextResponse.json(
        { error: "ID, Nama Kelas, dan PIN Kelas wajib diisi." },
        { status: 400 }
      );
    }

    const upperPin = classCode.trim().toUpperCase();

    // Pastikan PIN tidak tabrakan dengan kelas lain
    const existing = await query<any[]>("SELECT id FROM classrooms WHERE class_code = ? AND id != ? LIMIT 1", [upperPin, id]);
    if (existing && existing.length > 0) {
      return NextResponse.json(
        { error: `PIN Kelas [${upperPin}] sudah digunakan oleh kelas lain.` },
        { status: 400 }
      );
    }

    await query(
      `UPDATE classrooms 
       SET name = ?, class_code = ?, grade_level = ?, academic_year = ?, description = ?
       WHERE id = ?`,
      [name.trim(), upperPin, gradeLevel || "Kelas 10 SMK", academicYear || "2026/2027", description, id]
    );

    // Sinkronkan juga quests yang terkait dengan kelas ini
    await query(`UPDATE quests SET room_code = ? WHERE classroom_id = ?`, [upperPin, id]);

    return NextResponse.json({
      success: true,
      message: `Kelas [${name}] berhasil diperbarui.`,
    });
  } catch (err: any) {
    console.error("Update class error:", err);
    return NextResponse.json(
      { error: "Gagal memperbarui kelas.", details: err.message },
      { status: 500 }
    );
  }
}

// DELETE /api/teacher/classes: Hapus kelas beserta anggota dan tugasnya
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID kelas wajib disertakan." }, { status: 400 });
    }

    const existing = await query<any[]>("SELECT id, class_code, name FROM classrooms WHERE id = ? LIMIT 1", [id]);
    if (!existing || existing.length === 0) {
      return NextResponse.json({ error: "Kelas tidak ditemukan." }, { status: 404 });
    }

    const cls = existing[0];

    // Hapus tugas yang terikat dengan kelas ini
    await query("DELETE FROM quests WHERE classroom_id = ? OR room_code = ?", [id, cls.class_code]);

    // Hapus kelas (members akan terhapus via CASCADE)
    await query("DELETE FROM classrooms WHERE id = ?", [id]);

    return NextResponse.json({
      success: true,
      message: `Kelas [${cls.name} • PIN: ${cls.class_code}] berhasil dihapus.`,
    });
  } catch (err: any) {
    console.error("Delete class error:", err);
    return NextResponse.json(
      { error: "Gagal menghapus kelas.", details: err.message },
      { status: 500 }
    );
  }
}

