import { supabase } from "./supabase";

/* ------------------------------------------------------------------ */
/*  Auth                                                                */
/* ------------------------------------------------------------------ */
export async function signUp({ name, email, password }) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { name } },
  });
  if (error) throw error;
  return data;
}

export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function requestPasswordReset(email) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: window.location.origin,
  });
  if (error) throw error;
}

export async function updatePassword(newPassword) {
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
}

export async function fetchMyProfile() {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  if (error) throw error;
  return data;
}

/* ------------------------------------------------------------------ */
/*  Student accounts (admin side)                                       */
/* ------------------------------------------------------------------ */
function rowToProfile(r) {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    status: r.status,
    isAdmin: r.is_admin,
    createdAt: r.created_at,
    plan: r.plan,
    planStartDate: r.plan_start_date,
    level: r.level || "",
  };
}

export async function fetchAllProfiles() {
  const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToProfile);
}

export async function updateProfileStatus(id, status) {
  const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
  if (error) throw error;
}

export async function updateProfilePlan(id, plan, planStartDate) {
  const { error } = await supabase.from("profiles").update({ plan, plan_start_date: planStartDate || null }).eq("id", id);
  if (error) throw error;
}

export async function updateProfileLevel(id, level) {
  const { error } = await supabase.from("profiles").update({ level: level || null }).eq("id", id);
  if (error) throw error;
}

// Revokes the student's access to the app. It does not delete the underlying
// Supabase Auth account — that requires the service_role key, which must never
// ship to the browser. Remove the auth user from the Supabase dashboard if needed.
export async function deleteProfile(id) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Exercises                                                           */
/* ------------------------------------------------------------------ */
function rowToExercise(r) {
  return {
    id: r.id,
    type: r.type,
    track: r.track,
    title: r.title,
    level: r.level,
    dateAdded: r.date_added,
    instructions: r.instructions || "",
    passage: r.passage || "",
    minWords: r.min_words,
    questions: r.questions || [],
    sortOrder: r.sort_order,
    audioUrl: r.audio_url || "",
    theoryFileUrl: r.theory_file_url || "",
    theoryFileName: r.theory_file_name || "",
  };
}

export async function fetchExercises() {
  const { data, error } = await supabase.from("exercises").select("*").order("sort_order", { ascending: true });
  if (error) throw error;
  return (data || []).map(rowToExercise);
}

export async function insertExercise(ex) {
  const { data: minRow } = await supabase
    .from("exercises")
    .select("sort_order")
    .order("sort_order", { ascending: true })
    .limit(1)
    .maybeSingle();
  const sortOrder = (minRow?.sort_order ?? 0) - 1000;
  const row = {
    type: ex.type,
    track: ex.track,
    title: ex.title,
    level: ex.level,
    instructions: ex.instructions,
    passage: ex.passage,
    min_words: ex.minWords,
    questions: ex.questions,
    sort_order: sortOrder,
    audio_url: ex.audioUrl || "",
    theory_file_url: ex.theoryFileUrl || "",
    theory_file_name: ex.theoryFileName || "",
  };
  const { data, error } = await supabase.from("exercises").insert(row).select().single();
  if (error) throw error;
  return rowToExercise(data);
}

export async function updateExercise(id, ex) {
  const row = {
    type: ex.type,
    track: ex.track,
    title: ex.title,
    level: ex.level,
    instructions: ex.instructions,
    passage: ex.passage,
    min_words: ex.minWords,
    questions: ex.questions,
    audio_url: ex.audioUrl || "",
    theory_file_url: ex.theoryFileUrl || "",
    theory_file_name: ex.theoryFileName || "",
  };
  const { data, error } = await supabase.from("exercises").update(row).eq("id", id).select().single();
  if (error) throw error;
  return rowToExercise(data);
}

export async function deleteExercise(id) {
  const { error } = await supabase.from("exercises").delete().eq("id", id);
  if (error) throw error;
}

