import { useState } from "react";
import axios from "axios";

const API_URL = "http://127.0.0.1:8000";

export default function MonthlyStatement() {
  const today = new Date();

  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const downloadStatement = async () => {
    try {
      setLoading(true);
      setError("");

      const token = localStorage.getItem("access_token");

      if (!token) {
        setError("Your session has expired. Please login again.");
        return;
      }

      const response = await axios.get(
        `${API_URL}/api/statements/monthly/`,
        {
          params: {
            year,
            month,
          },
          headers: {
            Authorization: `Bearer ${token}`,
          },
          responseType: "blob",
        }
      );

      const contentType = response.headers["content-type"] || "";

      if (!contentType.includes("application/pdf")) {
        throw new Error("The server did not return a PDF.");
      }

      const blob = new Blob([response.data], {
        type: "application/pdf",
      });

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `CreditPay_Statement_${year}_${String(month).padStart(
        2,
        "0"
      )}.pdf`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Statement download error:", err);

      if (err.response?.status === 401) {
        setError("Your session has expired. Please login again.");
      } else if (err.response?.status === 400) {
        setError("Invalid year or month selected.");
      } else {
        setError(
          err.message ||
            "Unable to download the monthly statement. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const months = [
    { value: 1, label: "January" },
    { value: 2, label: "February" },
    { value: 3, label: "March" },
    { value: 4, label: "April" },
    { value: 5, label: "May" },
    { value: 6, label: "June" },
    { value: 7, label: "July" },
    { value: 8, label: "August" },
    { value: 9, label: "September" },
    { value: 10, label: "October" },
    { value: 11, label: "November" },
    { value: 12, label: "December" },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-4 py-8 transition-colors">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Monthly Statement
          </h1>

          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Download your CreditPay monthly credit card statement as a PDF.
          </p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-lg dark:bg-gray-900">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              Select Statement Period
            </h2>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Choose the month and year for your statement.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label
                htmlFor="statement-month"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Month
              </label>

              <select
                id="statement-month"
                value={month}
                onChange={(e) => setMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
              >
                {months.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="statement-year"
                className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Year
              </label>

              <select
                id="statement-year"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:ring-blue-900"
              >
                {Array.from({ length: 6 }, (_, index) => {
                  const optionYear = today.getFullYear() - index;

                  return (
                    <option key={optionYear} value={optionYear}>
                      {optionYear}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </div>
          )}

          <div className="mt-8">
            <button
              type="button"
              onClick={downloadStatement}
              disabled={loading}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {loading ? (
                <>
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Generating Statement...
                </>
              ) : (
                <>
                  <span>📄</span>
                  Download Monthly Statement
                </>
              )}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-200 bg-blue-50 p-5 dark:border-blue-900 dark:bg-blue-950/30">
          <h3 className="font-semibold text-blue-900 dark:text-blue-200">
            Statement Information
          </h3>

          <ul className="mt-3 space-y-2 text-sm text-blue-800 dark:text-blue-300">
            <li>• Transaction details are included for the selected month.</li>
            <li>• Card numbers are masked for security.</li>
            <li>• Successful and failed transactions are summarized.</li>
            <li>• The statement is generated as a downloadable PDF.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}