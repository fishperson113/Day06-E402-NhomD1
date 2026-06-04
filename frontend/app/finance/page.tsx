"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL) || 5000;
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || " đ";

const CATEGORIES = ["food", "salary", "transport", "entertainment", "utilities", "healthcare", "education", "shopping", "other"];

const CATEGORY_ICONS: Record<string, string> = {
  food: "🍽️", salary: "💼", transport: "🚗", entertainment: "🎬",
  utilities: "💡", healthcare: "🏥", education: "📚", shopping: "🛍️", other: "📌",
};

const fmt = (n: number) => new Intl.NumberFormat(LOCALE).format(n) + CURRENCY;
const TR = "background 0.35s ease, color 0.35s ease, border-color 0.35s ease, box-shadow 0.35s ease";

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
    <div className="container px-4 mx-auto py-12">
      <main className="space-y-8 pb-16">
        <SummaryCards />
        <TransactionForm />
        <TransactionList />
      </main>
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
      <Card label="Income"  value={fmt(data?.total_income  ?? 0)} colorVar="--income-color"   />
      <Card label="Expense" value={fmt(data?.total_expense ?? 0)} colorVar="--expense-color"  />
      <Card
        label="Balance"
        value={fmt(data?.balance ?? 0)}
        colorVar={data && data.balance >= 0 ? "--balance-positive" : "--balance-negative"}
      />
    </div>
  );
};

const CARD_VARS: Record<string, { bg: string; border: string }> = {
  Income:  { bg: "--card-income-bg",  border: "--card-income-border"  },
  Expense: { bg: "--card-expense-bg", border: "--card-expense-border" },
  Balance: { bg: "--card-balance-bg", border: "--card-balance-border" },
};
const CARD_ICONS: Record<string, string> = { Income: "📈", Expense: "📉", Balance: "💰" };

