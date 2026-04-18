import { Routes, Route, Link, useLocation } from "react-router-dom";
import { LayoutDashboard, FilePlus, FileText } from "lucide-react";
import DashboardPage from "./pages/DashboardPage";
import CreateInvoicePage from "./pages/CreateInvoicePage";
import InvoiceDetailPage from "./pages/InvoiceDetailPage";

/**
 * App shell with a sidebar navigation and a content area.
 */
export default function App() {
  const location = useLocation();

  const navItems = [
    { to: "/", label: "Dashboard", icon: LayoutDashboard },
    { to: "/invoices/new", label: "Create Invoice", icon: FilePlus },
  ];

  return (
    <div className="flex min-h-screen">
      {/* ---- Sidebar ---- */}
      <aside className="w-64 bg-surface-900 text-white flex flex-col">
        {/* Brand */}
        <div className="flex items-center gap-2 px-6 py-5 border-b border-surface-700">
          <FileText className="h-6 w-6 text-primary-400" />
          <span className="text-lg font-bold tracking-tight">PayDocs</span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-primary-600 text-white"
                    : "text-surface-300 hover:bg-surface-800 hover:text-white"
                }`}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-surface-700 text-xs text-surface-400">
          PayDocs v1.0
        </div>
      </aside>

      {/* ---- Main Content ---- */}
      <main className="flex-1 overflow-y-auto">
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/invoices/new" element={<CreateInvoicePage />} />
          <Route path="/invoices/:id" element={<InvoiceDetailPage />} />
        </Routes>
      </main>
    </div>
  );
}
