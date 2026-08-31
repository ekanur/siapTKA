import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const session = await getServerSession(authOptions);

  if (session?.user) {
    const role = (session.user as any).role;
    if (role === "ADMIN" || role === "GURU") {
      redirect("/admin/dashboard");
    } else {
      redirect("/latihan");
    }
  }

  redirect("/login");
}