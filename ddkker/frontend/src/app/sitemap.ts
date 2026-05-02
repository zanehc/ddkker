import { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("slug, updated_at")
    .eq("published", true);

  const staticRoutes = [
    "/",
    "/courses",
    "/membership",
    "/resources",
    "/community",
    "/faq",
    "/youtube",
    "/privacy",
    "/terms",
  ];

  return [
    ...staticRoutes.map((url) => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}${url}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: url === "/" ? 1 : 0.8,
    })),
    ...(courses ?? []).map((c) => ({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/courses/${c.slug}`,
      lastModified: new Date(c.updated_at),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
