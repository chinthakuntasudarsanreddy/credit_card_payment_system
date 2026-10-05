import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

const FASTAPI_URL = "http://localhost:8001";

function Payment() {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [loadingCards, setLoadingCards] = useState(true);
  const [paying, setPaying] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [paymentResult, setPaymentResult] = useState(null);

  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    loadCards();
  }, []);

  const loadCards = async () => {
    try {
      setLoadingCards(true);
      setError("");

      const response = await api.get("/api/cards/");

      setCards(response.data);

      if (response.data.length > 0) {
        setSelectedCard(String(response.data[0].id));
      }
    } catch (err) {
      console.error("Card loading error:", err);

      if (err.response?.status === 401) {
        setError("Your login session has expired. Please login again.");
      } else {
        setError(
          err.response?.data?.detail ||
            "Unable to load your cards."
        );
      }
    } finally {
      setLoadingCards(false);
    }
  };

  const handlePayment = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setPaymentResult(null);

    if (!selectedCard) {
      setError("Please select a card.");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      setError("Please enter a valid payment amount.");
      return;
    }

    const selectedCardData = cards.find(
      (card) => String(card.id) === String(selectedCard)
    );

    if (!selectedCardData) {
      setError("Selected card was not found.");
      return;
    }

    try {
      setPaying(true);

      const payload = {
        user_id: Number(user.id),
        card_id: Number(selectedCard),
        amount: Number(amount),
        currency: currency,
      };

      console.log("Payment request:", payload);

      const response = await fetch(
        `${FASTAPI_URL}/api/payments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Payment processing failed."
        );
      }

      setPaymentResult(data);

      if (data.status === "SUCCESS") {
        setSuccess("Payment processed successfully.");
      } else {
        setError(
          data.message ||
            "Payment processing failed."
        );
      }

      setAmount("");
    } catch (err) {
      console.error("Payment error:", err);

      if (
        err.message === "Failed to fetch" ||
        err.name === "TypeError"
      ) {
        setError(
          "Payment service is unavailable. Make sure FastAPI is running on port 8001."
        );
      } else {
        setError(err.message || "Unable to process payment.");
      }
    } finally {
      setPaying(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Header */}
      <header className="border-b bg-white shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Credit Card Payment System
            </h1>

            <p className="text-sm text-slate-500">
              Make a secure payment
            </p>
          </div>

          <Link
            to="/dashboard"
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
          >
            Dashboard
          </Link>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-3xl px-6 py-10">
        <div className="rounded-2xl bg-white p-8 shadow-lg">
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-slate-800">
              Payment Details
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Select a saved card and enter the payment amount.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Success */}
          {success && (
            <div className="mb-6 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Payment Result */}
          {paymentResult && (
            <div
              className={`mb-6 rounded-xl border p-5 ${
                paymentResult.status === "SUCCESS"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <h3
                className={`text-lg font-bold ${
                  paymentResult.status === "SUCCESS"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                Payment {paymentResult.status}
              </h3>

              <div className="mt-3 space-y-1 text-sm text-slate-700">
                <p>
                  <strong>Transaction ID:</strong>{" "}
                  {paymentResult.transaction_id}
                </p>

                <p>
                  <strong>Amount:</strong>{" "}
                  {paymentResult.amount}{" "}
                  {paymentResult.currency}
                </p>

                <p>
                  <strong>Message:</strong>{" "}
                  {paymentResult.message}
                </p>
              </div>

              <Link
                to="/transactions"
                className="mt-4 inline-block rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-700"
              >
                View Transactions
              </Link>
            </div>
          )}

          {/* Payment Form */}
          <form onSubmit={handlePayment} className="space-y-6">
            {/* Card */}
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Select Card
              </label>

              {loadingCards ? (
                <div className="rounded-lg border bg-slate-50 p-4 text-sm text-slate-500">
                  Loading cards...
                </div>
              ) : cards.length === 0 ? (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                  No cards found. Please add a card first.
                  <br />

                  <Link
                    to="/cards"
                    className="mt-2 inline-block font-semibold underline"
                  >
                    Add Card
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => (
                    <label
                      key={card.id}
                      className={`block cursor-pointer rounded-xl border p-4 transition ${
                        String(selectedCard) === String(card.id)
                          ? "border-blue-500 bg-blue-50 ring-2 ring-blue-100"
                          : "border-slate-200 bg-white hover:border-slate-400"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="card"
                          value={card.id}
                          checked={
                            String(selectedCard) ===
                            String(card.id)
                          }
                          onChange={(e) =>
                            setSelectedCard(e.target.value)
                          }
                          className="h-4 w-4"
                        />

                        <div className="flex-1">
                          <p className="font-semibold text-slate-800">
                            {card.masked_card_number}
                          </p>

                          <p className="text-sm text-slate-500">
                            {card.card_holder_name} •{" "}
                            {card.card_type.toUpperCase()}
                          </p>

                          <p className="text-xs text-slate-400">
                            {String(card.expiry_month).padStart(
                              2,
                              "0"
                            )}
                            /{card.expiry_year}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Amount */}
            <div>
              <label
                htmlFor="amount"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Amount
              </label>

              <input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="w-full rounded-lg border border-slate-300 px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>

            {/* Currency */}
            <div>
              <label
                htmlFor="currency"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Currency
              </label>

              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                <option value="INR">
                  INR - Indian Rupee
                </option>

                <option value="USD">
                  USD - US Dollar
                </option>
              </select>
            </div>

            {/* Security */}
            <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
              <p className="text-sm text-blue-800">
                <strong>Security:</strong> Your full card
                number and CVV are not sent to the payment
                service.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={
                paying ||
                loadingCards ||
                cards.length === 0
              }
              className="w-full rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {paying ? "Processing Payment..." : "Pay Now"}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

export default Payment;