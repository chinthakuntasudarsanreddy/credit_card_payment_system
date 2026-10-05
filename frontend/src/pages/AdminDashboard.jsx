import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const [summary, setSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadSummary = async (date = "") => {
    try {
      setLoading(true);
      setError("");

      const params = {};

      if (date) {
        params.date = date;
      }

      const response = await api.get(
        "/api/admin-logs/daily-summary/",
        { params }
      );

      setSummary(response.data);
    } catch (err) {
      if (err.response?.status === 403) {
        setError("Admin access required.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load admin summary."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role !== "admin") {
      setError("You do not have permission to access this page.");
      setLoading(false);
      return;
    }

    loadSummary();
  }, []);

  const handleDateChange = (event) => {
    const date = event.target.value;

    setSelectedDate(date);
    loadSummary(date);
  };

  const exportTransactions = async () => {
    try {
      setError("");

      const response = await api.get(
        "/api/transactions/export/",
        {
          responseType: "blob",
        }
      );

      const blob = new Blob(
        [response.data],
        { type: "text/csv" }
      );

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "transactions.csv";

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to export transactions."
      );
    }
  };

  const getStatusCount = (status) => {
    if (!summary?.status_summary) {
      return 0;
    }

    const item = summary.status_summary.find(
      (entry) => entry.status === status
    );

    return item?.count || 0;
  };

  const getStatusAmount = (status) => {
    if (!summary?.status_summary) {
      return "0.00";
    }

    const item = summary.status_summary.find(
      (entry) => entry.status === status
    );

    return Number(item?.amount || 0).toFixed(2);
  };

  if (user.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-100">
        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-6">
          <div className="w-full rounded-2xl bg-white p-8 text-center shadow">
            <div className="text-5xl">🔒</div>

            <h1 className="mt-5 text-2xl font-bold text-slate-800">
              Access Denied
            </h1>

            <p className="mt-2 text-slate-500">
              Admin privileges are required to access this dashboard.
            </p>

            <button
              onClick={() => navigate("/dashboard")}
              className="mt-6 rounded-lg bg-blue-600 px-5 py-2.5 font-semibold text-white hover:bg-blue-700"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

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

          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">
                {user.username}
              </p>

              <p className="text-xs text-red-500">
                Administrator
              </p>
            </div>

            <button
              onClick={() => navigate("/dashboard")}
              className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-200"
            >
              Dashboard
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-6 py-10">
        {/* Header */}
        <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-medium text-red-600">
              Administration
            </p>

            <h1 className="mt-2 text-3xl font-bold text-slate-800">
              Admin Dashboard
            </h1>

            <p className="mt-2 text-slate-500">
              Monitor daily payment activity and transaction statistics.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500"
            />

            <button
              onClick={exportTransactions}
              className="rounded-lg bg-green-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-700"
            >
              Export CSV
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="mt-8 rounded-2xl bg-white p-10 text-center shadow-sm">
            <p className="text-slate-500">
              Loading payment summary...
            </p>
          </div>
        ) : summary ? (
          <>
            {/* Date */}
            <div className="mt-8 rounded-xl border border-blue-100 bg-blue-50 p-4">
              <p className="text-sm text-blue-700">
                Payment summary for{" "}
                <strong>{summary.date}</strong>
              </p>
            </div>

            {/* Main statistics */}
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Total Transactions
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      {summary.total_transactions}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
                    📊
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Total Amount
                    </p>

                    <p className="mt-2 text-3xl font-bold text-slate-800">
                      ₹
                      {Number(
                        summary.total_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                    💰
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Successful
                    </p>

                    <p className="mt-2 text-3xl font-bold text-green-600">
                      {getStatusCount("SUCCESS")}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
                    ✓
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  ₹{getStatusAmount("SUCCESS")}
                </p>
              </div>

              <div className="rounded-2xl bg-white p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">
                      Failed
                    </p>

                    <p className="mt-2 text-3xl font-bold text-red-600">
                      {getStatusCount("FAILED")}
                    </p>
                  </div>

                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100 text-2xl">
                    ✕
                  </div>
                </div>

                <p className="mt-3 text-sm text-slate-400">
                  ₹{getStatusAmount("FAILED")}
                </p>
              </div>
            </div>

            {/* Status summary */}
            <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Payment Status Summary
              </h2>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-500">
                      <th className="px-4 py-3">
                        Status
                      </th>

                      <th className="px-4 py-3">
                        Transactions
                      </th>

                      <th className="px-4 py-3">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {summary.status_summary.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-4 py-8 text-center text-slate-500"
                        >
                          No transactions for this date.
                        </td>
                      </tr>
                    ) : (
                      summary.status_summary.map((item) => (
                        <tr
                          key={item.status}
                          className="border-b border-slate-100 last:border-0"
                        >
                          <td className="px-4 py-4">
                            <span
                              className={`rounded-full px-3 py-1 text-xs font-bold ${
                                item.status === "SUCCESS"
                                  ? "bg-green-100 text-green-700"
                                  : item.status === "FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            {item.count}
                          </td>

                          <td className="px-4 py-4 font-semibold text-slate-700">
                            ₹
                            {Number(
                              item.amount || 0
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Admin actions */}
            <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-xl font-bold text-slate-800">
                Admin Actions
              </h2>

              <div className="mt-6 grid gap-4 md:grid-cols-3">
                <button
                  onClick={exportTransactions}
                  className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-green-300 hover:bg-green-50"
                >
                  <div className="text-2xl">📥</div>

                  <h3 className="mt-3 font-bold text-slate-800">
                    Export Transactions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Download all transactions as CSV.
                  </p>
                </button>

                <button
                  onClick={() => navigate("/transactions")}
                  className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-blue-300 hover:bg-blue-50"
                >
                  <div className="text-2xl">📋</div>

                  <h3 className="mt-3 font-bold text-slate-800">
                    View Transactions
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review transaction records.
                  </p>
                </button>

                <button
                  onClick={() => navigate("/cards")}
                  className="rounded-xl border border-slate-200 p-5 text-left transition hover:border-purple-300 hover:bg-purple-50"
                >
                  <div className="text-2xl">💳</div>

                  <h3 className="mt-3 font-bold text-slate-800">
                    Manage Cards
                  </h3>

                  <p className="mt-1 text-sm text-slate-500">
                    Review saved payment cards.
                  </p>
                </button>
              </div>
            </section>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default AdminDashboard;