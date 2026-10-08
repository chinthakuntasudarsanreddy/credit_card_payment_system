import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

const FASTAPI_URL = "http://127.0.0.1:8001";

function Payment() {
  const navigate = useNavigate();

  const [cards, setCards] = useState([]);
  const [selectedCardId, setSelectedCardId] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");

  const [loadingCards, setLoadingCards] = useState(true);
  const [processing, setProcessing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [paymentResult, setPaymentResult] = useState(null);

  const user = useMemo(() => {
    try {
      return JSON.parse(
        localStorage.getItem("user") || "{}"
      );
    } catch {
      return {};
    }
  }, []);

  const selectedCard = useMemo(() => {
    return cards.find(
      (card) =>
        String(card.id) === String(selectedCardId)
    );
  }, [cards, selectedCardId]);

  const getAvailableCredit = (card) => {
    if (!card) {
      return 0;
    }

    const creditLimit = Number(
      card.credit_limit || 0
    );

    const successfulTransactions = 0;

    if (!Number.isFinite(creditLimit)) {
      return 0;
    }

    return Math.max(
      0,
      creditLimit - successfulTransactions
    );
  };

  const loadCards = async () => {
    try {
      setLoadingCards(true);
      setError("");

      const response = await api.get(
        "/api/cards/"
      );

      const loadedCards = Array.isArray(
        response.data
      )
        ? response.data
        : [];

      setCards(loadedCards);

      if (loadedCards.length > 0) {
        setSelectedCardId(
          String(loadedCards[0].id)
        );
      } else {
        setSelectedCardId("");
      }
    } catch (err) {
      setError(
        err.response?.data?.detail ||
          "Unable to load your cards."
      );
    } finally {
      setLoadingCards(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleCardChange = (event) => {
    setSelectedCardId(event.target.value);
    setError("");
    setSuccess("");
    setPaymentResult(null);
  };

  const handleAmountChange = (event) => {
    setAmount(event.target.value);
    setError("");
    setSuccess("");
    setPaymentResult(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");
    setPaymentResult(null);

    if (!selectedCard) {
      setError("Please select a card.");
      return;
    }

    if (selectedCard.status !== "ACTIVE") {
      setError(
        "This card is BLOCKED. Please use an active card."
      );
      return;
    }

    const numericAmount = Number(amount);

    if (
      !Number.isFinite(numericAmount) ||
      numericAmount <= 0
    ) {
      setError(
        "Please enter a valid payment amount."
      );
      return;
    }

    const creditLimit = Number(
      selectedCard.credit_limit || 0
    );

    if (
      currency === "INR" &&
      creditLimit > 0 &&
      numericAmount > creditLimit
    ) {
      setError(
        "Payment amount cannot exceed the card credit limit."
      );
      return;
    }

    const accessToken =
      localStorage.getItem("access_token");

    if (!accessToken) {
      navigate("/login", { replace: true });
      return;
    }

    setProcessing(true);

    try {
      const response = await fetch(
        `${FASTAPI_URL}/api/payments/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            user_id: Number(user.id),
            card_id: Number(selectedCard.id),
            amount: numericAmount.toFixed(2),
            currency,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.detail ||
            data.message ||
            "Payment could not be processed."
        );
      }

      setPaymentResult(data);

      if (data.status === "SUCCESS") {
        setSuccess(
          "Payment processed successfully."
        );
      } else if (data.status === "FAILED") {
        setError(
          data.message ||
            "Payment processing failed."
        );
      } else {
        setSuccess(
          data.message ||
            "Payment submitted successfully."
        );
      }

      setAmount("");
    } catch (err) {
      setError(
        err.message ||
          "Unable to process payment."
      );
    } finally {
      setProcessing(false);
    }
  };

  const formatCurrency = (value) => {
    const numericValue = Number(value || 0);

    return new Intl.NumberFormat(
      "en-IN",
      {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 2,
      }
    ).format(numericValue);
  };

  const availableCredit = selectedCard
    ? getAvailableCredit(selectedCard)
    : 0;

  const creditLimit = selectedCard
    ? Number(
        selectedCard.credit_limit || 0
      )
    : 0;

  const creditPercentage =
    creditLimit > 0
      ? (availableCredit / creditLimit) * 100
      : 0;

  return (
    <div className="min-h-screen bg-slate-100">
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Page header */}
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
            Secure Payment
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Make a Payment
          </h1>

          <p className="mt-2 text-slate-500">
            Select a saved card and enter the payment
            amount.
          </p>
        </div>

        {/* Messages */}
        {error && (
          <div
            role="alert"
            className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-medium text-red-700"
          >
            {error}
          </div>
        )}

        {success && (
          <div
            role="status"
            className="mt-6 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700"
          >
            {success}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-3">
          {/* Payment form */}
          <section className="lg:col-span-2 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-800">
                  Payment Details
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Your complete card number is never
                  displayed or stored.
                </p>
              </div>

              <div className="rounded-xl bg-blue-50 px-4 py-2 text-2xl">
                💳
              </div>
            </div>

            {loadingCards ? (
              <div className="mt-8 animate-pulse space-y-5">
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-12 rounded-lg bg-slate-200" />
                <div className="h-4 w-24 rounded bg-slate-200" />
                <div className="h-12 rounded-lg bg-slate-200" />
                <div className="h-12 rounded-lg bg-slate-200" />
              </div>
            ) : cards.length === 0 ? (
              <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                <div className="text-4xl">
                  💳
                </div>

                <h3 className="mt-3 text-lg font-bold text-slate-800">
                  No saved cards
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Add a card before making a payment.
                </p>

                <Link
                  to="/cards"
                  className="mt-5 inline-flex rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Add Card
                </Link>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-6"
              >
                {/* Card selection */}
                <div>
                  <label
                    htmlFor="card"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Select Card
                  </label>

                  <select
                    id="card"
                    value={selectedCardId}
                    onChange={handleCardChange}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                  >
                    {cards.map((card) => (
                      <option
                        key={card.id}
                        value={card.id}
                      >
                        {card.masked_card_number} -{" "}
                        {card.card_type.toUpperCase()} -{" "}
                        {card.status}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Selected card preview */}
                {selectedCard && (
                  <div
                    className={`rounded-2xl border p-5 ${
                      selectedCard.status ===
                      "ACTIVE"
                        ? "border-blue-200 bg-blue-50"
                        : "border-red-200 bg-red-50"
                    }`}
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {selectedCard.card_type}{" "}
                          card
                        </p>

                        <p className="mt-2 font-mono text-xl font-bold tracking-wider text-slate-800">
                          {
                            selectedCard.masked_card_number
                          }
                        </p>

                        <p className="mt-3 text-sm font-semibold text-slate-700">
                          {
                            selectedCard.card_holder_name
                          }
                        </p>
                      </div>

                      <span
                        className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold ${
                          selectedCard.status ===
                          "ACTIVE"
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {selectedCard.status}
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 border-t border-slate-200 pt-4 sm:grid-cols-4">
                      <div>
                        <p className="text-xs text-slate-500">
                          Expiry
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {String(
                            selectedCard.expiry_month
                          ).padStart(2, "0")}
                          /
                          {
                            selectedCard.expiry_year
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Card Type
                        </p>
                        <p className="mt-1 font-semibold capitalize text-slate-700">
                          {
                            selectedCard.card_type
                          }
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Credit Limit
                        </p>
                        <p className="mt-1 font-semibold text-slate-700">
                          {formatCurrency(
                            creditLimit
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">
                          Available
                        </p>
                        <p className="mt-1 font-semibold text-green-700">
                          {formatCurrency(
                            availableCredit
                          )}
                        </p>
                      </div>
                    </div>

                    {selectedCard.status !==
                      "ACTIVE" && (
                      <div className="mt-4 rounded-lg bg-red-100 p-3 text-sm font-medium text-red-700">
                        This card is blocked and
                        cannot be used for payments.
                      </div>
                    )}
                  </div>
                )}

                {/* Amount */}
                <div>
                  <label
                    htmlFor="amount"
                    className="mb-2 block text-sm font-semibold text-slate-700"
                  >
                    Amount
                  </label>

                  <div className="relative">
                    <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-semibold text-slate-500">
                      {currency === "INR"
                        ? "₹"
                        : "$"}
                    </span>

                    <input
                      id="amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={amount}
                      onChange={handleAmountChange}
                      placeholder="Enter amount"
                      disabled={
                        processing ||
                        !selectedCard ||
                        selectedCard.status !==
                          "ACTIVE"
                      }
                      required
                      className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                    />
                  </div>

                  {currency === "INR" &&
                    selectedCard &&
                    creditLimit > 0 && (
                      <p className="mt-2 text-xs text-slate-500">
                        Available credit:{" "}
                        <span className="font-semibold text-slate-700">
                          {formatCurrency(
                            availableCredit
                          )}
                        </span>
                      </p>
                    )}
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
                    onChange={(event) =>
                      setCurrency(
                        event.target.value
                      )
                    }
                    disabled={processing}
                    className="w-full rounded-lg border border-slate-300 bg-white px-4 py-3 text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
                  >
                    <option value="INR">
                      INR - Indian Rupee
                    </option>
                    <option value="USD">
                      USD - US Dollar
                    </option>
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={
                    processing ||
                    !selectedCard ||
                    selectedCard.status !==
                      "ACTIVE"
                  }
                  className="w-full rounded-xl bg-blue-600 px-5 py-3.5 font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing
                    ? "Processing Payment..."
                    : "Pay Now"}
                </button>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  <p className="font-semibold text-slate-700">
                    🔒 Security
                  </p>

                  <p className="mt-1">
                    Your full card number and CVV
                    are never stored by this
                    application.
                  </p>
                </div>
              </form>
            )}
          </section>

          {/* Summary */}
          <aside className="space-y-6">
            {selectedCard && (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">
                  Credit Summary
                </h2>

                <div className="mt-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Credit Limit
                    </span>
                    <span className="font-bold text-slate-800">
                      {formatCurrency(
                        creditLimit
                      )}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">
                      Available
                    </span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(
                        availableCredit
                      )}
                    </span>
                  </div>

                  <div>
                    <div className="mb-2 flex justify-between text-xs">
                      <span className="text-slate-500">
                        Available credit
                      </span>

                      <span className="font-semibold text-slate-700">
                        {creditPercentage.toFixed(
                          1
                        )}
                        %
                      </span>
                    </div>

                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className={`h-full rounded-full transition-all ${
                          creditPercentage <
                          10
                            ? "bg-red-500"
                            : creditPercentage <
                              30
                            ? "bg-yellow-500"
                            : "bg-green-500"
                        }`}
                        style={{
                          width: `${Math.min(
                            100,
                            Math.max(
                              0,
                              creditPercentage
                            )
                          )}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              </section>
            )}

            {paymentResult && (
              <section className="rounded-2xl bg-white p-6 shadow-sm">
                <h2 className="text-lg font-bold text-slate-800">
                  Payment Result
                </h2>

                <div
                  className={`mt-4 rounded-xl p-4 ${
                    paymentResult.status ===
                    "SUCCESS"
                      ? "bg-green-50"
                      : "bg-red-50"
                  }`}
                >
                  <p
                    className={`text-lg font-bold ${
                      paymentResult.status ===
                      "SUCCESS"
                        ? "text-green-700"
                        : "text-red-700"
                    }`}
                  >
                    {paymentResult.status}
                  </p>

                  <p className="mt-2 text-sm text-slate-600">
                    {paymentResult.message}
                  </p>
                </div>

                <div className="mt-4 space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-slate-400">
                      Transaction ID
                    </p>

                    <p className="mt-1 break-all font-mono text-xs font-semibold text-slate-700">
                      {
                        paymentResult.transaction_id
                      }
                    </p>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">
                      Amount
                    </span>

                    <span className="font-semibold text-slate-800">
                      {paymentResult.currency}{" "}
                      {paymentResult.amount}
                    </span>
                  </div>
                </div>

                <Link
                  to="/transactions"
                  className="mt-5 block rounded-lg bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800"
                >
                  View Transactions
                </Link>
              </section>
            )}

            <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
              <h2 className="font-bold text-blue-900">
                Need a different card?
              </h2>

              <p className="mt-2 text-sm text-blue-800">
                Add or manage your saved cards from
                the My Cards section.
              </p>

              <Link
                to="/cards"
                className="mt-4 inline-flex rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Manage Cards
              </Link>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

export default Payment;