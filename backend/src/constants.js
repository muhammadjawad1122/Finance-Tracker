export const DB_NAME = "financeTracker";

export const TRANSACTION_TYPES = {
  INCOME: "income",
  EXPENSE: "expense",
};

export const DEFAULT_CATEGORIES = [
  // Expense categories
  { name: "Food & Dining", type: "expense", color: "#FF6384" },
  { name: "Transportation", type: "expense", color: "#36A2EB" },
  { name: "Shopping", type: "expense", color: "#FFCE56" },
  { name: "Bills & Utilities", type: "expense", color: "#4BC0C0" },
  { name: "Entertainment", type: "expense", color: "#9966FF" },
  { name: "Health", type: "expense", color: "#FF9F40" },
  { name: "Education", type: "expense", color: "#C9CBCF" },
  { name: "Rent", type: "expense", color: "#7C4DFF" },
  { name: "Other Expense", type: "expense", color: "#607D8B" },

  // Income categories
  { name: "Salary", type: "income", color: "#4CAF50" },
  { name: "Freelancing", type: "income", color: "#8BC34A" },
  { name: "Business", type: "income", color: "#00BCD4" },
  { name: "Investments", type: "income", color: "#009688" },
  { name: "Other Income", type: "income", color: "#2196F3" },
];