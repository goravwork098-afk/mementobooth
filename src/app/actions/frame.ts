"use server";

import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import {
  buildCustomFrameConfig,
  type CustomFrameInput,
} from "@/lib/custom-frame";
import { randomBytes } from "crypto";

export async function createCustomFrameAction(input: CustomFrameInput) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized. Please sign in to design custom frames.");
  }

  const userId = session.user.id;
  const trimmedName = (input.name ?? "").trim().slice(0, 40);
  if (!trimmedName) {
    throw new Error("Frame name is required.");
  }

  const { config, slotCount, aspectRatio } = buildCustomFrameConfig({
    ...input,
    name: trimmedName,
  });

  const slug = `custom-${randomBytes(4).toString("hex")}-${Date.now().toString(36)}`;

  const frame = await prisma.frame.create({
    data: {
      slug,
      name: trimmedName,
      description: `Custom frame designed by user`,
      category: "CUSTOM",
      isPremium: false,
      isPublic: Boolean(input.isPublic),
      slotCount,
      aspectRatio,
      configJson: JSON.stringify(config),
      createdById: userId,
    },
  });

  return {
    id: frame.id,
    slug: frame.slug,
    name: frame.name,
    category: frame.category,
    configJson: frame.configJson,
    slotCount: frame.slotCount,
    isPublic: frame.isPublic,
  };
}

export async function toggleFramePublicAction(frameId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const frame = await prisma.frame.findUnique({
    where: { id: frameId },
  });

  if (!frame) throw new Error("Frame not found.");
  if (frame.createdById !== session.user.id) {
    throw new Error("You can only modify custom frames you created.");
  }

  const updated = await prisma.frame.update({
    where: { id: frameId },
    data: { isPublic: !frame.isPublic },
    select: { id: true, isPublic: true },
  });

  return updated;
}

export async function deleteCustomFrameAction(frameId: string) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const frame = await prisma.frame.findUnique({
    where: { id: frameId },
  });

  if (!frame) throw new Error("Frame not found.");
  if (frame.createdById !== session.user.id) {
    throw new Error("You can only delete custom frames you created.");
  }

  await prisma.frame.delete({
    where: { id: frameId },
  });

  return { success: true };
}

