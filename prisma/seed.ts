import { PrismaClient } from "@prisma/client";
import { DEFAULT_ROMANTIC_FRAMES } from "../src/types/frame";

const prisma = new PrismaClient();

async function main() {
  console.log("🌸 Seeding default frames...");

  for (const frame of DEFAULT_ROMANTIC_FRAMES) {
    await prisma.frame.upsert({
      where: { slug: frame.slug },
      update: {
        name: frame.name,
        description: frame.description,
        category: frame.category,
        isPremium: frame.isPremium,
        isPublic: true,
        slotCount: frame.slotCount,
        aspectRatio: frame.config.aspectRatio,
        configJson: JSON.stringify(frame.config),
      },
      create: {
        slug: frame.slug,
        name: frame.name,
        description: frame.description,
        category: frame.category,
        isPremium: frame.isPremium,
        isPublic: true,
        slotCount: frame.slotCount,
        aspectRatio: frame.config.aspectRatio,
        configJson: JSON.stringify(frame.config),
      },
    });
    console.log(`  ✓ ${frame.name} (${frame.slug})`);
  }

  console.log("✨ Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
