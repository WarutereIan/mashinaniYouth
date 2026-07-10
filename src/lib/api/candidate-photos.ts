import { supabase } from "@/integrations/supabase/client";

export const CANDIDATE_PHOTOS_BUCKET = "candidate-photos";

function photoExt(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext && ["jpg", "jpeg", "png", "webp"].includes(ext)) return ext;
  return file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
}

/**
 * Upload a candidate photo to the candidate-photos bucket.
 * Path layout `{userId}/{candidateId}/photo.ext` satisfies the storage RLS
 * policy (first folder segment must equal auth.uid()).
 */
export async function uploadCandidatePhoto(
  userId: string,
  candidateId: string,
  file: File,
): Promise<string> {
  const path = `${userId}/${candidateId}/photo.${photoExt(file)}`;
  const { error } = await supabase.storage
    .from(CANDIDATE_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type || "image/jpeg", upsert: true });
  if (error) throw error;
  return path;
}

/** Persist the uploaded storage path on the candidate row (own pending row only, per RLS). */
export async function setCandidatePhotoPath(candidateId: string, photoPath: string): Promise<void> {
  const { error } = await supabase
    .from("candidates")
    .update({ photo_path: photoPath })
    .eq("id", candidateId);
  if (error) throw error;
}

/** Public URL for a stored candidate photo path, or null when no photo exists. */
export function candidatePhotoUrl(photoPath: string | null | undefined): string | null {
  if (!photoPath) return null;
  const { data } = supabase.storage.from(CANDIDATE_PHOTOS_BUCKET).getPublicUrl(photoPath);
  return data.publicUrl;
}
