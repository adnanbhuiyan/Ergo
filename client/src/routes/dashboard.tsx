import { useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { logout, isAuthenticated, user } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" }); // Redirect if not authenticated
    }
  }, [isAuthenticated, navigate]);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="flex justify-between items-center p-6 bg-slate-600 shadow-sm">
        <h1 className="flex justify-between items-center p-1 text-white bg-slate-600 shadow-sm">
          Dashboard
        </h1>
        <div className="flex items-center space-x-4">
          <span className="text-white">Welcome, {user?.username}</span>
          <Button variant="default" size="sm" onClick={() => logout()}>
            Logout
          </Button>
        </div>
      </header>

      {/* Content Wrapper */}
      <div className="flex">
        <nav className="w-80 bg-gray-100 min-h-screen p-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/dashboard"
                className="block p-2 hover:bg-gray-200 rounded mb-2"
              >
                Overview
              </Link>
            </li>
            <li>
              <Link
                to="/projects"
                className="block p-2 hover:bg-gray-200 rounded mb-2"
              >
                Projects
              </Link>
            </li>
          </ul>
        </nav>

        {/* Main Area */}
        <main className="flex-1 p-6">
          <h2 className="text-2xl font-bold mb-4">Welcome, {user?.username}</h2>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Quick Stats</h3>
            <p className="text-gray-600 mb-2">Total Projects:</p>
          </div>
        </main>
      </div>
    </div>
  );
}

export default Dashboard;
/*
<Button variant="default" size="lg" onClick={() => logout()}>
        Logout
</Button>
*/
