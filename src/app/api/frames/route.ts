import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const frames = await prisma.frame.findMany({
    where: { isPublic: true },
    select: {
      id: true,
      slug: true,
      name: true,
      description: true,
      category: true,
      isPremium: true,
      slotCount: true,
      configJson: true,
    },
  });

  return NextResponse.json(frames);
}
