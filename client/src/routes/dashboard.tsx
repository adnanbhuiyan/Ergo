import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

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
          
          {/* Projects List */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold mb-4">Your Projects</h3>
            {isLoading ? (
              <p className="text-gray-600">Loading projects...</p>
            ) : projects.length === 0 ? (
              <p className="text-gray-600">No projects yet. <Link to="/projects" className="text-blue-600 hover:underline">Create your first project!</Link></p>
            ) : (
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex-1">
                        <h4 className="text-xl font-semibold text-gray-800 mb-1">{project.name}</h4>
                        <p className="text-gray-600 text-sm mb-2">{project.description}</p>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-lg font-bold text-slate-600">${project.budget.toLocaleString()}</p>
                        <p className="text-xs text-gray-500 mt-1">{new Date(project.created_at).toLocaleDateString()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
