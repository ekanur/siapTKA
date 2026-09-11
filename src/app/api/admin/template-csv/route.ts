import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    const userRole = (session?.user as any)?.role;

    if (userRole !== "ADMIN") {
      return NextResponse.json({ success: false, error: "Akses tidak sah" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    if (type === "siswa") {
      const csvData = [
        "nis,nama,email,kelas,jurusan,namaIndustriPkl",
        "20261001,Contoh Siswa Satu,siswa1@sekolah.sch.id,12 RPL A,PPLG,PT Industri Mitra",
        "20261002,Contoh Siswa Dua,siswa2@sekolah.sch.id,12 TKJ A,TJKT,PT Telekomunikasi Indonesia",
        "20261003,Contoh Siswa Tiga,siswa3@sekolah.sch.id,13 SIJA A,SIJA,PT Teknologi Nusantara",
      ].join("\r\n");

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="template_siswa.csv"',
        },
      });
    }

    if (type === "guru") {
      const csvData = [
        "nama,email,username,password,role,mapel",
        "Drs. Bambang Hidayat M.Kom,bambang@sekolah.sch.id,guru_pplg,GuruTKA2026!,GURU,PPLG",
        "Siti Aminah S.Pd M.Pd,siti.aminah@sekolah.sch.id,guru_matematika,GuruTKA2026!,GURU,MATEMATIKA",
        "Ahmad Fauzi S.T,ahmad.fauzi@sekolah.sch.id,guru_tjkt,GuruTKA2026!,GURU,TJKT",
        "Administrator Sekolah,admin@sekolah.sch.id,admin_utama,AdminTKA2026!,ADMIN,",
      ].join("\r\n");

      return new NextResponse(csvData, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": 'attachment; filename="template_guru.csv"',
        },
      });
    }

    return NextResponse.json({ success: false, error: "Parameter type tidak valid" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
