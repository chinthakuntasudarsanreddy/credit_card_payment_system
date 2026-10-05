
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const navigate = useNavigate();

  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  const logout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-slate-100">

      {/* Navbar */}
      <nav className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">

          <button
            onClick={() => navigate("/dashboard")}
            className="text-2xl font-bold text-blue-600"
          >
            CreditPay
          </button>

          <div className="flex items-center gap-4">

            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold text-slate-700">
                {user.username || "User"}
              </p>

              <p className="text-xs text-slate-500">
                {user.email || ""}
              </p>
            </div>

            <button
              onClick={logout}
              className="rounded-lg bg-red-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
            >
              Logout
            </button>

          </div>

        </div>
      </nav>

      {/* Main */}
      <main className="mx-auto max-w-7xl px-6 py-10">

        {/* Welcome */}
        <div>
          <p className="text-sm font-medium text-blue-600">
            Customer Dashboard
          </p>

          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Welcome, {user.username || "User"}!
          </h1>

          <p className="mt-2 text-slate-500">
            Manage your cards, make payments, and view your
            transaction history.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="mt-8 grid gap-6 md:grid-cols-3">

          {/* Cards */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-2xl">
              💳
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              My Cards
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Add, view, and delete your saved payment cards.
            </p>

            <button
              onClick={() => navigate("/cards")}
              className="mt-5 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
            >
              Manage Cards
            </button>

          </div>

          {/* Payment */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-2xl">
              💰
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Make Payment
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Make a payment securely using one of your saved cards.
            </p>

            <button
              onClick={() => navigate("/payment")}
              className="mt-5 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-green-700"
            >
              Make Payment
            </button>

          </div>

          {/* Transactions */}
          <div className="rounded-2xl bg-white p-6 shadow-sm transition hover:shadow-md">

            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-2xl">
              📊
            </div>

            <h2 className="mt-5 text-xl font-bold text-slate-800">
              Transactions
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View your payment history and transaction status.
            </p>

            <button
              onClick={() => navigate("/transactions")}
              className="mt-5 rounded-lg bg-purple-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-purple-700"
            >
              View Transactions
            </button>

          </div>

        </div>

        {/* Account Information */}
        <section className="mt-8 rounded-2xl bg-white p-6 shadow-sm">

          <h2 className="text-xl font-bold text-slate-800">
            Account Information
          </h2>

          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                Username
              </p>

              <p className="mt-2 font-semibold text-slate-700">
                {user.username || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                Email
              </p>

              <p className="mt-2 break-all font-semibold text-slate-700">
                {user.email || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                Phone
              </p>

              <p className="mt-2 font-semibold text-slate-700">
                {user.phone_number || "-"}
              </p>
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase text-slate-400">
                Account Type
              </p>

              <p className="mt-2 font-semibold capitalize text-slate-700">
                {user.role || "customer"}
              </p>
            </div>

          </div>

        </section>

      </main>

    </div>
  );
}

export default Dashboard;
