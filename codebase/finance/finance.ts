import { api, APIError } from "encore.dev/api";
import { SQLDatabase } from "encore.dev/storage/sqldb";

const db = new SQLDatabase("finance", {
  migrations: "./migrations",
});

export interface Transaction {
  id: number;
  type: "income" | "expense";
  amount: number;
  category: string;
  description: string;
  transaction_date: string;
  created_at: string;
}

export interface AddParams {
  type: "income" | "expense";
  amount: number;
  category?: string;
  description?: string;
  transaction_date?: string;
}

export const add = api(
  { expose: true, method: "POST", path: "/finance/transactions" },
  async (p: AddParams): Promise<Transaction> => {
    if (p.amount <= 0) {
      throw APIError.invalidArgument("amount must be positive");
    }

    const row = await db.queryRow<Transaction>`
      INSERT INTO transactions (type, amount, category, description, transaction_date)
      VALUES (${p.type}, ${p.amount}, ${p.category ?? "other"}, ${p.description ?? ""}, ${p.transaction_date ?? new Date().toISOString().slice(0, 10)})
      RETURNING id, type, amount, category, description,
        transaction_date::text, created_at::text
    `;
    return row!;
  },
);

export interface ListResponse {
  transactions: Transaction[];
  total: number;
}

export const list = api(
  { expose: true, method: "GET", path: "/finance/transactions" },
  async (): Promise<ListResponse> => {
    const rows = await db.query<Transaction>`
      SELECT id, type, amount, category, description,
        transaction_date::text, created_at::text
      FROM transactions
      ORDER BY transaction_date DESC, id DESC
    `;
    const transactions: Transaction[] = [];
    for await (const row of rows) {
      transactions.push(row);
    }
    return { transactions, total: transactions.length };
  },
);

export interface DeleteParams {
  id: number;
}

export const del = api(
  { expose: true, method: "DELETE", path: "/finance/transactions/:id" },
  async ({ id }: DeleteParams): Promise<void> => {
    const row = await db.queryRow`DELETE FROM transactions WHERE id = ${id} RETURNING id`;
    if (!row) {
      throw APIError.notFound("transaction not found");
    }
  },
);

export interface Summary {
  total_income: number;
  total_expense: number;
  balance: number;
  by_category: { category: string; type: string; total: number }[];
}

export const summary = api(
  { expose: true, method: "GET", path: "/finance/summary" },
  async (p?: { days?: number }): Promise<Summary> => {
    const days = p?.days ?? null;

    const income = await db.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount)::float8, 0) as total FROM transactions
      WHERE type = 'income' AND (${days}::int IS NULL OR transaction_date >= CURRENT_DATE - ${days}::int)
    `;
    const expense = await db.queryRow<{ total: number }>`
      SELECT COALESCE(SUM(amount)::float8, 0) as total FROM transactions
      WHERE type = 'expense' AND (${days}::int IS NULL OR transaction_date >= CURRENT_DATE - ${days}::int)
    `;
    const byCat = await db.query<{ category: string; type: string; total: number }>`
      SELECT category, type, SUM(amount)::float8 as total
      FROM transactions
      WHERE (${days}::int IS NULL OR transaction_date >= CURRENT_DATE - ${days}::int)
      GROUP BY category, type
      ORDER BY total DESC
    `;
    const by_category: { category: string; type: string; total: number }[] = [];
    for await (const row of byCat) {
      by_category.push(row);
    }

    return {
      total_income: income?.total ?? 0,
      total_expense: expense?.total ?? 0,
      balance: (income?.total ?? 0) - (expense?.total ?? 0),
      by_category,
    };
  },
);
