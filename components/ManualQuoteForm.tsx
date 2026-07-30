"use client";

import { ManualFormState, STANDARD_ITEMS, QuoteItem } from "@/lib/types";

interface Props {
  form: ManualFormState;
  onChange: (form: ManualFormState) => void;
}

export default function ManualQuoteForm({ form, onChange }: Props) {
  function updateItem(key: string, field: "qty" | "rate", value: number) {
    const next = { ...form.items, [key]: { ...form.items[key], [field]: value } };

    if (key === "vinyl" && field === "qty") {
      next.workmanship = { ...next.workmanship, qty: value };
    }

    onChange({ ...form, items: next });
  }

  function updateCustom(index: number, field: keyof QuoteItem, value: string | number) {
    const items = [...form.customItems];
    items[index] = { ...items[index], [field]: value };
    if (field === "qty" || field === "rate") {
      items[index].amount = items[index].qty * items[index].rate;
    }
    onChange({ ...form, customItems: items });
  }

  function addCustom() {
    onChange({
      ...form,
      customItems: [
        ...form.customItems,
        { description: "", qty: 0, unit: "m²", rate: 0, amount: 0 },
      ],
    });
  }

  function removeCustom(index: number) {
    onChange({
      ...form,
      customItems: form.customItems.filter((_, i) => i !== index),
    });
  }

  function rowAmount(item: { qty: number; rate: number }) {
    return item.qty * item.rate;
  }

  function categoryTotal(category: string) {
    let total = 0;
    for (const s of STANDARD_ITEMS) {
      if (s.category === category) {
        total += rowAmount(form.items[s.key]);
      }
    }
    for (const c of form.customItems) {
      const desc = c.description.toLowerCase();
      if (category === "material" && desc.includes("vinyl")) total += c.amount;
      if (category === "accessory" && !desc.includes("vinyl") && !desc.includes("workmanship")) total += c.amount;
      if (category === "workmanship" && desc.includes("workmanship")) total += c.amount;
    }
    return total;
  }

  const materialTotal = categoryTotal("material");
  const accessoriesTotal = categoryTotal("accessory");
  const workmanshipTotal = categoryTotal("workmanship");
  const grandTotal = materialTotal + accessoriesTotal + workmanshipTotal;

  function inputCls(extra = "") {
    return `w-full border border-gray-300 rounded-xl bg-white px-3 py-2.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent transition-shadow ${extra}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Client Details */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Client Details
        </h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Client Name</label>
            <input
              type="text"
              className={inputCls("text-left")}
              value={form.client_name}
              onChange={(e) => onChange({ ...form, client_name: e.target.value })}
              placeholder="e.g. Mr Andrew"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Date</label>
              <input
                type="date"
                className={inputCls("text-left")}
                value={form.date}
                onChange={(e) => onChange({ ...form, date: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1.5">Phone</label>
              <input
                type="tel"
                className={inputCls("text-left")}
                placeholder="Optional"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1.5">Project Title</label>
            <input
              type="text"
              className={inputCls("text-left")}
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
            />
          </div>
        </div>
      </section>

      {/* Standard Items */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Flooring Items
        </h3>

        {/* Mobile: card layout */}
        <div className="sm:hidden flex flex-col gap-2">
          {STANDARD_ITEMS.map((s) => {
            const item = form.items[s.key];
            return (
              <div key={s.key} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                <div className="text-sm font-medium text-gray-800 mb-2">{s.label}</div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="0"
                      className={inputCls()}
                      value={item.qty || ""}
                      onChange={(e) => updateItem(s.key, "qty", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Unit</label>
                    <div className="text-sm text-gray-500 text-center pt-2.5">{s.unit}</div>
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Rate</label>
                    <input
                      type="number"
                      min="0"
                      className={inputCls()}
                      value={item.rate || ""}
                      onChange={(e) => updateItem(s.key, "rate", Number(e.target.value) || 0)}
                    />
                  </div>
                </div>
                <div className="text-right text-sm font-semibold text-gray-800 mt-1.5">
                  ₦{rowAmount(item).toLocaleString()}
                </div>
              </div>
            );
          })}
        </div>

        {/* Desktop: table layout */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-600 text-xs uppercase">Item</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-20">Qty</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-14">Unit</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-28">Rate (₦)</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-600 text-xs uppercase w-28">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_ITEMS.map((s) => {
                const item = form.items[s.key];
                return (
                  <tr key={s.key} className="border-t border-gray-100">
                    <td className="px-3 py-2.5 text-gray-800 font-medium text-sm">{s.label}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                        value={item.qty || ""}
                        onChange={(e) => updateItem(s.key, "qty", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-center text-gray-500 text-sm">{s.unit}</td>
                    <td className="px-3 py-2.5">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded-lg px-2 py-1.5 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                        value={item.rate || ""}
                        onChange={(e) => updateItem(s.key, "rate", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800 text-sm">
                      ₦{rowAmount(item).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Custom Items */}
      <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Custom Items
          </h3>
          <button
            type="button"
            onClick={addCustom}
            className="text-xs bg-[#1a2e40] text-white px-3 py-1.5 rounded-lg hover:bg-[#253d52] transition-colors font-medium"
          >
            + Add
          </button>
        </div>
        {form.customItems.length === 0 ? (
          <p className="text-sm text-gray-400 italic text-center py-4">No custom items added.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {form.customItems.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3 bg-gray-50/50">
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div className="col-span-2">
                    <label className="block text-[10px] text-gray-400 mb-0.5">Description</label>
                    <input
                      type="text"
                      placeholder="e.g. Underlay"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                      value={item.description}
                      onChange={(e) => updateCustom(i, "description", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="0"
                      placeholder="0"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                      value={item.qty || ""}
                      onChange={(e) => updateCustom(i, "qty", Number(e.target.value) || 0)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 mb-0.5">Unit</label>
                    <input
                      type="text"
                      placeholder="m²"
                      className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                      value={item.unit}
                      onChange={(e) => updateCustom(i, "unit", e.target.value)}
                    />
                  </div>
                  <div className="col-span-2 grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Rate (₦)</label>
                      <input
                        type="number"
                        min="0"
                        placeholder="0"
                        className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#b89047] focus:border-transparent"
                        value={item.rate || ""}
                        onChange={(e) => updateCustom(i, "rate", Number(e.target.value) || 0)}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-400 mb-0.5">Amount</label>
                      <div className="pt-2 text-sm font-semibold text-gray-800 text-right">
                        ₦{(item.qty * item.rate).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => removeCustom(i)}
                  className="w-full text-xs text-red-500 hover:text-red-700 font-medium py-1"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Live Summary */}
      <section className="bg-[#f0ede6] rounded-2xl border border-gray-200 p-4 shadow-sm">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Summary
        </h3>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Material</div>
            <div className="text-base font-bold text-[#1a2e40]">₦{materialTotal.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Accessories</div>
            <div className="text-base font-bold text-[#1a2e40]">₦{accessoriesTotal.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded-xl p-3 border border-gray-100">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">Workmanship</div>
            <div className="text-base font-bold text-[#1a2e40]">₦{workmanshipTotal.toLocaleString()}</div>
          </div>
          <div className="bg-[#1a2e40] rounded-xl p-3">
            <div className="text-[10px] text-[#b89047] uppercase tracking-wide font-semibold">Total</div>
            <div className="text-base font-bold text-white">₦{grandTotal.toLocaleString()}</div>
          </div>
        </div>
      </section>
    </div>
  );
}
