export function buildFlooringItem(inputs, calculated, prices, overrides = {}) {
  return {
    kind: "flooring",
    placeName: inputs.placeName,
    mode: "guided",
    inputs: {
      userName: inputs.userName,
      length: inputs.length,
      breadth: inputs.breadth,
      doors: inputs.doors,
      skirtingNeeded: inputs.skirtingNeeded,
      floorType: inputs.floorType,
      price: inputs.price,
      gumPrice: inputs.gumPrice,
      doorProfilePrice: inputs.doorProfilePrice,
    },
    prices,
    calculated,
    overrides,
  };
}

export function buildGuidedItem(kind, inputs, calculated, prices, overrides = {}) {
  return {
    kind,
    placeName: inputs.placeName,
    mode: "guided",
    inputs: { ...inputs },
    prices,
    calculated,
    overrides,
  };
}

import { applyOverrides } from "./calc.js";

export function buildCustomItem(inputs, overrides = {}) {
  const qty = inputs.customQty;
  const unitPrice = inputs.customUnitPrice;
  const subtotal = qty * unitPrice;
  const baseLines = [
    {
      key: "custom",
      label: inputs.customName,
      qty,
      unit: inputs.customUnit,
      subtotal,
    },
  ];
  const applied = applyOverrides(baseLines, overrides);
  return {
    kind: "custom",
    mode: "custom",
    name: inputs.customName,
    inputs: { ...inputs },
    calculated: {
      areaTotal: applied.areaTotal,
      lines: applied.lines,
    },
    overrides,
  };
}

/** Build a custom item from multiple draft lines (batch add) */
export function buildCustomItemFromLines(draftLines, overrides = {}) {
  if (!draftLines || draftLines.length === 0) return null;
  const baseLines = draftLines.map((line, i) => ({
    key: `custom-${i}`,
    label: line.name,
    qty: line.qty,
    unit: line.unit,
    subtotal: line.subtotal,
  }));
  const applied = applyOverrides(baseLines, overrides);
  const firstName = draftLines[0]?.name || "Custom";
  const displayName =
    draftLines.length === 1 ? firstName : `${firstName} + ${draftLines.length - 1} more`;
  const inputs = {
    customName: firstName,
    customQty: draftLines[0]?.qty,
    customUnit: draftLines[0]?.unit,
    customUnitPrice: draftLines[0]?.unitPrice,
    customNotes: draftLines[0]?.notes,
    customDraftLines: draftLines,
  };
  return {
    kind: "custom",
    mode: "custom",
    name: displayName,
    inputs,
    calculated: { areaTotal: applied.areaTotal, lines: applied.lines },
    overrides,
  };
}
