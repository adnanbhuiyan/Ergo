import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { Bell, Grid3x3, List } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  owner_id: string;
  created_at: string;
}

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { logout, isAuthenticated, user, session } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" }); // Redirect if not authenticated
    }
  }, [isAuthenticated, navigate]);

  const fetchProjects = async () => {
    if (!session?.access_token || !isAuthenticated) return;

    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:8000/projects", {
        method: "GET",
        headers: { "Authorization": `Bearer ${session.access_token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
      }
    } catch (err) {
      console.error("Error fetching projects:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated && session?.access_token) {
      fetchProjects();
    }
  }, [isAuthenticated, session]);

  // Refresh projects when window gains focus (in case project was created in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && session?.access_token) {
        fetchProjects();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, session]);

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50">
        {/* Main Area */}
        <main className="p-8">
          {/* Dashboard/Create Project */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <div className="flex items-center gap-4">
              <Button variant="default" className="text-white font-medium">Create Project</Button>
              <Button variant="default" className="cursor-pointer hover:bg-gray-100"><Bell></Bell></Button>
            </div>
          </div>
          {/* Overview Section */}
          <div className="bg-gray-100 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold tex-gray-700 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Active Projects</p>
                <div className="flex">
                  <p className="text-3xl font-bold text-gray-900">{projects.length}</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Total Tasks</p>
                <div className="flex">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Completed Tasks</p>
                <div className="flex">
                  <p className="text-3xl font-bold text-gray-900">0</p>
                </div>
              </div>
            </div>
          </div>
          {/* Toolbar View */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Projects</h2>
            <div className=""></div>
          </div>
        </main>
      </div>
    </DashboardLayout>
  );
}

export default Dashboard;

