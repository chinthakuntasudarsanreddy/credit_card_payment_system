import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const FASTAPI_URL = "http://127.0.0.1:8001";

function Dashboard() {
  const navigate = useNavigate();

  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");

    const accessToken = localStorage.getItem("access_token");

    if (!accessToken) {
      setError("Your session has expired. Please login again.");
      setLoading(false);
      navigate("/login");
      return;
    }

    try {
      const response = await fetch(
        `${FASTAPI_URL}/dashboard/summary`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      if (response.status === 401) {
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        localStorage.removeItem("user");

        setError("Your session has expired. Please login again.");
        setLoading(false);

        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        throw new Error(
          errorData.detail ||
            `Dashboard request failed with status ${response.status}`
        );
      }

      const data = await response.json();

      setSummary(data);
    } catch (err) {
      console.error("Dashboard error:", err);

      setError(
        err.message ||
          "Unable to load dashboard. Please check whether FastAPI is running."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const formatCurrency = (value) => {
    const amount = Number(value || 0);

    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "-";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return dateValue;
    }

    return date.toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });
  };

  const getStatusClass = (status) => {
    switch (status) {
      case "SUCCESS":
        return "bg-green-100 text-green-700";

      case "FAILED":
        return "bg-red-100 text-red-700";

      case "PENDING":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <div className="h-8 w-64 animate-pulse rounded bg-gray-300"></div>
            <div className="mt-3 h-4 w-96 animate-pulse rounded bg-gray-300"></div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div
                key={item}
                className="h-32 animate-pulse rounded-xl bg-white p-6 shadow"
              >
                <div className="h-4 w-28 rounded bg-gray-300"></div>
                <div className="mt-5 h-8 w-36 rounded bg-gray-300"></div>
              </div>
            ))}
          </div>

          <div className="mt-8 animate-pulse rounded-xl bg-white p-6 shadow">
            <div className="h-6 w-56 rounded bg-gray-300"></div>

            <div className="mt-6 space-y-4">
              {[1, 2, 3, 4, 5].map((item) => (
                <div
                  key={item}
                  className="h-12 rounded bg-gray-200"
                ></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error && !summary) {
    return (
      <div className="min-h-screen bg-gray-100 p-6">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
            <h2 className="text-xl font-semibold text-red-700">
              Unable to load dashboard
            </h2>

            <p className="mt-3 text-red-600">{error}</p>

            <button
              onClick={fetchDashboard}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white hover:bg-blue-700"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  const transactions = summary?.last_5_transactions || [];

  return (
    <div className="min-h-screen bg-gray-100 p-4 sm:p-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard
            </h1>

            <p className="mt-1 text-gray-600">
              Overview of your credit card activity
            </p>
          </div>

          <button
            onClick={fetchDashboard}
            className="rounded-lg bg-blue-600 px-5 py-2.5 font-medium text-white transition hover:bg-blue-700"
          >
            Refresh
          </button>
        </div>

        {/* Error banner */}
        {error && (
          <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {/* Total Spent */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Spent
            </p>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {formatCurrency(summary?.total_amount_spent)}
            </p>
          </div>

          {/* Available Credit */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Available Credit
            </p>

            <p className="mt-3 text-2xl font-bold text-green-600">
              {formatCurrency(summary?.available_credit_limit)}
            </p>
          </div>

          {/* Total Transactions */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              Total Transactions
            </p>

            <p className="mt-3 text-2xl font-bold text-gray-900">
              {summary?.total_transactions ?? 0}
            </p>
          </div>

          {/* Current Month */}
          <div className="rounded-xl bg-white p-6 shadow-sm">
            <p className="text-sm font-medium text-gray-500">
              This Month Spending
            </p>

            <p className="mt-3 text-2xl font-bold text-blue-600">
              {formatCurrency(summary?.current_month_spending)}
            </p>
          </div>
        </div>

        {/* Last 5 Transactions */}
        <div className="mt-8 rounded-xl bg-white shadow-sm">
          <div className="border-b border-gray-200 px-6 py-5">
            <h2 className="text-xl font-semibold text-gray-900">
              Last 5 Transactions
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your most recent payment activity
            </p>
          </div>

          {transactions.length === 0 ? (
            <div className="px-6 py-10 text-center text-gray-500">
              No transactions found.
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Amount
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Card
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Date
                      </th>

                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">
                        Status
                      </th>
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-gray-100">
                    {transactions.map((transaction, index) => (
                      <tr
                        key={`${transaction.date}-${index}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4 font-semibold text-gray-900">
                          {formatCurrency(transaction.amount)}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
                          {transaction.masked_card_number || "-"}
                        </td>

                        <td className="px-6 py-4 text-gray-600">
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

              {/* Mobile Cards */}
              <div className="space-y-4 p-4 md:hidden">
                {transactions.map((transaction, index) => (
                  <div
                    key={`${transaction.date}-${index}`}
                    className="rounded-lg border border-gray-200 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(transaction.amount)}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                          transaction.status
                        )}`}
                      >
                        {transaction.status}
                      </span>
                    </div>

                    <div className="mt-4 space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Card
                        </span>

                        <span className="font-medium text-gray-800">
                          {transaction.masked_card_number || "-"}
                        </span>
                      </div>

                      <div className="flex justify-between">
                        <span className="text-gray-500">
                          Date
                        </span>

                        <span className="font-medium text-gray-800">
                          {formatDate(transaction.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;