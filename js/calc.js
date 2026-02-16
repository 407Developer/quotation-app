import { flooringRules, paintRules, tileRules, wallpaperRules } from "./rules.js";

export function applyOverrides(lines, overrides = {}) {
  const nextLines = lines.map((line) => {
    const override = overrides[line.key];
    if (typeof override === "number" && !Number.isNaN(override)) {
      return { ...line, subtotal: override };
    }
    if (override && typeof override === "object") {
      const overrideQty =
        typeof override.qty === "number" && !Number.isNaN(override.qty) && override.qty >= 0
          ? override.qty
          : null;
      const overrideUnitPrice =
        typeof override.unitPrice === "number" &&
        !Number.isNaN(override.unitPrice) &&
        override.unitPrice >= 0
          ? override.unitPrice
          : null;
      const overrideSubtotal =
        typeof override.subtotal === "number" &&
        !Number.isNaN(override.subtotal) &&
        override.subtotal >= 0
          ? override.subtotal
          : null;

      const baseQty =
        typeof line.qty === "number" && !Number.isNaN(line.qty) && line.qty >= 0 ? line.qty : 0;
      const baseSubtotal =
        typeof line.subtotal === "number" && !Number.isNaN(line.subtotal) && line.subtotal >= 0
          ? line.subtotal
          : 0;
      const baseUnitPrice = baseQty > 0 ? baseSubtotal / baseQty : 0;

      const qty = overrideQty ?? baseQty;
      const unitPrice =
        overrideUnitPrice ??
        (overrideSubtotal !== null ? (qty > 0 ? overrideSubtotal / qty : 0) : baseUnitPrice);
      const subtotal = overrideSubtotal ?? qty * unitPrice;
      return { ...line, qty, subtotal };
    }
    return line;
  });
  const areaTotal = nextLines.reduce((sum, line) => sum + (line.subtotal || 0), 0);
  return { lines: nextLines, areaTotal };
}

export function getFlooringPrices({ floorType, floorPrice, gumPrice, doorProfilePrice }) {
  const defaults = flooringRules.defaults;
  return {
    vinyl: floorPrice ? floorPrice : defaults.vinylPrice,
    spc: defaults.spcPrice,
    skirting: defaults.skirtingPrice,
    floorGum: gumPrice ? gumPrice : defaults.floorGumPrice,
    filler: defaults.fillerPrice,
    skirtingGum: defaults.skirtingGumPrice,
    doorProfile: doorProfilePrice,
    floorType,
  };
}

export function computeFlooring({
  length,
  breadth,
  doors,
  skirtingNeeded,
  floorType,
  prices,
  overrides,
}) {
  const floorArea = length * breadth;

  let skirtingQty = 0;
  let fillerQty = 0;
  let skirtingGumQty = 0;

  if (skirtingNeeded === "yes") {
    const perimeter = (length + breadth) * 2;
    const perimeterAdjusted = perimeter - doors * flooringRules.measures.doorWidth;
    skirtingQty = Math.ceil(
      Math.max(perimeterAdjusted, 0) / flooringRules.measures.skirtingBoardLength
    );
    fillerQty = Math.ceil(skirtingQty / 2);
    skirtingGumQty = Math.ceil(fillerQty / 3);
  }

  const floorGum =
    floorType === "vinyl"
      ? Math.ceil(floorArea / flooringRules.measures.floorGumCoverage)
      : 0;
  const doorEndProfiles =
    doors > 0
      ? Math.ceil(
          (doors * flooringRules.measures.doorWidth) /
            flooringRules.measures.doorProfileCoverage
        )
      : 0;

  const floorUnitPrice = prices[floorType] || 0;
  const floorSubtotal = floorArea * floorUnitPrice;
  const skirtingSubtotal = skirtingQty * prices.skirting;
  const floorGumSubtotal = floorGum * prices.floorGum;
  const fillerSubtotal = fillerQty * prices.filler;
  const skirtingGumSubtotal = skirtingGumQty * prices.skirtingGum;
  const doorProfileSubtotal = doorEndProfiles * prices.doorProfile;

  const areaTotal =
    floorSubtotal +
    skirtingSubtotal +
    floorGumSubtotal +
    fillerSubtotal +
    skirtingGumSubtotal +
    doorProfileSubtotal;

  const applied = applyOverrides(
    [
      {
        key: "floor",
        label: `Flooring (${floorType.toUpperCase()})`,
        qty: floorArea,
        unit: "sqm",
        subtotal: floorSubtotal,
      },
      ...(skirtingNeeded === "yes"
        ? [
            {
              key: "skirting",
              label: "Skirting",
              qty: skirtingQty,
              unit: "pcs",
              subtotal: skirtingSubtotal,
            },
            { key: "filler", label: "Filler", qty: fillerQty, unit: "bags", subtotal: fillerSubtotal },
            {
              key: "skirtingGum",
              label: "Skirting Gum",
              qty: skirtingGumQty,
              unit: "pcs",
              subtotal: skirtingGumSubtotal,
            },
          ]
        : []),
      ...(floorType === "vinyl" && floorGum > 0
        ? [
            {
              key: "floorGum",
              label: "Floor Gum",
              qty: floorGum,
              unit: "pcs",
              subtotal: floorGumSubtotal,
            },
          ]
        : []),
      ...(doorEndProfiles > 0
        ? [
            {
              key: "doorProfiles",
              label: "Door Profiles",
              qty: doorEndProfiles,
              unit: "pcs",
              subtotal: doorProfileSubtotal,
            },
          ]
        : []),
    ],
    overrides
  );

  return {
    area: floorArea,
    floorArea,
    skirtingQty,
    fillerQty,
    skirtingGumQty,
    floorGum,
    doorEndProfiles,
    floorSubtotal,
    skirtingSubtotal,
    floorGumSubtotal,
    fillerSubtotal,
    skirtingGumSubtotal,
    doorProfileSubtotal,
    areaTotal: applied.areaTotal,
    lines: applied.lines,
  };
}

