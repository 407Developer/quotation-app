export const quotationState = {
  items: [],
  nextId: 1,
};

export function addItem(item) {
  const id = quotationState.nextId++;
  quotationState.items.push({ ...item, id });
  return id;
}

export function updateItem(id, nextItem) {
  quotationState.items = quotationState.items.map((item) =>
    item.id === id ? { ...nextItem, id } : item
  );
}

export function setItems(items) {
  quotationState.items = items;
  quotationState.nextId =
    items.reduce((maxId, item) => Math.max(maxId, item.id || 0), 0) + 1;
}

export function removeItem(id) {
  quotationState.items = quotationState.items.filter((item) => item.id !== id);
}

export function getItems() {
  return quotationState.items;
}

export function hasPlaceName(name, ignoreId = null) {
  const nameLower = name.toLowerCase();
  return quotationState.items.some(
    (item) =>
      item.placeName?.toLowerCase() === nameLower &&
      (ignoreId === null || item.id !== ignoreId)
  );
}

export function getGrandTotal() {
  return quotationState.items.reduce(
    (total, item) => total + (item.calculated?.areaTotal || 0),
    0
  );
}
