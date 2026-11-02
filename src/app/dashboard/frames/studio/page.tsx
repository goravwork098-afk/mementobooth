import { redirect } from "next/navigation";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import FrameStudioWorkspace from "./frame-studio-workspace";

export default async function DedicatedFrameStudioPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  let userId = session.user.id;
  if (!userId && session.user.email) {
    const dbUser = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    userId = dbUser?.id;
  }
  if (!userId) redirect("/login");

  return <FrameStudioWorkspace />;
}

