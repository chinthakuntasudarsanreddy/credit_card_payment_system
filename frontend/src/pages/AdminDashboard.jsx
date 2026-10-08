import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminDashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  const [summary, setSummary] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
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
      console.error("Admin summary error:", err);

      if (err.response?.status === 403) {
        setError("Admin access required.");
      } else if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
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
      setExporting(true);

      const response = await api.get(
        "/api/transactions/export/",
        {
          responseType: "blob",
        }
      );

      const contentType =
        response.headers["content-type"] || "";

      if (!contentType.includes("text/csv")) {
        throw new Error(
          "The server did not return a CSV file."
        );
      }

      const blob = new Blob(
        [response.data],
        {
          type: "text/csv;charset=utf-8;",
        }
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
      console.error("CSV export failed:", err);

      if (err.response?.status === 403) {
        setError(
          "Admin access required to export transactions."
        );
      } else if (err.response?.status === 401) {
        setError(
          "Your session has expired. Please login again."
        );
      } else if (err.message) {
        setError(err.message);
      } else {
        setError(
          "Unable to export transactions."
        );
      }
    } finally {
      setExporting(false);
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
      <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4 dark:bg-slate-950">
        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl dark:border-slate-700 dark:bg-slate-900">
          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-red-100 text-4xl dark:bg-red-950">
            🔒
          </div>

          <h1 className="mt-6 text-2xl font-bold text-slate-800 dark:text-white">
            Access Denied
          </h1>

          <p className="mt-3 text-slate-500 dark:text-slate-400">
            Administrator privileges are required to access this page.
          </p>

          <button
            type="button"
            onClick={() => navigate("/dashboard")}
            className="mt-7 w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 transition-colors dark:bg-slate-950 dark:text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

            <div>
              <div className="mb-3 inline-flex items-center rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
                ADMINISTRATION
              </div>

              <h1 className="text-3xl font-bold sm:text-4xl">
                Admin Dashboard
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-blue-100 sm:text-base">
                Monitor payment activity, transaction statistics,
                and system operations.
              </p>

              <div className="mt-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
                  👤
                </div>

                <div>
                  <p className="text-sm font-semibold">
                    {user.username}
                  </p>

                  <p className="text-xs text-blue-100">
                    System Administrator
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="date"
                value={selectedDate}
                onChange={handleDateChange}
                className="rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-sm text-white outline-none backdrop-blur focus:border-white"
              />

              <button
                type="button"
                onClick={exportTransactions}
                disabled={exporting}
                className="rounded-xl bg-white px-5 py-3 text-sm font-bold text-blue-700 shadow-lg transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting ? "Exporting..." : "📥 Export CSV"}
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
            <span className="text-xl">⚠️</span>

            <div>
              <p className="font-semibold">
                Something went wrong
              </p>

              <p className="mt-1 text-sm">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="animate-pulse rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900"
              >
                <div className="h-4 w-28 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-5 h-9 w-24 rounded bg-slate-200 dark:bg-slate-700" />
                <div className="mt-5 h-3 w-32 rounded bg-slate-200 dark:bg-slate-700" />
              </div>
            ))}
          </div>
        ) : summary ? (
          <>
            {/* Date */}
            <div className="mb-6 flex items-center gap-3 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 dark:border-blue-900 dark:bg-blue-950/40">
              <span className="text-xl">📅</span>

              <p className="text-sm text-blue-700 dark:text-blue-300">
                Payment summary for{" "}
                <strong>{summary.date}</strong>
              </p>
            </div>

            {/* Statistics */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

              {/* Total */}
              <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Total Transactions
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                      {summary.total_transactions}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950">
                    📊
                  </div>
                </div>

                <div className="mt-5 h-1 rounded-full bg-blue-100 dark:bg-blue-950">
                  <div className="h-1 w-3/4 rounded-full bg-blue-600" />
                </div>
              </div>

              {/* Amount */}
              <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Total Amount
                    </p>

                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                      ₹{Number(
                        summary.total_amount || 0
                      ).toFixed(2)}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl dark:bg-green-950">
                    💰
                  </div>
                </div>

                <div className="mt-5 h-1 rounded-full bg-green-100 dark:bg-green-950">
                  <div className="h-1 w-3/4 rounded-full bg-green-600" />
                </div>
              </div>

              {/* Success */}
              <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Successful
                    </p>

                    <p className="mt-3 text-3xl font-bold text-green-600">
                      {getStatusCount("SUCCESS")}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl dark:bg-green-950">
                    ✓
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  ₹{getStatusAmount("SUCCESS")}
                </p>
              </div>

              {/* Failed */}
              <div className="group rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      Failed
                    </p>

                    <p className="mt-3 text-3xl font-bold text-red-600">
                      {getStatusCount("FAILED")}
                    </p>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100 text-2xl dark:bg-red-950">
                    ✕
                  </div>
                </div>

                <p className="mt-5 text-sm font-medium text-slate-500 dark:text-slate-400">
                  ₹{getStatusAmount("FAILED")}
                </p>
              </div>
            </div>

            {/* Status Summary */}
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="border-b border-slate-200 px-6 py-5 dark:border-slate-800">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Payment Status Summary
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Transaction performance for the selected date.
                </p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs font-bold uppercase tracking-wider text-slate-500 dark:border-slate-800 dark:bg-slate-950/50 dark:text-slate-400">
                      <th className="px-6 py-4">
                        Status
                      </th>

                      <th className="px-6 py-4">
                        Transactions
                      </th>

                      <th className="px-6 py-4">
                        Amount
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {summary.status_summary?.length === 0 ? (
                      <tr>
                        <td
                          colSpan="3"
                          className="px-6 py-12 text-center text-slate-500 dark:text-slate-400"
                        >
                          No transactions for this date.
                        </td>
                      </tr>
                    ) : (
                      summary.status_summary?.map((item) => (
                        <tr
                          key={item.status}
                          className="border-b border-slate-100 transition hover:bg-slate-50 last:border-0 dark:border-slate-800 dark:hover:bg-slate-800/50"
                        >
                          <td className="px-6 py-5">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${
                                item.status === "SUCCESS"
                                  ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                                  : item.status === "FAILED"
                                  ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                                  : "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>

                          <td className="px-6 py-5 font-semibold text-slate-700 dark:text-slate-200">
                            {item.count}
                          </td>

                          <td className="px-6 py-5 font-semibold text-slate-700 dark:text-slate-200">
                            ₹{Number(
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

            {/* Admin Actions */}
            <section className="mt-8">
              <div className="mb-5">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Admin Actions
                </h2>

                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Manage and monitor the payment system.
                </p>
              </div>

              <div className="grid gap-5 md:grid-cols-3">

                {/* CSV Export */}
                <button
                  type="button"
                  onClick={exportTransactions}
                  disabled={exporting}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-green-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-green-700"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-green-100 text-2xl dark:bg-green-950">
                    📥
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    {exporting
                      ? "Exporting..."
                      : "Export Transactions"}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Download all payment transactions as a CSV file.
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-green-600">
                    {exporting
                      ? "Please wait..."
                      : "Export →"}
                  </span>
                </button>

                {/* Transactions */}
                <button
                  type="button"
                  onClick={() => navigate("/transactions")}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-700"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-2xl dark:bg-blue-950">
                    📋
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    View Transactions
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review payment records and transaction history.
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-blue-600">
                    View records →
                  </span>
                </button>

                {/* Cards */}
                <button
                  type="button"
                  onClick={() => navigate("/cards")}
                  className="group rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-sm transition hover:-translate-y-1 hover:border-purple-300 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900 dark:hover:border-purple-700"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-100 text-2xl dark:bg-purple-950">
                    💳
                  </div>

                  <h3 className="mt-5 text-lg font-bold text-slate-900 dark:text-white">
                    Manage Cards
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                    Review and manage saved payment cards.
                  </p>

                  <span className="mt-4 inline-block text-sm font-semibold text-purple-600">
                    Manage cards →
                  </span>
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