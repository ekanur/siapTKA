import { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // 1. Google Workspace SSO
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "demo-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "demo-client-secret",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
    // 2. Credentials Provider for Admin & Quick Demo Login
    CredentialsProvider({
      id: "credentials",
      name: "Akun Sekolah / Guru / Demo",
      credentials: {
        emailOrUsername: { label: "Email / Username", type: "text" },
        password: { label: "Password (Guru/Admin)", type: "password" },
        isDemoStudent: { label: "Demo Student", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials?.emailOrUsername) return null;

        // A. Demo Student Quick Access
        if (credentials.isDemoStudent === "true") {
          const student = await prisma.siswa.findFirst({
            where: {
              OR: [
                { email: credentials.emailOrUsername },
                { nis: credentials.emailOrUsername },
              ],
            },
          });
          if (student) {
            // Auto activate if first time
            if (student.statusAkun === "BELUM_AKTIF") {
              await prisma.siswa.update({
                where: { id: student.id },
                data: { statusAkun: "AKTIF", tanggalAktivasi: new Date() },
              });
            }
            return {
              id: student.id,
              name: student.nama,
              email: student.email,
              role: "SISWA",
              nis: student.nis,
              statusAkun: "AKTIF",
              statusTka: student.statusTka,
              namaIndustriPkl: student.namaIndustriPkl,
            };
          }
          return null;
        }

        // B. Admin / Guru Login
        const adminUser = await prisma.userAdmin.findFirst({
          where: {
            OR: [
              { username: credentials.emailOrUsername },
              { email: credentials.emailOrUsername.toLowerCase().trim() },
            ],
          },
        });

        if (adminUser && adminUser.password === credentials.password) {
          return {
            id: adminUser.id,
            name: adminUser.nama,
            email: adminUser.email || `${adminUser.username}@sekolah.sch.id`,
            role: adminUser.role, // "ADMIN" or "GURU"
            mapel: adminUser.mapel,
            statusAkun: "AKTIF",
          };
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        if (!user.email) return false;
        const normalizedEmail = user.email.toLowerCase().trim();

        // 1. Check if user is an Admin or Guru from userAdmin table
        const adminTeacher = await prisma.userAdmin.findUnique({
          where: { email: normalizedEmail },
        });

        if (adminTeacher) {
          (user as any).id = adminTeacher.id;
          (user as any).role = adminTeacher.role;
          (user as any).mapel = adminTeacher.mapel;
          return true;
        }

        // 2. Whitelist checking against Siswa table
        const student = await prisma.siswa.findUnique({
          where: { email: normalizedEmail },
        });

        if (!student) {
          // Reject login if student email is not whitelisted by school
          return "/login?error=EmailBelumTerdaftar";
        }

        // Auto activate student account on first Google login
        if (student.statusAkun === "BELUM_AKTIF") {
          await prisma.siswa.update({
            where: { id: student.id },
            data: {
              statusAkun: "AKTIF",
              tanggalAktivasi: new Date(),
            },
          });
        }

        return true;
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role || "SISWA";
        token.mapel = (user as any).mapel;
        token.nis = (user as any).nis;
        token.statusTka = (user as any).statusTka;
        token.namaIndustriPkl = (user as any).namaIndustriPkl;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        (session.user as any).id = token.id;
        (session.user as any).role = token.role;
        (session.user as any).mapel = token.mapel;
        (session.user as any).nis = token.nis;
        (session.user as any).statusTka = token.statusTka;
        (session.user as any).namaIndustriPkl = token.namaIndustriPkl;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
};