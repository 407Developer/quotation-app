import { flooringRules, paintRules, tileRules, wallpaperRules } from "./rules.js";

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

export function computeFlooring({ length, breadth, doors, skirtingNeeded, floorType, prices }) {
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
    areaTotal,
    lines: [
      {
        label: `Flooring (${floorType.toUpperCase()})`,
        qty: floorArea,
        unit: "sqm",
        subtotal: floorSubtotal,
      },
      ...(skirtingNeeded === "yes"
        ? [
            { label: "Skirting", qty: skirtingQty, unit: "pcs", subtotal: skirtingSubtotal },
            { label: "Filler", qty: fillerQty, unit: "bags", subtotal: fillerSubtotal },
            {
              label: "Skirting Gum",
              qty: skirtingGumQty,
              unit: "pcs",
              subtotal: skirtingGumSubtotal,
            },
          ]
        : []),
      ...(floorType === "vinyl" && floorGum > 0
        ? [{ label: "Floor Gum", qty: floorGum, unit: "pcs", subtotal: floorGumSubtotal }]
        : []),
      ...(doorEndProfiles > 0
        ? [
            {
              label: "Door Profiles",
              qty: doorEndProfiles,
              unit: "pcs",
              subtotal: doorProfileSubtotal,
            },
          ]
        : []),
    ],
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

export function computeTiles({ area, tileSizeCm, prices }) {
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
    areaTotal,
    lines: [
      { label: "Tiles", qty: tileCount, unit: "pcs", subtotal: tileSubtotal },
      { label: "Tile Gum", qty: tileGumQty, unit: "bags", subtotal: tileGumSubtotal },
      { label: "Cement", qty: cementQty, unit: "bags", subtotal: cementSubtotal },
      { label: "Sand", qty: sandQty, unit: "tons", subtotal: sandSubtotal },
    ],
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

export function computePaint({ area, coats, prices }) {
  const appliedCoats = coats || paintRules.measures.defaultCoats;
  const primerQty = Math.ceil(area / paintRules.measures.primerCoverage);
  const paintQty = Math.ceil((area * appliedCoats) / paintRules.measures.paintCoverage);

  const primerSubtotal = primerQty * prices.primer;
  const paintSubtotal = area * prices.paint;
  const areaTotal = paintSubtotal + primerSubtotal;

  return {
    area,
    coats: appliedCoats,
    primerQty,
    paintQty,
    primerSubtotal,
    paintSubtotal,
    areaTotal,
    lines: [
      { label: "Painting", qty: area, unit: "sqm", subtotal: paintSubtotal },
      { label: "Primer", qty: primerQty, unit: "cans", subtotal: primerSubtotal },
    ],
  };
}

export function getWallpaperPrices({ rollPrice, adhesivePrice }) {
  const defaults = wallpaperRules.defaults;
  return {
    roll: rollPrice ? rollPrice : defaults.rollPrice,
    adhesive: adhesivePrice ? adhesivePrice : defaults.adhesivePrice,
  };
}

export function computeWallpaper({ area, prices }) {
  const rolls = Math.ceil((area / wallpaperRules.measures.rollCoverage) * (1 + wallpaperRules.measures.wasteRate));
  const adhesiveQty = Math.ceil(area / wallpaperRules.measures.adhesiveCoverage);
  const rollSubtotal = rolls * prices.roll;
  const adhesiveSubtotal = adhesiveQty * prices.adhesive;
  const areaTotal = rollSubtotal + adhesiveSubtotal;

  return {
    area,
    rolls,
    adhesiveQty,
    rollSubtotal,
    adhesiveSubtotal,
    areaTotal,
    lines: [
      { label: "Wallpaper Rolls", qty: rolls, unit: "rolls", subtotal: rollSubtotal },
      { label: "Adhesive", qty: adhesiveQty, unit: "cans", subtotal: adhesiveSubtotal },
    ],
  };
}
