export interface QuoteItem {
  description: string;
  qty: number;
  unit: string;
  rate: number;
  amount: number;
}

export interface QuoteData {
  client_name: string;
  date: string;
  title: string;
  company: {
    name: string;
    subtitle: string;
    phone: string;
  };
  items: QuoteItem[];
  summary: {
    material_total: number;
    material_sub: string;
    accessories_total: number;
    accessories_sub: string;
    workmanship_total: number;
    workmanship_sub: string;
    grand_total: number;
  };
}

export interface StandardItem {
  key: string;
  label: string;
  unit: string;
  defaultRate: number;
  category: "material" | "accessory" | "workmanship";
}

export const STANDARD_ITEMS: StandardItem[] = [
  { key: "vinyl", label: "Vinyl Flooring Material", unit: "m²", defaultRate: 9000, category: "material" },
  { key: "skirting", label: "Skirting Boards", unit: "Pcs", defaultRate: 9000, category: "accessory" },
  { key: "doorStrip", label: "Door Transition Strip", unit: "Pcs", defaultRate: 10000, category: "accessory" },
  { key: "vta", label: "VTA Adhesive / Gum", unit: "Buckets", defaultRate: 20000, category: "accessory" },
  { key: "filler", label: "Filler", unit: "Tins", defaultRate: 4000, category: "accessory" },
  { key: "skirtingGum", label: "Skirting Gum", unit: "Tins", defaultRate: 4000, category: "accessory" },
  { key: "workmanship", label: "Workmanship / Installation", unit: "m²", defaultRate: 1500, category: "workmanship" },
];

export interface ManualFormState {
  client_name: string;
  date: string;
  title: string;
  items: Record<string, { qty: number; rate: number }>;
  customItems: QuoteItem[];
}
