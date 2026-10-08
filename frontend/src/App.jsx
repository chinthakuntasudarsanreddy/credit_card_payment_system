import {
  Navigate,
  NavLink,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Cards from "./pages/Cards";
import Payment from "./pages/Payment";
import Transactions from "./pages/Transactions";
import AdminDashboard from "./pages/AdminDashboard";
import MonthlyStatement from "./pages/MonthlyStatement";

function getStoredUser() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("access_token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function AdminRoute({ children }) {
  const token = localStorage.getItem("access_token");
  const user = getStoredUser();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const isAdmin =
    user?.role === "admin" ||
    user?.is_staff === true ||
    user?.is_superuser === true;

  if (!isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function Navigation() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const isAdmin =
    user?.role === "admin" ||
    user?.is_staff === true ||
    user?.is_superuser === true;

  const handleLogout = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");

    navigate("/login", { replace: true });
  };

  const linkClass = ({ isActive }) =>
    `rounded-lg px-3 py-2 text-sm font-medium transition ${
      isActive
        ? "bg-blue-600 text-white"
        : "text-slate-600 hover:bg-slate-100 hover:text-blue-600 dark:text-slate-300 dark:hover:bg-slate-800"
    }`;

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/95">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
        {/* Logo */}
        <button
          type="button"
          onClick={() => navigate("/dashboard")}
          className="text-xl font-bold text-blue-600"
        >
          CreditPay
        </button>

        {/* Navigation */}
        <div className="flex flex-wrap items-center gap-2">
          <NavLink to="/dashboard" className={linkClass}>
            Dashboard
          </NavLink>

          <NavLink to="/cards" className={linkClass}>
            My Cards
          </NavLink>

          <NavLink to="/payment" className={linkClass}>
            Payment
          </NavLink>

          <NavLink to="/transactions" className={linkClass}>
            Transactions
          </NavLink>

          {/* Monthly Statement */}
          <NavLink to="/monthly-statement" className={linkClass}>
            📄 Statement
          </NavLink>

          {/* Admin */}
          {isAdmin && (
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-bold transition ${
                  isActive
                    ? "bg-purple-600 text-white"
                    : "bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-950 dark:text-purple-300 dark:hover:bg-purple-900"
                }`
              }
            >
              🛡️ Admin
            </NavLink>
          )}

          {/* Logout */}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg bg-red-500 px-3 py-2 text-sm font-medium text-white transition hover:bg-red-600"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

function CustomerLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950">
      <Navigation />
      {children}
    </div>
  );
}

function App() {
  return (
    <Routes>
      {/* ==================== PUBLIC ==================== */}

      <Route path="/login" element={<Login />} />

      <Route path="/register" element={<Register />} />

      {/* ==================== CUSTOMER ==================== */}

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <CustomerLayout>
              <Dashboard />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/cards"
        element={
          <ProtectedRoute>
            <CustomerLayout>
              <Cards />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment"
        element={
          <ProtectedRoute>
            <CustomerLayout>
              <Payment />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/transactions"
        element={
          <ProtectedRoute>
            <CustomerLayout>
              <Transactions />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== MONTHLY STATEMENT ==================== */}

      <Route
        path="/monthly-statement"
        element={
          <ProtectedRoute>
            <CustomerLayout>
              <MonthlyStatement />
            </CustomerLayout>
          </ProtectedRoute>
        }
      />

      {/* ==================== ADMIN ==================== */}

      <Route
        path="/admin"
        element={
          <AdminRoute>
            <CustomerLayout>
              <AdminDashboard />
            </CustomerLayout>
          </AdminRoute>
        }
      />

      {/* ==================== DEFAULT ==================== */}

      <Route
        path="/"
        element={<Navigate to="/dashboard" replace />}
      />

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default App;