export function getTilePrices({ tilePrice }) {
  const defaults = tileRules.defaults;
  return {
    tile: tilePrice ? tilePrice : defaults.tilePrice,
    tileGum: defaults.tileGumPrice,
    cement: defaults.cementPrice,
    sand: defaults.sandPrice,
  };
}

export function getTileArea(tileSizeCm) {
  const size = tileSizeCm || tileRules.measures.tileSizeCm;
  const tileSizeM = size / 100;
  return tileSizeM * tileSizeM;
}

export function computeTiles({ area, tileSizeCm, prices, overrides }) {
  const tileSizeM = (tileSizeCm || tileRules.measures.tileSizeCm) / 100;
  const tileArea = tileSizeM * tileSizeM;
  const tileCount = Math.ceil((area / tileArea) * (1 + tileRules.measures.wasteRate));
  const tileSubtotal = area * prices.tile;

  const tileGumQty = Math.ceil(area / tileRules.measures.tileGumCoverage);
  const cementQty = Math.ceil(area / tileRules.measures.cementCoverage);
  const sandQty = Math.ceil(area / tileRules.measures.sandCoverage);

  const tileGumSubtotal = tileGumQty * prices.tileGum;
  const cementSubtotal = cementQty * prices.cement;
  const sandSubtotal = sandQty * prices.sand;

  const areaTotal = tileSubtotal + tileGumSubtotal + cementSubtotal + sandSubtotal;
  const applied = applyOverrides(
    [
      {
        key: "tiles",
        label: `Tiles (${tileCount} pcs)`,
        qty: area,
        unit: "sqm",
        subtotal: tileSubtotal,
      },
      {
        key: "tileGum",
        label: "Tile Gum",
        qty: tileGumQty,
        unit: "bags",
        subtotal: tileGumSubtotal,
      },
      { key: "cement", label: "Cement", qty: cementQty, unit: "bags", subtotal: cementSubtotal },
      { key: "sand", label: "Sand", qty: sandQty, unit: "tons", subtotal: sandSubtotal },
    ],
    overrides
  );

  return {
    area,
    tileCount,
    tileGumQty,
    cementQty,
    sandQty,
    tileSubtotal,
    tileGumSubtotal,
    cementSubtotal,
    sandSubtotal,
    areaTotal: applied.areaTotal,
    lines: applied.lines,
    meta: {
      tileSizeCm: tileSizeCm || tileRules.measures.tileSizeCm,
      tileCount,
    },
  };
}

export function getPaintPrices({ paintPrice }) {
  const defaults = paintRules.defaults;
  return {
    paint: paintPrice ? paintPrice : defaults.paintPrice,
    primer: defaults.primerPrice,
  };
}

export function computePaint({ area, coats, prices, overrides }) {
  const appliedCoats = coats || paintRules.measures.defaultCoats;
  const primerQty = Math.ceil(area / paintRules.measures.primerCoverage);
  const paintQty = Math.ceil((area * appliedCoats) / paintRules.measures.paintCoverage);

  const primerSubtotal = primerQty * prices.primer;
  const paintSubtotal = area * prices.paint;
  const areaTotal = paintSubtotal + primerSubtotal;
  const applied = applyOverrides(
    [
      { key: "paint", label: "Painting", qty: area, unit: "sqm", subtotal: paintSubtotal },
      { key: "primer", label: "Primer", qty: primerQty, unit: "cans", subtotal: primerSubtotal },
    ],
    overrides
  );

  return {
    area,
    coats: appliedCoats,
    primerQty,
    paintQty,
    primerSubtotal,
    paintSubtotal,
    areaTotal: applied.areaTotal,
    lines: applied.lines,
  };
}

export function getWallpaperPrices({ rollPrice, adhesivePrice }) {
  const defaults = wallpaperRules.defaults;
  return {
    roll: rollPrice ? rollPrice : defaults.rollPrice,
    adhesive: adhesivePrice ? adhesivePrice : defaults.adhesivePrice,
  };
}

export function getWallpaperRollCoverage() {
  return wallpaperRules.measures.rollCoverage;
}

export function computeWallpaper({ area, prices, overrides }) {
  const rolls = Math.ceil((area / wallpaperRules.measures.rollCoverage) * (1 + wallpaperRules.measures.wasteRate));
  const adhesiveQty = Math.ceil(area / wallpaperRules.measures.adhesiveCoverage);
  const rollSubtotal = rolls * prices.roll;
  const adhesiveSubtotal = adhesiveQty * prices.adhesive;
  const areaTotal = rollSubtotal + adhesiveSubtotal;
  const applied = applyOverrides(
    [
      {
        key: "rolls",
        label: "Wallpaper Rolls",
        qty: rolls,
        unit: "rolls",
        subtotal: rollSubtotal,
      },
      { key: "adhesive", label: "Adhesive", qty: adhesiveQty, unit: "cans", subtotal: adhesiveSubtotal },
    ],
    overrides
  );

  return {
    area,
    rolls,
    adhesiveQty,
    rollSubtotal,
    adhesiveSubtotal,
    areaTotal: applied.areaTotal,
    lines: applied.lines,
  };
}
