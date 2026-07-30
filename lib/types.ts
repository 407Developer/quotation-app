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
