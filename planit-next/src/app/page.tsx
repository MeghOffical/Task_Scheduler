import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import LandingContent from "@/components/landing-content";

export default async function Home() {
  // Next.js 14+ requires: await cookies()
  const cookieStore = await cookies();
  const token = cookieStore.get("auth_token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}