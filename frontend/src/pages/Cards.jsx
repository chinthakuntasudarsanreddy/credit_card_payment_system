import { useEffect, useState } from "react";
import api from "../services/api";

function Cards() {
  const [cards, setCards] = useState([]);
  const [form, setForm] = useState({
    card_holder_name: "",
    card_number: "",
    expiry_month: "",
    expiry_year: "",
    card_type: "credit",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadCards = async () => {
    try {
      setLoading(true);

      const response = await api.get("/api/cards/");
      setCards(response.data);

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to load cards."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCards();
  }, []);

  const handleChange = (event) => {
    setForm({
      ...form,
      [event.target.name]: event.target.value,
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");
    setSaving(true);

    try {
      await api.post("/api/cards/", {
        ...form,
        expiry_month: Number(form.expiry_month),
        expiry_year: Number(form.expiry_year),
      });

      setMessage("Card added successfully.");

      setForm({
        card_holder_name: "",
        card_number: "",
        expiry_month: "",
        expiry_year: "",
        card_type: "credit",
      });

      await loadCards();

    } catch (err) {
      const data = err.response?.data;

      if (typeof data === "object") {
        setError(
          Object.values(data)
            .flat()
            .join(" ")
        );
      } else {
        setError("Unable to add card.");
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCard = async (cardId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this card?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await api.delete(`/api/cards/${cardId}/`);

      setMessage("Card deleted successfully.");

      await loadCards();

    } catch (err) {
      setError(
        err.response?.data?.detail ||
        "Unable to delete card."
      );
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">

      <main className="max-w-6xl mx-auto px-6 py-8">

        <h1 className="text-3xl font-bold text-slate-800">
          Card Management
        </h1>

        <p className="mt-2 text-slate-500">
          Add and manage your payment cards.
        </p>

        {message && (
          <div className="mt-5 rounded-lg border border-green-200 bg-green-50 p-3 text-green-700">
            {message}
          </div>
        )}

        {error && (
          <div className="mt-5 rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">
            {error}
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-2">

          {/* Add Card */}

          <section className="rounded-2xl bg-white p-6 shadow">

            <h2 className="text-xl font-bold text-slate-800">
              Add New Card
            </h2>

            <form
              onSubmit={handleSubmit}
              className="mt-6 space-y-4"
            >

              <input
                type="text"
                name="card_holder_name"
                placeholder="Card Holder Name"
                value={form.card_holder_name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />

              <input
                type="text"
                name="card_number"
                placeholder="Card Number"
                value={form.card_number}
                onChange={handleChange}
                maxLength={19}
                required
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              />

              <div className="grid grid-cols-2 gap-4">

                <input
                  type="number"
                  name="expiry_month"
                  placeholder="Expiry Month"
                  min="1"
                  max="12"
                  value={form.expiry_month}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

                <input
                  type="number"
                  name="expiry_year"
                  placeholder="Expiry Year"
                  min="2026"
                  max="2100"
                  value={form.expiry_year}
                  onChange={handleChange}
                  required
                  className="w-full rounded-lg border border-slate-300 px-4 py-3"
                />

              </div>

              <select
                name="card_type"
                value={form.card_type}
                onChange={handleChange}
                className="w-full rounded-lg border border-slate-300 px-4 py-3"
              >
                <option value="credit">Credit Card</option>
                <option value="debit">Debit Card</option>
              </select>

              <p className="text-xs text-slate-500">
                Your full card number is never stored by this application.
                Only the masked number and last four digits are saved.
              </p>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "Adding Card..." : "Add Card"}
              </button>

            </form>

          </section>

          {/* Saved Cards */}

          <section>

            <h2 className="text-xl font-bold text-slate-800">
              My Cards
            </h2>

            {loading ? (
              <div className="mt-6 rounded-xl bg-white p-6 shadow">
                Loading cards...
              </div>
            ) : cards.length === 0 ? (
              <div className="mt-6 rounded-xl bg-white p-6 shadow text-slate-500">
                No cards added yet.
              </div>
            ) : (
              <div className="mt-6 space-y-4">

                {cards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-2xl bg-white p-6 shadow"
                  >

                    <div className="flex items-start justify-between">

                      <div>
                        <p className="text-sm text-slate-500">
                          {card.card_type.toUpperCase()} CARD
                        </p>

                        <p className="mt-2 text-xl font-bold tracking-wider text-slate-800">
                          {card.masked_card_number}
                        </p>
                      </div>

                      <button
                        onClick={() => deleteCard(card.id)}
                        className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-100"
                      >
                        Delete
                      </button>

                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-4 text-sm">

                      <div>
                        <p className="text-slate-400">
                          Card Holder
                        </p>
                        <p className="font-medium text-slate-700">
                          {card.card_holder_name}
                        </p>
                      </div>

                      <div>
                        <p className="text-slate-400">
                          Expiry
                        </p>
                        <p className="font-medium text-slate-700">
                          {String(card.expiry_month).padStart(2, "0")}/
                          {card.expiry_year}
                        </p>
                      </div>

                    </div>

                  </div>
                ))}

              </div>
            )}

          </section>

        </div>

      </main>

    </div>
  );
}

export default Cards;