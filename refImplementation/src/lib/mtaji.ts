import c1 from "@/assets/candidates/c1.jpg";
import c2 from "@/assets/candidates/c2.jpg";
import c3 from "@/assets/candidates/c3.jpg";
import c4 from "@/assets/candidates/c4.jpg";
import c5 from "@/assets/candidates/c5.jpg";
import c6 from "@/assets/candidates/c6.jpg";

export const MTAJI_BASE = "https://m-taji-tracker.vercel.app";
export const MTAJI_CREATE_PROFILE_URL = `${MTAJI_BASE}/signup`;

export function mtajiProfileUrl(name: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
  return `${MTAJI_BASE}/p/${slug}`;
}

const CANDIDATE_PORTRAITS = [c1, c2, c3, c4, c5, c6];

export function candidatePhoto(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return CANDIDATE_PORTRAITS[hash % CANDIDATE_PORTRAITS.length];
}
