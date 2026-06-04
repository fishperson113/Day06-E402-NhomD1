"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL) || 5000;
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || " đ";

const CATEGORIES = ["food", "salary", "transport", "entertainment", "utilities", "healthcare", "education", "shopping", "other"];

const fmt = (n: number) => new Intl.NumberFormat(LOCALE).format(n) + CURRENCY;

const getCategoryIcon = (category: string): string => {
  const icons: Record<string, string> = {
    food: "🍽️",
    salary: "💼",
    transport: "🚗",
    entertainment: "🎬",
    utilities: "💡",
    healthcare: "🏥",
    education: "📚",
    shopping: "🛍️",
    other: "📌",
  };
  return icons[category] || "📌";
};

interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
}

interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: { category: string; type: string; total: number }[];
}

export default function FinancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-gray-100">
      <div className="container px-4 mx-auto py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-2">
            💰 Personal Finance
          </h1>
          <p className="text-gray-600 text-lg">Manage your income and expenses with ease</p>
        </div>

        <main className="space-y-8 pb-16">
          <SummaryCards />
          <TransactionForm />
          <TransactionList />
        </main>
      </div>
    </div>
  );
}

const SummaryCards: FC = () => {
  const { data } = useQuery<Summary>({
    queryKey: ["finance-summary"],
    queryFn: () => fetch(`${API_URL}/finance/summary`).then((r) => r.json()),
    refetchInterval: POLL_INTERVAL,
  });

  return (
    <div className="grid grid-cols-3 gap-4">
      <Card label="Income" value={fmt(data?.total_income ?? 0)} color="text-green-600" />
      <Card label="Expense" value={fmt(data?.total_expense ?? 0)} color="text-red-600" />
      <Card
        label="Balance"
        value={fmt(data?.balance ?? 0)}
        color={data && data.balance >= 0 ? "text-blue-600" : "text-red-600"}
      />
    </div>
  );
};

const Card: FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => {
  const icons: Record<string, string> = {
    "Income": "📈",
    "Expense": "📉",
    "Balance": "💰",
  };
  const icon = icons[label] || "•";

  return (
    <div className={`rounded-xl border-2 bg-gradient-to-br p-6 shadow-lg transition-all hover:shadow-xl ${
      label === "Income" ? "from-green-50 to-green-100 border-green-200" :
      label === "Expense" ? "from-red-50 to-red-100 border-red-200" :
      "from-blue-50 to-indigo-100 border-blue-200"
    }`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className={`text-3xl font-bold ${color}`}>{value}</p>
    </div>
  );
};

const TransactionForm: FC = () => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);

  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`${API_URL}/finance/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          amount: parseFloat(amount),
          category: category || "other",
          description,
        }),
      });
      if (!resp.ok) throw new Error(await resp.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      setAmount("");
      setCategory("food");
      setDescription("");
      setOpen(false);
    },
  });

  const isValid = amount && parseFloat(amount) > 0;

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-indigo-700 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:from-indigo-700 hover:to-indigo-800 hover:shadow-xl transition-all active:scale-95"
      >
        <span>✨</span> Add Transaction
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isValid) save.mutate();
      }}
      className="rounded-xl border-2 border-gray-200 bg-white p-8 shadow-lg space-y-6"
    >
      {/* Type Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-bold text-gray-800">Type</label>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => setType("expense")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              type === "expense"
                ? "bg-red-500 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📉 Expense
          </button>
          <button
            type="button"
            onClick={() => setType("income")}
            className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
              type === "income"
                ? "bg-green-500 text-white shadow-lg scale-105"
                : "bg-gray-100 text-gray-700 hover:bg-gray-200"
            }`}
          >
            📈 Income
          </button>
        </div>
      </div>

      {/* Amount & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">Amount</label>
          <input
            type="number"
            step="1000"
            placeholder="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
            required
          />
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-bold text-gray-800">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {getCategoryIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-bold text-gray-800">Description (optional)</label>
        <input
          type="text"
          placeholder="Add a note..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border-2 border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none transition-all"
        />
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={!isValid || save.isPending}
          className={`flex-1 px-4 py-3 rounded-lg font-semibold text-sm transition-all ${
            isValid && !save.isPending
              ? "bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg hover:from-green-600 hover:to-emerald-700 active:scale-95"
              : "bg-gray-200 text-gray-400 cursor-not-allowed"
          }`}
        >
          {save.isPending ? "💾 Saving..." : "✓ Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all active:scale-95"
        >
          ✕ Cancel
        </button>
      </div>
    </form>
  );
};

const TransactionList: FC = () => {
  const queryClient = useQueryClient();
  const [deleteHover, setDeleteHover] = useState<number | null>(null);

  const { data, isLoading, error } = useQuery<{ transactions: Transaction[]; total: number }>({
    queryKey: ["finance-transactions"],
    queryFn: () => fetch(`${API_URL}/finance/transactions`).then((r) => r.json()),
    refetchInterval: POLL_INTERVAL,
  });

  const doDelete = useMutation({
    mutationFn: (id: number) =>
      fetch(`${API_URL}/finance/transactions/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
    },
  });

  if (isLoading) return <div className="text-center py-8"><p className="text-gray-400 animate-pulse">⏳ Loading transactions...</p></div>;
  if (error) return <div className="rounded-lg bg-red-50 border-2 border-red-200 p-4 text-red-600 font-semibold">❌ Error: {(error as Error).message}</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="section-title text-xl font-bold text-gray-800">
          📋 Transactions
          {data && data.total > 0 && (
            <span className="ml-2 inline-block px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-sm font-semibold">
              {data.total}
            </span>
          )}
        </h3>
      </div>

      {data?.transactions.length === 0 && (
        <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300 p-12 text-center">
          <p className="text-4xl mb-3">📭</p>
          <p className="text-gray-500 font-medium">No transactions yet. Add one to get started!</p>
        </div>
      )}

      <div className="space-y-3">
        {data?.transactions.map((t) => (
          <div
            key={t.id}
            className={`rounded-xl border-2 bg-white p-4 shadow-md transition-all hover:shadow-lg ${
              t.type === "income" ? "border-green-200" : "border-red-200"
            }`}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                {/* Icon & Badge */}
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{getCategoryIcon(t.category)}</span>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold ${
                      t.type === "income"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {t.type === "income" ? "+" : "-"}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <p className="font-bold text-gray-900 capitalize text-lg">
                    {t.category}
                  </p>
                  {t.description && (
                    <p className="text-sm text-gray-600 mt-1">{t.description}</p>
                  )}
                </div>
              </div>

              {/* Amount & Delete */}
              <div className="flex flex-col items-end gap-3">
                <span
                  className={`text-2xl font-bold ${
                    t.type === "income" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {t.type === "income" ? "+" : "-"}
                  {fmt(t.amount)}
                </span>
                <button
                  onMouseEnter={() => setDeleteHover(t.id)}
                  onMouseLeave={() => setDeleteHover(null)}
                  onClick={() => doDelete.mutate(t.id)}
                  className={`px-3 py-1.5 rounded-lg font-semibold text-xs transition-all ${
                    deleteHover === t.id
                      ? "bg-red-500 text-white shadow-lg"
                      : "bg-gray-200 text-gray-600 hover:bg-gray-300"
                  }`}
                >
                  {deleteHover === t.id ? "🗑️ Delete?" : "✕"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.total > 0 && (
        <p className="text-xs text-gray-400 text-center mt-4 pt-4 border-t">
          Total: {data.total} {data.total === 1 ? "transaction" : "transactions"}
        </p>
      )}
    </div>
  );
};
