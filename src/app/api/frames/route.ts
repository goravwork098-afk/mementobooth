import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { auth } from "@/auth";

export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;

  const frames = await prisma.frame.findMany({
    where: {
      OR: [
        { isPublic: true },
        ...(userId ? [{ createdById: userId }] : []),
      ],
    },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      isPremium: true,
      isPublic: true,
      slotCount: true,
      configJson: true,
      createdById: true,
      creator: {
        select: {
          name: true,
        },
      },
    },
    orderBy: [{ category: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json(frames);
}
