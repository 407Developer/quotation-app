export const flooringRules = {
  defaults: {
    vinylPrice: 9000,
    spcPrice: 17000,
    skirtingPrice: 10000,
    floorGumPrice: 4000,
    fillerPrice: 4000,
    skirtingGumPrice: 4000,
  },
  measures: {
    skirtingBoardLength: 2.9,
    doorWidth: 0.9,
    floorGumCoverage: 20,
    doorProfileCoverage: 2.4,
  },
};

export const tileRules = {
  defaults: {
    tilePrice: 8500,
    tileGumPrice: 5000,
    cementPrice: 5000,
    sandPrice: 3500,
  },
  measures: {
    tileSizeCm: 60,
    wasteRate: 0.1,
    tileGumCoverage: 5,
    cementCoverage: 6,
    sandCoverage: 10,
  },
};

export const paintRules = {
  defaults: {
    paintPrice: 2000,
    primerPrice: 1500,
  },
  measures: {
    primerCoverage: 12,
    paintCoverage: 10,
    defaultCoats: 2,
  },
};

export const wallpaperRules = {
  defaults: {
    rollPrice: 12000,
    adhesivePrice: 4000,
  },
  measures: {
    rollCoverage: 5,
    adhesiveCoverage: 20,
    wasteRate: 0.08,
  },
};
