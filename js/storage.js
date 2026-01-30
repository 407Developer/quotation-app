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

export function loadSavedQuotations() {
  return readStorage();
}

export function saveQuotation(quotation) {
  const list = readStorage();
  list.unshift(quotation);
  writeStorage(list);
  return list;
}

export function deleteQuotation(id) {
  const list = readStorage().filter((item) => item.id !== id);
  writeStorage(list);
  return list;
}

export function renameQuotation(id, title) {
  const list = readStorage().map((item) =>
    item.id === id ? { ...item, title } : item
  );
  writeStorage(list);
  return list;
}

export function getQuotation(id) {
  return readStorage().find((item) => item.id === id);
}
