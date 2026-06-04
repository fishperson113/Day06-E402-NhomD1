"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FC, useState } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const POLL_INTERVAL = Number(process.env.NEXT_PUBLIC_POLL_INTERVAL) || 5000;
const LOCALE = process.env.NEXT_PUBLIC_LOCALE || "vi-VN";
const CURRENCY = process.env.NEXT_PUBLIC_CURRENCY || " đ";

const fmt = (n: number) => new Intl.NumberFormat(LOCALE).format(n) + CURRENCY;

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
    <div className="min-h-full container px-4 mx-auto my-16">
      <h2
        className="brand-text text-2xl font-extrabold leading-7 sm:truncate sm:text-3xl sm:tracking-tight"
      >
        Personal Finance
      </h2>
      <main className="pt-8 pb-16 space-y-8">
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

const Card: FC<{ label: string; value: string; color: string }> = ({ label, value, color }) => (
  <div className="rounded-lg border bg-white p-4 shadow">
    <p className="text-sm text-gray-500">{label}</p>
    <p className={`text-xl font-bold ${color}`}>{value}</p>
  </div>
);

const TransactionForm: FC = () => {
  const [type, setType] = useState<"income" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
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
      setCategory("");
      setDescription("");
      setOpen(false);
    },
  });

  if (!open) {
    return (
      <button
        className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700"
        onClick={() => setOpen(true)}
      >
        + Add Transaction
      </button>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="rounded-lg border bg-white p-4 shadow space-y-3"
    >
      <div className="flex gap-3">
        <button
          type="button"
          className={`px-4 py-2 rounded text-sm font-medium ${type === "expense" ? "bg-red-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setType("expense")}
        >
          Expense
        </button>
        <button
          type="button"
          className={`px-4 py-2 rounded text-sm font-medium ${type === "income" ? "bg-green-600 text-white" : "bg-gray-100 text-gray-700"}`}
          onClick={() => setType("income")}
        >
          Income
        </button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <input
          type="number"
          step="1000"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="rounded border p-2 text-sm"
          required
        />
        <input
          type="text"
          placeholder="Category (e.g. food, salary)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded border p-2 text-sm"
        />
      </div>

      <input
        type="text"
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded border p-2 text-sm"
      />

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!amount || parseFloat(amount) <= 0}
          className="rounded bg-indigo-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 hover:bg-indigo-700"
        >
          Save
        </button>
        <button
          type="button"
          className="rounded border px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const TransactionList: FC = () => {
  const queryClient = useQueryClient();

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

  if (isLoading) return <div className="text-gray-300">Loading...</div>;
  if (error) return <div className="text-red-400">{(error as Error).message}</div>;

  return (
    <div>
      <h3 className="section-title text-lg font-semibold mb-3">Transactions</h3>

      {data?.transactions.length === 0 && (
        <p className="text-gray-400 text-center py-8">No transactions yet.</p>
      )}

      <div className="space-y-2">
        {data?.transactions.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border bg-white px-4 py-3 shadow-sm"
          >
            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-medium px-2 py-0.5 rounded ${
                  t.type === "income" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                }`}
              >
                {t.type === "income" ? "IN" : "EX"}
              </span>
              <div>
                <p className="text-sm font-medium text-gray-900">{t.category}</p>
                {t.description && (
                  <p className="text-xs text-gray-500">{t.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span
                className={`text-sm font-semibold ${
                  t.type === "income" ? "text-green-600" : "text-red-600"
                }`}
              >
                {t.type === "income" ? "+" : "-"}
                {fmt(t.amount)}
              </span>
              <button
                className="text-xs text-gray-400 hover:text-red-600"
                onClick={() => doDelete.mutate(t.id)}
              >
                delete
              </button>
            </div>
          </div>
        ))}
      </div>

      {data && data.total > 0 && (
        <p className="text-xs text-gray-400 mt-2">{data.total} transactions</p>
      )}
    </div>
  );
};
