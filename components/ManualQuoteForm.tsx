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
      if (category === "material" && c.description.toLowerCase().includes("vinyl")) total += c.amount;
      if (category === "accessory" && !c.description.toLowerCase().includes("vinyl") && !c.description.toLowerCase().includes("workmanship")) total += c.amount;
      if (category === "workmanship" && c.description.toLowerCase().includes("workmanship")) total += c.amount;
    }
    return total;
  }

  const materialTotal = categoryTotal("material");
  const accessoriesTotal = categoryTotal("accessory");
  const workmanshipTotal = categoryTotal("workmanship");
  const grandTotal = materialTotal + accessoriesTotal + workmanshipTotal;

  const activeItems = STANDARD_ITEMS.filter((s) => form.items[s.key].qty > 0);

  return (
    <div className="flex flex-col gap-4">
      {/* Client Details */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Client Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Client Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
              value={form.client_name}
              onChange={(e) => onChange({ ...form, client_name: e.target.value })}
              placeholder="e.g. Mr Andrew"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Date</label>
            <input
              type="date"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
              value={form.date}
              onChange={(e) => onChange({ ...form, date: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Project Title</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
            />
          </div>
        </div>
      </div>

      {/* Standard Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide mb-3">
          Flooring Items
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-3 py-2 font-semibold text-gray-700 text-xs uppercase">Item</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700 text-xs uppercase w-20">Qty</th>
                <th className="text-center px-3 py-2 font-semibold text-gray-700 text-xs uppercase w-16">Unit</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700 text-xs uppercase w-28">Rate (₦)</th>
                <th className="text-right px-3 py-2 font-semibold text-gray-700 text-xs uppercase w-28">Amount (₦)</th>
              </tr>
            </thead>
            <tbody>
              {STANDARD_ITEMS.map((s) => {
                const item = form.items[s.key];
                return (
                  <tr key={s.key}>
                    <td className="px-3 py-2 text-gray-800 font-medium">{s.label}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                        value={item.qty || ""}
                        onChange={(e) => updateItem(s.key, "qty", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center text-gray-500">{s.unit}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        min="0"
                        className="w-full border border-gray-300 rounded px-2 py-1 text-right text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                        value={item.rate || ""}
                        onChange={(e) => updateItem(s.key, "rate", Number(e.target.value) || 0)}
                      />
                    </td>
                    <td className="px-3 py-2 text-right font-medium text-gray-800">
                      {rowAmount(item).toLocaleString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Custom Items */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">
            Custom Line Items
          </h3>
          <button
            type="button"
            onClick={addCustom}
            className="text-xs bg-[#1a2e40] text-white px-3 py-1.5 rounded-md hover:bg-[#253d52] transition-colors"
          >
            + Add Item
          </button>
        </div>
        {form.customItems.length === 0 ? (
          <p className="text-sm text-gray-400 italic">No custom items added.</p>
        ) : (
          <div className="space-y-2">
            {form.customItems.map((item, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                  value={item.description}
                  onChange={(e) => updateCustom(i, "description", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Qty"
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                  value={item.qty || ""}
                  onChange={(e) => updateCustom(i, "qty", Number(e.target.value) || 0)}
                />
                <input
                  type="text"
                  placeholder="Unit"
                  className="w-16 border border-gray-300 rounded px-2 py-1.5 text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                  value={item.unit}
                  onChange={(e) => updateCustom(i, "unit", e.target.value)}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Rate"
                  className="w-24 border border-gray-300 rounded px-2 py-1.5 text-sm text-right focus:outline-none focus:ring-2 focus:ring-[#b89047]"
                  value={item.rate || ""}
                  onChange={(e) => updateCustom(i, "rate", Number(e.target.value) || 0)}
                />
                <span className="text-sm font-medium text-gray-800 w-24 text-right">
                  ₦{(item.qty * item.rate).toLocaleString()}
                </span>
                <button
                  type="button"
                  onClick={() => removeCustom(i)}
                  className="text-red-500 hover:text-red-700 text-lg leading-none"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Live Summary */}
      <div className="bg-[#f0ede6] border border-gray-300 rounded-lg p-4">
        <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
          Quote Summary
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase">Material</div>
            <div className="text-lg font-bold text-[#1a2e40]">₦{materialTotal.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase">Accessories</div>
            <div className="text-lg font-bold text-[#1a2e40]">₦{accessoriesTotal.toLocaleString()}</div>
          </div>
          <div className="bg-white rounded p-3 border border-gray-200">
            <div className="text-xs text-gray-500 uppercase">Workmanship</div>
            <div className="text-lg font-bold text-[#1a2e40]">₦{workmanshipTotal.toLocaleString()}</div>
          </div>
          <div className="bg-[#1a2e40] rounded p-3">
            <div className="text-xs text-[#b89047] uppercase font-bold">Grand Total</div>
            <div className="text-lg font-bold text-white">₦{grandTotal.toLocaleString()}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
