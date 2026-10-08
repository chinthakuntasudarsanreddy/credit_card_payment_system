
import { useEffect, useState } from "react";
import { useTheme } from "../context/ThemeContext";
import api from "../services/api";

const FASTAPI_URL = "http://localhost:8001";

function Dashboard() {
  const { darkMode, toggleDarkMode } = useTheme();

  const [summary, setSummary] = useState({
    total_transactions: 0,
    total_amount_spent: "0.00",
    current_month_spending: "0.00",
    available_credit_limit: "0.00",
    last_5_transactions: [],
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboardSummary = async () => {
    try {
      setLoading(true);
      setError("");

      const accessToken = localStorage.getItem("access_token");

      if (!accessToken) {
        throw new Error("No access token found. Please login again.");
      }

      const response = await fetch(`${FASTAPI_URL}/dashboard/summary`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail || `Dashboard API returned ${response.status}`
        );
      }

      console.log("Dashboard API response:", data);

      setSummary({
        total_transactions: Number(data.total_transactions ?? 0),
        total_amount_spent: data.total_amount_spent ?? "0.00",
        current_month_spending: data.current_month_spending ?? "0.00",
        available_credit_limit: data.available_credit_limit ?? "0.00",
        last_5_transactions: Array.isArray(data.last_5_transactions)
          ? data.last_5_transactions
          : [],
      });
    } catch (err) {
      console.error("Dashboard API error:", err);

      setError(
        err.message || "Unable to load dashboard data."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardSummary();
  }, []);

  const formatAmount = (amount) => {
    return Number(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (date) => {
    if (!date) return "-";

    const parsedDate = new Date(date);

    if (Number.isNaN(parsedDate.getTime())) {
      return "-";
    }

    return parsedDate.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";

      case "FAILED":
        return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300";

      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Dashboard
            </h1>

            <p className="mt-1 text-slate-600 dark:text-slate-400">
              Overview of your credit card activity
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={toggleDarkMode}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              {darkMode ? "☀️ Light Mode" : "🌙 Dark Mode"}
            </button>

            <button
              type="button"
              onClick={fetchDashboardSummary}
              disabled={loading}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Loading..." : "Refresh"}
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300">
            <strong>Dashboard Error:</strong> {error}
          </div>
        )}

        {/* Statistics */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

          {/* Total Spent */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Spent
              </p>

              <span className="rounded-lg bg-blue-100 px-3 py-2 text-lg dark:bg-blue-900/40">
                ₹
              </span>
            </div>

            <p className="text-3xl font-bold">
              ₹{formatAmount(summary.total_amount_spent)}
            </p>
          </div>

          {/* Available Credit */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Available Credit
              </p>

              <span className="rounded-lg bg-green-100 px-3 py-2 text-lg dark:bg-green-900/40">
                ✓
              </span>
            </div>

            <p className="text-3xl font-bold">
              ₹{formatAmount(summary.available_credit_limit)}
            </p>
          </div>

          {/* Total Transactions */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                Total Transactions
              </p>

              <span className="rounded-lg bg-purple-100 px-3 py-2 text-lg dark:bg-purple-900/40">
                #
              </span>
            </div>

            <p className="text-3xl font-bold">
              {summary.total_transactions}
            </p>
          </div>

          {/* Monthly Spending */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                This Month Spending
              </p>

              <span className="rounded-lg bg-orange-100 px-3 py-2 text-lg dark:bg-orange-900/40">
                📅
              </span>
            </div>

            <p className="text-3xl font-bold">
              ₹{formatAmount(summary.current_month_spending)}
            </p>
          </div>
        </div>

        {/* Last 5 Transactions */}
        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">

          <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
            <h2 className="text-xl font-bold">
              Last 5 Transactions
            </h2>

            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Your most recent payment activity
            </p>
          </div>

          {loading ? (
            <div className="space-y-4 p-6">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-12 animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800"
                />
              ))}
            </div>
          ) : summary.last_5_transactions.length === 0 ? (
            <div className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
              No transactions found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px]">

                <thead className="bg-slate-50 dark:bg-slate-800/60">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Amount
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Card
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Date
                    </th>

                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                      Status
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {summary.last_5_transactions.map((transaction, index) => (
                    <tr
                      key={`${transaction.date}-${index}`}
                      className="transition hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-6 py-4 font-semibold">
                        ₹{formatAmount(transaction.amount)}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {transaction.masked_card_number || "N/A"}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-300">
                        {formatDate(transaction.date)}
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            transaction.status
                          )}`}
                        >
                          {transaction.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default Dashboard;