const Card: FC<{ label: string; value: string; colorVar: string }> = ({ label, value, colorVar }) => {
  const vars = CARD_VARS[label] ?? CARD_VARS.Balance;
  return (
    <div
      className="rounded-xl p-6 shadow-lg"
      style={{
        background: `var(${vars.bg})`,
        border: `2px solid var(${vars.border})`,
        transition: TR,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold" style={{ color: "var(--label-color)", transition: "color 0.35s ease" }}>
          {label}
        </p>
        <span className="text-2xl">{CARD_ICONS[label]}</span>
      </div>
      <p className="text-3xl font-bold" style={{ color: `var(${colorVar})`, transition: "color 0.35s ease" }}>
        {value}
      </p>
    </div>
  );
};

const TransactionForm: FC = () => {
  const [type, setType]               = useState<"income" | "expense">("expense");
  const [amount, setAmount]           = useState("");
  const [category, setCategory]       = useState("food");
  const [description, setDescription] = useState("");
  const [open, setOpen]               = useState(false);

  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      const resp = await fetch(`${API_URL}/finance/transactions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, amount: parseFloat(amount), category, description }),
      });
      if (!resp.ok) throw new Error(await resp.text());
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-summary"] });
      queryClient.invalidateQueries({ queryKey: ["finance-transactions"] });
      setAmount(""); setCategory("food"); setDescription(""); setOpen(false);
    },
  });

  const isValid = !!amount && parseFloat(amount) > 0;

  const fieldStyle: React.CSSProperties = {
    background: "var(--input-bg)",
    border: "2px solid var(--input-border)",
    color: "var(--input-text)",
    borderRadius: "8px",
    padding: "10px 14px",
    fontSize: "14px",
    width: "100%",
    transition: TR,
  };

  const labelStyle: React.CSSProperties = {
    display: "block",
    fontSize: "13px",
    fontWeight: 700,
    color: "var(--text-primary)",
    marginBottom: "6px",
    transition: "color 0.35s ease",
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm font-semibold text-white"
        style={{ background: "linear-gradient(135deg, #6366f1, #7c3aed)", boxShadow: "0 4px 14px rgba(99,102,241,0.4)" }}
      >
        <span>✨</span> Add Transaction
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => { e.preventDefault(); if (isValid) save.mutate(); }}
      className="rounded-xl p-8 space-y-6"
      style={{
        background: "var(--card-bg)",
        border: "2px solid var(--card-border)",
        boxShadow: "var(--card-shadow)",
        transition: TR,
      }}
    >
      {/* Type */}
      <div className="space-y-2">
        <label style={labelStyle}>Type</label>
        <div className="flex gap-3">
          {(["expense", "income"] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm"
              style={{
                background: type === t
                  ? t === "expense" ? "var(--expense-color)" : "var(--income-color)"
                  : "var(--type-inactive-bg)",
                color: type === t ? "#ffffff" : "var(--type-inactive-text)",
                transform: type === t ? "scale(1.03)" : "scale(1)",
                boxShadow: type === t ? "0 4px 12px rgba(0,0,0,0.2)" : "none",
                transition: TR,
              }}
            >
              {t === "expense" ? "📉 Expense" : "📈 Income"}
            </button>
          ))}
        </div>
      </div>

      {/* Amount & Category */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label style={labelStyle}>Amount</label>
          <input
            type="number" step="1000" placeholder="0"
            value={amount} onChange={(e) => setAmount(e.target.value)}
            className="themed-input" style={fieldStyle} required
          />
        </div>
        <div>
          <label style={labelStyle}>Category</label>
          <select
            value={category} onChange={(e) => setCategory(e.target.value)}
            className="themed-select" style={fieldStyle}
          >
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_ICONS[cat]} {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Description */}
      <div>
        <label style={labelStyle}>Description (optional)</label>
        <input
          type="text" placeholder="Add a note..."
          value={description} onChange={(e) => setDescription(e.target.value)}
          className="themed-input" style={fieldStyle}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={!isValid || save.isPending}
          className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm text-white disabled:opacity-40"
          style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: isValid ? "0 4px 12px rgba(16,185,129,0.35)" : "none" }}
        >
          {save.isPending ? "💾 Saving..." : "✓ Save"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="flex-1 px-4 py-3 rounded-lg font-semibold text-sm"
          style={{
            background: "var(--type-inactive-bg)",
            color: "var(--type-inactive-text)",
            transition: TR,
          }}
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

  if (isLoading) return (
    <p className="text-center py-8 animate-pulse" style={{ color: "var(--text-muted)" }}>
      ⏳ Loading transactions...
    </p>
  );
  if (error) return (
    <div className="rounded-lg p-4 font-semibold"
      style={{ background: "var(--badge-expense-bg)", color: "var(--expense-color)", border: "2px solid var(--card-expense-border)" }}>
      ❌ {(error as Error).message}
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <h3 className="section-title text-xl font-bold">📋 Transactions</h3>
        {data && data.total > 0 && (
          <span
            className="px-3 py-1 rounded-full text-sm font-semibold"
            style={{ background: "var(--count-bg)", color: "var(--count-text)", transition: TR }}
          >
            {data.total}
          </span>
        )}
      </div>

      {data?.transactions.length === 0 && (
        <div
          className="rounded-xl border-2 border-dashed p-12 text-center"
          style={{ background: "var(--empty-bg)", borderColor: "var(--empty-border)", transition: TR }}
        >
          <p className="text-4xl mb-3">📭</p>
          <p className="font-medium" style={{ color: "var(--empty-text)" }}>
            No transactions yet. Add one to get started!
          </p>
        </div>
      )}

      <div className="space-y-3">
        {data?.transactions.map((t) => (
          <div
            key={t.id}
            className="rounded-xl p-4 shadow-md"
            style={{
              background: "var(--card-bg)",
              border: `2px solid var(${t.type === "income" ? "--card-income-border" : "--card-expense-border"})`,
              boxShadow: "var(--card-shadow)",
              transition: TR,
            }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1">
                <div className="flex flex-col items-center gap-2">
                  <span className="text-3xl">{CATEGORY_ICONS[t.category] ?? "📌"}</span>
                  <span
                    className="px-2 py-0.5 rounded-full text-xs font-bold"
                    style={{
                      background: t.type === "income" ? "var(--badge-income-bg)" : "var(--badge-expense-bg)",
                      color:      t.type === "income" ? "var(--badge-income-text)" : "var(--badge-expense-text)",
                      transition: TR,
                    }}
                  >
                    {t.type === "income" ? "+" : "−"}
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold capitalize text-lg" style={{ color: "var(--text-primary)", transition: "color 0.35s ease" }}>
                    {t.category}
                  </p>
                  {t.description && (
                    <p className="text-sm mt-1" style={{ color: "var(--text-secondary)", transition: "color 0.35s ease" }}>
                      {t.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <span
                  className="text-2xl font-bold"
                  style={{
                    color: t.type === "income" ? "var(--income-color)" : "var(--expense-color)",
                    transition: "color 0.35s ease",
                  }}
                >
                  {t.type === "income" ? "+" : "−"}{fmt(t.amount)}
                </span>
                <button
                  onMouseEnter={() => setDeleteHover(t.id)}
                  onMouseLeave={() => setDeleteHover(null)}
                  onClick={() => doDelete.mutate(t.id)}
                  className="px-3 py-1.5 rounded-lg font-semibold text-xs"
                  style={{
                    background: deleteHover === t.id ? "var(--expense-color)" : "var(--type-inactive-bg)",
                    color:      deleteHover === t.id ? "#ffffff" : "var(--delete-color)",
                    transition: TR,
                  }}
                >
                  {deleteHover === t.id ? "🗑️ Delete?" : "✕"}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data && data.total > 0 && (
        <p
          className="text-xs text-center mt-4 pt-4"
          style={{ color: "var(--text-muted)", borderTop: "1px solid var(--footer-border)" }}
        >
          Total: {data.total} {data.total === 1 ? "transaction" : "transactions"}
        </p>
      )}
    </div>
  );
};