export async function swapExerciseOrder(a, b) {
  const [{ error: e1 }, { error: e2 }] = await Promise.all([
    supabase.from("exercises").update({ sort_order: b.sortOrder }).eq("id", a.id),
    supabase.from("exercises").update({ sort_order: a.sortOrder }).eq("id", b.id),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
}

/* ------------------------------------------------------------------ */
/*  Articles                                                            */
/* ------------------------------------------------------------------ */
function rowToArticle(r) {
  return {
    id: r.id,
    track: r.track,
    title: r.title,
    coverImageUrl: r.cover_image_url || "",
    excerpt: r.excerpt || "",
    body: r.body || "",
    dateAdded: r.date_added,
    icon: r.icon || "",
    coverPosition: r.cover_position || "center",
    coverHeight: r.cover_height || null,
  };
}

export async function fetchArticles() {
  const { data, error } = await supabase.from("articles").select("*").order("date_added", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToArticle);
}

export async function insertArticle(a) {
  const row = {
    track: a.track,
    title: a.title,
    cover_image_url: a.coverImageUrl,
    excerpt: a.excerpt,
    body: a.body,
    icon: a.icon || "",
    cover_position: a.coverPosition || "center",
    cover_height: a.coverHeight || null,
  };
  const { data, error } = await supabase.from("articles").insert(row).select().single();
  if (error) throw error;
  return rowToArticle(data);
}

export async function updateArticle(id, a) {
  const row = {
    track: a.track,
    title: a.title,
    cover_image_url: a.coverImageUrl,
    excerpt: a.excerpt,
    body: a.body,
    icon: a.icon || "",
    cover_position: a.coverPosition || "center",
    cover_height: a.coverHeight || null,
  };
  const { data, error } = await supabase.from("articles").update(row).eq("id", id).select().single();
  if (error) throw error;
  return rowToArticle(data);
}

export async function deleteArticle(id) {
  const { error } = await supabase.from("articles").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Reviews (testimonials)                                              */
/* ------------------------------------------------------------------ */
function rowToReview(r) {
  return { id: r.id, authorName: r.author_name, rating: r.rating, body: r.body, dateAdded: r.date_added };
}

export async function fetchReviews() {
  const { data, error } = await supabase.from("reviews").select("*").order("date_added", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToReview);
}

export async function insertReview(rev) {
  const row = { author_name: rev.authorName, rating: rev.rating, body: rev.body };
  const { data, error } = await supabase.from("reviews").insert(row).select().single();
  if (error) throw error;
  return rowToReview(data);
}

export async function deleteReview(id) {
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Materials                                                           */
/* ------------------------------------------------------------------ */
function rowToMaterial(r) {
  return {
    id: r.id,
    track: r.track,
    category: r.category,
    kind: r.kind,
    title: r.title,
    body: r.body || "",
    fileUrl: r.file_url || "",
    fileName: r.file_name || "",
    dateAdded: r.date_added,
    level: r.level || "",
  };
}

export async function fetchMaterials() {
  const { data, error } = await supabase.from("materials").select("*").order("date_added", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToMaterial);
}

export async function insertMaterial(m) {
  const row = {
    track: m.track,
    category: m.category,
    kind: m.kind,
    title: m.title,
    body: m.body,
    file_url: m.fileUrl,
    file_name: m.fileName,
    level: m.level || null,
  };
  const { data, error } = await supabase.from("materials").insert(row).select().single();
  if (error) throw error;
  return rowToMaterial(data);
}

export async function deleteMaterial(id) {
  const { error } = await supabase.from("materials").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Submissions                                                         */
/* ------------------------------------------------------------------ */
function rowToSubmission(r) {
  return {
    id: r.id,
    userId: r.user_id,
    userName: r.profiles?.name || "",
    userEmail: r.profiles?.email || "",
    exerciseId: r.exercise_id,
    exerciseTitle: r.exercises?.title || "",
    exerciseType: r.exercises?.type || "",
    track: r.exercises?.track || "",
    level: r.exercises?.level || "",
    score: r.score,
    total: r.total,
    completedAt: r.completed_at,
  };
}

export async function fetchSubmissions() {
  const { data, error } = await supabase
    .from("submissions")
    .select("*, profiles(name, email), exercises(title, type, track, level)")
    .order("completed_at", { ascending: false });
  if (error) throw error;
  return (data || []).map(rowToSubmission);
}

export async function upsertSubmission({ userId, exerciseId, score, total }) {
  const { error } = await supabase.from("submissions").upsert(
    { user_id: userId, exercise_id: exerciseId, score, total, completed_at: new Date().toISOString() },
    { onConflict: "user_id,exercise_id" }
  );
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Writing drafts                                                      */
/* ------------------------------------------------------------------ */
/* ------------------------------------------------------------------ */
/*  Image uploads (logo, banners — stored in the public "media" bucket) */
/* ------------------------------------------------------------------ */
export async function uploadFile(file, folder = "uploads") {
  const ext = file.name.split(".").pop();
  const path = `${folder}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("media").upload(path, file, { cacheControl: "3600", upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from("media").getPublicUrl(path);
  return data.publicUrl;
}

/* ------------------------------------------------------------------ */
/*  Site config (colors, fonts, copy, layout — singleton row)           */
/* ------------------------------------------------------------------ */
export async function fetchSiteConfig() {
  const { data, error } = await supabase.from("site_config").select("data, custom_logo").eq("id", 1).single();
  if (error) throw error;
  return { config: data?.data || {}, customLogo: data?.custom_logo || null };
}

export async function saveSiteConfig(configData) {
  const { error } = await supabase.from("site_config").update({ data: configData }).eq("id", 1);
  if (error) throw error;
}

export async function saveCustomLogo(value) {
  const { error } = await supabase.from("site_config").update({ custom_logo: value }).eq("id", 1);
  if (error) throw error;
}

export async function clearCustomLogo() {
  const { error } = await supabase.from("site_config").update({ custom_logo: null }).eq("id", 1);
  if (error) throw error;
}

/* ------------------------------------------------------------------ */
/*  Per-browser preferences (not shared, no need for a backend)         */
/* ------------------------------------------------------------------ */
export function getPreferredTrack() {
  try {
    return localStorage.getItem("imay:preferredTrack");
  } catch {
    return null;
  }
}

export function setPreferredTrack(value) {
  try {
    localStorage.setItem("imay:preferredTrack", value);
  } catch {
    /* localStorage may be unavailable (private browsing) — fine to skip */
  }
}
