import type { Course } from "@/types";

export const COURSE_THUMBNAILS: Record<string, string> = {
  "vibe-coding-setup": "/images/courses/vibe-coding-setup.jpg",
  "claude-cli-noninteractive": "/images/courses/claude-cli-noninteractive.jpg",
  "vercel-supabase-basics": "/images/courses/vercel-supabase-basics.jpg",
  "google-oauth-profile": "/images/courses/google-oauth-profile.jpg",
};

export function getCourseThumbnail(
  course: Pick<Course, "slug" | "thumbnail_url">
): string | null {
  return course.thumbnail_url || COURSE_THUMBNAILS[course.slug] || null;
}
