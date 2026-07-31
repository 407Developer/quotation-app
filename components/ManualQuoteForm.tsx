"use client";

import { ManualFormState, STANDARD_ITEMS, QuoteItem } from "@/lib/types";

interface Props {
  form: ManualFormState;
  onChange: (form: ManualFormState) => void;
}

function inputCls(extra = "") {
  return `w-full border border-gray-200 rounded-xl bg-gray-50/50 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]/30 focus:border-[#b89047] focus:bg-white transition-all ${extra}`;
}

export default function ManualQuoteForm({ form, onChange }: Props) {
  function updateItem(key: string, field: "qty" | "rate", value: number) {
    const next = { ...form.items, [key]: { ...form.items[key], [field]: value } };
    if (key === "vinyl" && field === "qty") next.workmanship = { ...next.workmanship, qty: value };
    onChange({ ...form, items: next });
  }

  function updateCustom(i: number, field: keyof QuoteItem, value: string | number) {
    const items = [...form.customItems];
    items[i] = { ...items[i], [field]: value };
    if (field === "qty" || field === "rate") items[i].amount = items[i].qty * items[i].rate;
    onChange({ ...form, customItems: items });
  }

  function addCustom() {
    onChange({ ...form, customItems: [...form.customItems, { description: "", qty: 0, unit: "m²", rate: 0, amount: 0 }] });
  }

  function removeCustom(i: number) {
    onChange({ ...form, customItems: form.customItems.filter((_, idx) => idx !== i) });
  }

  function rowAmount(item: { qty: number; rate: number }) { return item.qty * item.rate; }

  function categoryTotal(cat: string) {
    let total = 0;
    for (const s of STANDARD_ITEMS) {
      if (s.category === cat) total += rowAmount(form.items[s.key]);
    }
    for (const c of form.customItems) {
      const d = c.description.toLowerCase();
      if (cat === "material" && d.includes("vinyl")) total += c.amount;
      if (cat === "accessory" && !d.includes("vinyl") && !d.includes("workmanship")) total += c.amount;
      if (cat === "workmanship" && d.includes("workmanship")) total += c.amount;
    }
    return total;
  }

  const materialTotal = categoryTotal("material");
  const accessoriesTotal = categoryTotal("accessory");
  const workmanshipTotal = categoryTotal("workmanship");
  const grandTotal = materialTotal + accessoriesTotal + workmanshipTotal;

  return (
    <div className="flex flex-col gap-3">
      {/* Client */}
      <Section title="Client">
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <input type="text" className={inputCls("text-left")} placeholder="e.g. Mr Andrew" value={form.client_name} onChange={(e) => onChange({ ...form, client_name: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Date">
              <input type="date" className={inputCls("text-left")} value={form.date} onChange={(e) => onChange({ ...form, date: e.target.value })} />
            </Field>
            <Field label="Title">
              <input type="text" className={inputCls("text-left")} value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} />
            </Field>
          </div>
        </div>
      </Section>

      {/* Items — Mobile */}
      <Section title="Items">
        <div className="sm:hidden flex flex-col gap-2">
          {STANDARD_ITEMS.map((s) => {
            const item = form.items[s.key];
            return (
              <div key={s.key} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/30">
                <div className="text-sm font-medium text-gray-800 mb-2.5">{s.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Qty</label>
                    <input type="number" min="0" className={inputCls()} value={item.qty || ""} onChange={(e) => updateItem(s.key, "qty", Number(e.target.value) || 0)} />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Unit</label>
                    <div className="text-sm text-gray-500 text-center pt-2.5">{s.unit}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-1">Rate</label>
                    <input type="number" min="0" className={inputCls()} value={item.rate || ""} onChange={(e) => updateItem(s.key, "rate", Number(e.target.value) || 0)} />
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-gray-800 mt-2">₦{rowAmount(item).toLocaleString()}</div>
              </div>
            );
          })}
        </div>

        {/* Items — Desktop Table */}
        <div className="hidden sm:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left pb-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Item</th>
                <th className="text-right pb-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Qty</th>
                <th className="text-center pb-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Unit</th>
                <th className="text-right pb-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Rate</th>
                <th className="text-right pb-2.5 text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Amount</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_ITEMS.map((s) => {
                const item = form.items[s.key];
                return (
                  <tr key={s.key} className="border-b border-gray-50">
                    <td className="py-2.5 text-sm text-gray-800">{s.label}</td>
                    <td className="py-2.5"><input type="number" min="0" className="w-full max-w-[80px] ml-auto border border-gray-200 rounded-lg px-2.5 py-1.5 text-right text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#b89047]/30 focus:border-[#b89047] focus:bg-white transition-all" value={item.qty || ""} onChange={(e) => updateItem(s.key, "qty", Number(e.target.value) || 0)} /></td>
                    <td className="py-2.5 text-center text-sm text-gray-500">{s.unit}</td>
                    <td className="py-2.5"><input type="number" min="0" className="w-full max-w-[100px] ml-auto border border-gray-200 rounded-lg px-2.5 py-1.5 text-right text-sm bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-[#b89047]/30 focus:border-[#b89047] focus:bg-white transition-all" value={item.rate || ""} onChange={(e) => updateItem(s.key, "rate", Number(e.target.value) || 0)} /></td>
                    <td className="py-2.5 text-right text-sm font-semibold text-gray-800">₦{rowAmount(item).toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Section>

      {/* Custom */}
      <Section title="Custom Items" action={<button type="button" onClick={addCustom} className="text-[11px] font-semibold text-[#b89047] hover:text-[#a07a30] transition-colors">+ Add</button>}>
        {form.customItems.length === 0 ? (
          <p className="text-sm text-gray-300 text-center py-6 italic">No custom items</p>
        ) : (
          <div className="flex flex-col gap-2">
            {form.customItems.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3.5 bg-gray-50/30">
                <div className="flex flex-col gap-2">
                  <input type="text" placeholder="Description" className={inputCls("text-left")} value={item.description} onChange={(e) => updateCustom(i, "description", e.target.value)} />
                  <div className="grid grid-cols-4 gap-2">
                    <div><label className="block text-[10px] text-gray-400 mb-1">Qty</label><input type="number" min="0" className={inputCls()} value={item.qty || ""} onChange={(e) => updateCustom(i, "qty", Number(e.target.value) || 0)} /></div>
                    <div><label className="block text-[10px] text-gray-400 mb-1">Unit</label><input type="text" className={inputCls("text-center")} value={item.unit} onChange={(e) => updateCustom(i, "unit", e.target.value)} /></div>
                    <div><label className="block text-[10px] text-gray-400 mb-1">Rate</label><input type="number" min="0" className={inputCls()} value={item.rate || ""} onChange={(e) => updateCustom(i, "rate", Number(e.target.value) || 0)} /></div>
                    <div><label className="block text-[10px] text-gray-400 mb-1">Amt</label><div className="pt-2.5 text-sm font-semibold text-gray-800 text-right">₦{(item.qty * item.rate).toLocaleString()}</div></div>
                  </div>
                </div>
                <button type="button" onClick={() => removeCustom(i)} className="w-full text-[11px] text-red-400 hover:text-red-600 font-medium pt-2 transition-colors">Remove</button>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* Summary */}
      <div className="rounded-2xl bg-[#1a2e40]/[0.03] border border-gray-200/60 p-4 sm:p-5">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-3">Summary</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            { label: "Material", value: materialTotal, cls: "bg-white border border-gray-100" },
            { label: "Accessories", value: accessoriesTotal, cls: "bg-white border border-gray-100" },
            { label: "Workmanship", value: workmanshipTotal, cls: "bg-white border border-gray-100" },
            { label: "Total", value: grandTotal, cls: "bg-[#1a2e40] text-white" },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl p-3 ${s.cls}`}>
              <div className={`text-[10px] uppercase tracking-wide font-medium ${s.label === "Total" ? "text-[#b89047]" : "text-gray-400"}`}>{s.label}</div>
              <div className={`text-base font-bold mt-0.5 ${s.label === "Total" ? "text-white" : "text-[#1a2e40]"}`}>₦{s.value.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Section({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl border border-gray-200/80 p-4 sm:p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[11px] text-gray-400 font-medium mb-1.5">{label}</label>
      {children}
    </div>
  );
}
