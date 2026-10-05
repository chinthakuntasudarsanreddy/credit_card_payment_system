import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function Transactions() {
  const navigate = useNavigate();

  const [transactions, setTransactions] = useState([]);
  const [count, setCount] = useState(0);

  const [statusFilter, setStatusFilter] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTransactions = async () => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (statusFilter) {
        params.status = statusFilter;
      }

      if (minAmount) {
        params.min_amount = minAmount;
      }

      if (maxAmount) {
        params.max_amount = maxAmount;
      }

      if (search.trim()) {
        params.search = search.trim();
      }

      const response = await api.get(
        "/api/transactions/",
        { params }
      );

      setTransactions(response.data.results || []);
      setCount(response.data.count || 0);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load transaction history."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const handleFilter = (event) => {
    event.preventDefault();
    loadTransactions();
  };

  const clearFilters = () => {
    setStatusFilter("");
    setMinAmount("");
    setMaxAmount("");
    setSearch("");

    setTimeout(() => {
      loadTransactions();
    }, 0);
  };

  const getStatusClass = (status) => {
    if (status === "SUCCESS") {
      return "bg-green-100 text-green-700";
    }

    if (status === "FAILED") {
      return "bg-red-100 text-red-700";
    }

    return "bg-yellow-100 text-yellow-700";
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Navigation */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold text-blue-600"
          >
            CreditPay
          </button>

          <button
            onClick={() => navigate("/dashboard")}
            className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
          >
            Back to Dashboard
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div>
          <p className="text-sm font-medium text-purple-600">
            Payment Records
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Transaction History
          </h1>

          <p className="mt-2 text-slate-500">
            View and filter all your payment transactions.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Filters */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-800">
              Filters
            </h2>

            <span className="text-sm text-slate-500">
              {count} transaction{count !== 1 ? "s" : ""}
            </span>
          </div>

          <form
            onSubmit={handleFilter}
            className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-5"
          >
            {/* Status */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Status
              </label>

              <select
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(event.target.value)
                }
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILED">Failed</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>

            {/* Minimum amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Minimum Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={minAmount}
                onChange={(event) =>
                  setMinAmount(event.target.value)
                }
                placeholder="0.00"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            {/* Maximum amount */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Maximum Amount
              </label>

              <input
                type="number"
                min="0"
                step="0.01"
                value={maxAmount}
                onChange={(event) =>
                  setMaxAmount(event.target.value)
                }
                placeholder="100000"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            {/* Search */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Transaction ID
              </label>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(event.target.value)
                }
                placeholder="Search ID"
                className="w-full rounded-lg border border-slate-300 px-3 py-2.5 outline-none focus:border-blue-500"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-end gap-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                Filter
              </button>

              <button
                type="button"
                onClick={clearFilters}
                className="rounded-lg bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-300"
              >
                Clear
              </button>
            </div>
          </form>
        </section>

        {/* Transactions */}
        <section className="mt-8">
          {loading ? (
            <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
              <p className="text-slate-500">
                Loading transactions...
              </p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="rounded-2xl bg-white p-10 text-center shadow-sm">
              <div className="text-5xl">📊</div>

              <h2 className="mt-4 text-xl font-bold text-slate-800">
                No Transactions Found
              </h2>

              <p className="mt-2 text-slate-500">
                Your payment transactions will appear here.
              </p>

              <button
                onClick={() => navigate("/payment")}
                className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Make a Payment
              </button>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {/* Desktop table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-6 py-4">
                        Transaction
                      </th>

                      <th className="px-6 py-4">
                        Card
                      </th>

                      <th className="px-6 py-4">
                        Amount
                      </th>

                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Date
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {transactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-slate-100 last:border-0 hover:bg-slate-50"
                      >
                        <td className="px-6 py-5">
                          <p className="font-mono text-xs font-semibold text-slate-700">
                            {transaction.transaction_id}
                          </p>

                          <p className="mt-1 text-xs text-slate-400">
                            ID #{transaction.id}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-semibold text-slate-700">
                            {transaction.card
                              ? transaction.card
                                  .masked_card_number
                              : "Card unavailable"}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <p className="font-bold text-slate-800">
                            {transaction.currency}{" "}
                            {transaction.amount}
                          </p>
                        </td>

                        <td className="px-6 py-5">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                              transaction.status
                            )}`}
                          >
                            {transaction.status}
                          </span>
                        </td>

                        <td className="px-6 py-5 text-sm text-slate-500">
                          {new Date(
                            transaction.created_at
                          ).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-4 p-4 md:hidden">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="font-mono text-xs font-semibold text-slate-700">
                          {transaction.transaction_id}
                        </p>

                        <p className="mt-2 font-bold text-slate-800">
                          {transaction.currency}{" "}
                          {transaction.amount}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-bold ${getStatusClass(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-xs text-slate-400">
                          Card
                        </p>

                        <p className="mt-1 font-medium text-slate-700">
                          {transaction.card
                            ? transaction.card
                                .masked_card_number
                            : "Unavailable"}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-400">
                          Date
                        </p>

                        <p className="mt-1 text-slate-600">
                          {new Date(
                            transaction.created_at
                          ).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Transactions;