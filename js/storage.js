import {
  apiListQuotations,
  apiCreateQuotation,
  apiDeleteQuotation as apiDelete,
  apiUpdateQuotation,
  isAuthenticated,
} from "./api.js";

const STORAGE_KEY = "quotation-history";

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("Failed to read storage", error);
    return [];
  }
}

function writeStorage(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch (error) {
    console.error("Failed to write storage", error);
  }
}

export async function loadSavedQuotations() {
  const authed = await isAuthenticated().catch(() => false);
  if (!authed) {
    return readStorage();
  }
  return apiListQuotations();
}

export async function saveQuotation(quotation) {
  const authed = await isAuthenticated().catch(() => false);
  if (!authed) {
    const list = readStorage();
    list.unshift(quotation);
    writeStorage(list);
    return list;
  }
  const created = await apiCreateQuotation(quotation);
  const list = await apiListQuotations();
  return list;
}

export async function deleteQuotation(id) {
  const authed = await isAuthenticated().catch(() => false);
  if (!authed) {
    const list = readStorage().filter((item) => item.id !== id);
    writeStorage(list);
    return list;
  }
  await apiDelete(id);
  const list = await apiListQuotations();
  return list;
}

export async function renameQuotation(id, title) {
  const authed = await isAuthenticated().catch(() => false);
  if (!authed) {
    const list = readStorage().map((item) =>
      item.id === id ? { ...item, title } : item
    );
    writeStorage(list);
    return list;
  }
  const all = await apiListQuotations();
  const found = all.find((q) => String(q.id) === String(id));
  if (!found) return all;
  await apiUpdateQuotation(id, { ...found, title });
  const list = await apiListQuotations();
  return list;
}

export function getQuotation(id) {
  return readStorage().find((item) => item.id === id);
}
