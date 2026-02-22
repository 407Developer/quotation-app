function readMeta(name) {
  return document.querySelector(`meta[name="${name}"]`)?.content?.trim() || "";
}

function resolveSupabaseConfig() {
  const url = window.__SUPABASE_URL__ || readMeta("supabase-url");
  const anonKey = window.__SUPABASE_ANON_KEY__ || readMeta("supabase-anon-key");
  return {
    url: String(url || "").trim(),
    anonKey: String(anonKey || "").trim(),
  };
}

function requireSupabaseGlobal() {
  const globalNs = window.supabase;
  if (!globalNs?.createClient) {
    throw new Error("Supabase client SDK not loaded.");
  }
  return globalNs;
}

const cfg = resolveSupabaseConfig();
const supabase =
  cfg.url && cfg.anonKey
    ? requireSupabaseGlobal().createClient(cfg.url, cfg.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true,
        },
      })
    : null;

let authToken = null;

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Add supabase-url and supabase-anon-key.");
  }
  return supabase;
}

function mapUser(user, fallbackName = "") {
  if (!user) return null;
  return {
    id: user.id,
    email: user.email || "",
    name: user.user_metadata?.name || fallbackName || "",
  };
}

function mapQuotationRow(row) {
  return {
    id: row.id,
    title: row.title,
    dateISO: row.date_iso,
    items: row.items_json,
    total: row.total,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function setAuthToken(token) {
  authToken = token || null;
}

export function getAuthToken() {
  return authToken;
}

export async function getCurrentUser() {
  const client = ensureSupabase();
  const { data, error } = await client.auth.getSession();
  if (error) throw new Error(error.message || "Failed to read auth session");
  const session = data?.session || null;
  setAuthToken(session?.access_token || "");
  return mapUser(session?.user || null);
}

export async function isAuthenticated() {
  const user = await getCurrentUser();
  return !!user;
}

export async function apiRegister(payload) {
  const client = ensureSupabase();
  const { email, password, name } = payload || {};
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { name: name || "" },
    },
  });
  if (error) throw new Error(error.message || "Failed to register");

  const session = data?.session || null;
  const user = data?.user || session?.user || null;
  setAuthToken(session?.access_token || "");
  return {
    user: mapUser(user, name),
    token: session?.access_token || "",
    needsEmailConfirmation: !session,
  };
}

export async function apiLogin(payload) {
  const client = ensureSupabase();
  const { email, password } = payload || {};
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) throw new Error(error.message || "Failed to login");
  const session = data?.session || null;
  const user = data?.user || session?.user || null;
  setAuthToken(session?.access_token || "");
  return {
    user: mapUser(user),
    token: session?.access_token || "",
  };
}

export async function apiLogout() {
  const client = ensureSupabase();
  const { error } = await client.auth.signOut();
  if (error) throw new Error(error.message || "Failed to logout");
  setAuthToken("");
}

export async function apiListQuotations() {
  const client = ensureSupabase();
  const { data, error } = await client
    .from("quotations")
    .select("id,title,date_iso,items_json,total,created_at,updated_at")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message || "Failed to load quotations");
  return (data || []).map(mapQuotationRow);
}

export async function apiCreateQuotation(payload) {
  const client = ensureSupabase();
  const { title, dateISO, items, total } = payload || {};
  const { data, error } = await client
    .from("quotations")
    .insert({
      title: String(title || "").trim(),
      date_iso: dateISO || new Date().toISOString(),
      items_json: Array.isArray(items) ? items : [],
      total: Number.isFinite(Number(total)) ? Math.round(Number(total)) : 0,
    })
    .select("id,title,date_iso,items_json,total,created_at,updated_at")
    .single();
  if (error) throw new Error(error.message || "Failed to create quotation");
  return mapQuotationRow(data);
}

export async function apiUpdateQuotation(id, payload) {
  const client = ensureSupabase();
  const { title, dateISO, items, total } = payload || {};
  const { data, error } = await client
    .from("quotations")
    .update({
      title: String(title || "").trim(),
      date_iso: dateISO || new Date().toISOString(),
      items_json: Array.isArray(items) ? items : [],
      total: Number.isFinite(Number(total)) ? Math.round(Number(total)) : 0,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id,title,date_iso,items_json,total,created_at,updated_at")
    .single();
  if (error) throw new Error(error.message || "Failed to update quotation");
  return mapQuotationRow(data);
}

export async function apiDeleteQuotation(id) {
  const client = ensureSupabase();
  const { error } = await client.from("quotations").delete().eq("id", id);
  if (error) throw new Error(error.message || "Failed to delete quotation");
}
