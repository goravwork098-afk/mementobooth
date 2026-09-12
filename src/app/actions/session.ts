"use server";

import { signOut } from "@/auth";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function signOutAction() {
  await signOut({ redirectTo: "/" });
}

export async function deleteAccountAction() {
  const session = await auth();
  if (!session?.user?.email) return;
  await prisma.user.delete({ where: { email: session.user.email } });
  await signOut({ redirectTo: "/" });
}
