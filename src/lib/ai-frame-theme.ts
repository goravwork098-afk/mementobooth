import type {
  CustomLayoutType,
  CustomFrameStyle,
  CustomFontFamily,
  DecorativeIcon,
} from "./custom-frame";

export interface GeneratedAiTheme {
  name: string;
  layout: CustomLayoutType;
  frameStyle: CustomFrameStyle;
  backgroundColor: string;
  backgroundGradient?: string;
  customText: string;
  subtitle: string;
  decorativeIcon: DecorativeIcon;
  fontFamily: CustomFontFamily;
  borderRadius: number;
}


export async function generateAiFrameTheme(
  prompt: string
): Promise<GeneratedAiTheme> {
  const cleanPrompt = (prompt || "").trim().toLowerCase();

  // 1. If GEMINI_API_KEY is available, attempt Gemini generation
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey && apiKey.trim().length > 0) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: `You are an expert aesthetic photobooth designer for romantic couples. Design a customized photobooth frame based on this user prompt: "${prompt}".
Respond ONLY with a valid JSON object with these exact keys:
{
  "name": "Short theme title max 30 chars",
  "layout": one of ["4-cut-strip", "3-cut-strip", "2-cut-duo", "1-cut-polaroid", "2x2-quad", "heart-duo", "vintage-film", "6-cut-matrix"],
  "frameStyle": one of ["clean", "heart", "film", "polaroid", "scrapbook"],
  "backgroundColor": "hex color like #ffffff or #18181b",
  "backgroundGradient": "optional second hex color or null",
  "customText": "Romantic header max 40 chars",
  "subtitle": "Romantic quote or location subtitle max 50 chars",
  "decorativeIcon": one of ["heart", "sparkles", "star", "camera", "mail", "none"],
  "fontFamily": one of ["serif", "sans", "mono", "cursive"],
  "borderRadius": integer between 0 and 24
}
DO NOT include markdown fences, backticks, or extra explanation. Only raw JSON.`,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: 0.7,
              responseMimeType: "application/json",
            },
          }),
        }
      );

      if (response.ok) {
        const data = await response.json();
        const text =
          data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
        if (text) {
          const parsed = JSON.parse(text) as GeneratedAiTheme;
          if (parsed.name && parsed.layout) {
            return {
              name: parsed.name.slice(0, 35),
              layout: parsed.layout,
              frameStyle: parsed.frameStyle ?? "clean",
              backgroundColor: parsed.backgroundColor ?? "#ffffff",
              backgroundGradient: parsed.backgroundGradient || undefined,
              customText: parsed.customText ?? "Forever & Always",
              subtitle: parsed.subtitle ?? "A moment in time",
              decorativeIcon: parsed.decorativeIcon ?? "heart",
              fontFamily: parsed.fontFamily ?? "serif",
              borderRadius: Math.min(24, Math.max(0, parsed.borderRadius ?? 8)),
            };
          }
        }
      }
    } catch {
      // Fall through to deterministic contextual engine
    }
  }

  

  if (
    cleanPrompt.includes("paris") ||
    cleanPrompt.includes("rose") ||
    cleanPrompt.includes("anniversary") ||
    cleanPrompt.includes("heart") ||
    cleanPrompt.includes("sweet") ||
    cleanPrompt.includes("love")
  ) {
    return {
      name: "Parisian Rose Romance",
      layout: "heart-duo",
      frameStyle: "heart",
      backgroundColor: "#fff1f2",
      backgroundGradient: "#fce7f3",
      customText: "Forever In My Heart",
      subtitle: "Sous le ciel de Paris",
      decorativeIcon: "heart",
      fontFamily: "serif",
      borderRadius: 14,
    };
  }

  if (
    cleanPrompt.includes("cyber") ||
    cleanPrompt.includes("neon") ||
    cleanPrompt.includes("tokyo") ||
    cleanPrompt.includes("night") ||
    cleanPrompt.includes("future")
  ) {
    return {
      name: "Cyber Neon Nights",
      layout: "2x2-quad",
      frameStyle: "clean",
      backgroundColor: "#0f172a",
      backgroundGradient: "#1e1b4b",
      customText: "Tokyo Electric Reverie",
      subtitle: "Lost in the starlight with you",
      decorativeIcon: "sparkles",
      fontFamily: "sans",
      borderRadius: 12,
    };
  }

  if (
    cleanPrompt.includes("film") ||
    cleanPrompt.includes("cinema") ||
    cleanPrompt.includes("vintage") ||
    cleanPrompt.includes("retro") ||
    cleanPrompt.includes("90s") ||
    cleanPrompt.includes("indie")
  ) {
    return {
      name: "35mm Vintage Cinema",
      layout: "vintage-film",
      frameStyle: "film",
      backgroundColor: "#18181b",
      backgroundGradient: "#09090b",
      customText: "Cinematic Keepsake",
      subtitle: "Frame 01A • Analog Date Night",
      decorativeIcon: "camera",
      fontFamily: "mono",
      borderRadius: 4,
    };
  }

  if (
    cleanPrompt.includes("polaroid") ||
    cleanPrompt.includes("coffee") ||
    cleanPrompt.includes("autumn") ||
    cleanPrompt.includes("cozy") ||
    cleanPrompt.includes("cottage")
  ) {
    return {
      name: "Cozy Polaroid Memories",
      layout: "1-cut-polaroid",
      frameStyle: "polaroid",
      backgroundColor: "#fbf8f5",
      backgroundGradient: "#f4ede4",
      customText: "Warm Hugs & Rainy Days",
      subtitle: "You make everywhere feel like home",
      decorativeIcon: "mail",
      fontFamily: "cursive",
      borderRadius: 2,
    };
  }

  if (
    cleanPrompt.includes("beach") ||
    cleanPrompt.includes("sunset") ||
    cleanPrompt.includes("golden") ||
    cleanPrompt.includes("summer") ||
    cleanPrompt.includes("ocean")
  ) {
    return {
      name: "Golden Hour Glow",
      layout: "2-cut-duo",
      frameStyle: "clean",
      backgroundColor: "#fff7ed",
      backgroundGradient: "#fed7aa",
      customText: "Golden Hour Sunset",
      subtitle: "Watching the horizon with you",
      decorativeIcon: "star",
      fontFamily: "serif",
      borderRadius: 16,
    };
  }

  if (
    cleanPrompt.includes("star") ||
    cleanPrompt.includes("galaxy") ||
    cleanPrompt.includes("celestial") ||
    cleanPrompt.includes("moon")
  ) {
    return {
      name: "Celestial Starlight",
      layout: "4-cut-strip",
      frameStyle: "heart",
      backgroundColor: "#faf5ff",
      backgroundGradient: "#f3e8ff",
      customText: "Written In The Stars",
      subtitle: "To the moon and back",
      decorativeIcon: "star",
      fontFamily: "serif",
      borderRadius: 10,
    };
  }

  if (
    cleanPrompt.includes("party") ||
    cleanPrompt.includes("friends") ||
    cleanPrompt.includes("celebrate") ||
    cleanPrompt.includes("birthday") ||
    cleanPrompt.includes("gang")
  ) {
    return {
      name: "Celebration Party Grid",
      layout: "6-cut-matrix",
      frameStyle: "scrapbook",
      backgroundColor: "#ffffff",
      backgroundGradient: "#fff1f2",
      customText: "Best Night Ever",
      subtitle: "Unforgettable moments together",
      decorativeIcon: "sparkles",
      fontFamily: "sans",
      borderRadius: 8,
    };
  }

  // Default romantic mall strip
  return {
    name: "Classic Date Keepsake",
    layout: "4-cut-strip",
    frameStyle: "heart",
    backgroundColor: "#fff1f2",
    backgroundGradient: "#fce7f3",
    customText: "A Little Date Night",
    subtitle: "Different places. One perfect moment.",
    decorativeIcon: "heart",
    fontFamily: "serif",
    borderRadius: 8,
  };
}
