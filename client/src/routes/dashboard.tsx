import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { Bell, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

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
  const [upcomingTasks, setUpcomingTasks] = useState<any[]>([])
  const [tasksLoading, setTasksLoading] = useState(false)
  const [activeProjects, setActiveProjects] = useState(0)

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" }); // Redirect if not authenticated
    }
  }, [isAuthenticated, navigate]);

  const fetchUpcomingTasks = async () => {
    if (!session?.access_token || !isAuthenticated) return

    setTasksLoading(true)
    const allTasks: any[] = []

    try {
      const projectsResponse = await fetch("http://localhost:8000/projects", {
        method: "GET",
        headers: { "Authorization": `Bearer ${session.access_token}` }
      })

      if (!projectsResponse.ok) return

      const userProjects = await projectsResponse.json()



      for (const project of userProjects) {
        const tasksResponse = await fetch(`http://localhost:8000/projects/${project.id}/tasks`, {
          method: "GET",
          headers: { 'Authorization': `Bearer ${session.access_token}` }
        })

        if (tasksResponse.ok) {
          const projectTasks = await tasksResponse.json()

          for (const task of projectTasks) {
            const assigneesResponse = await fetch(`http://localhost:8000/tasks/${task.id}/assignees`, {
              method: "GET",
              headers: { "Authorization": `Bearer ${session.access_token}` }
            })
            if (assigneesResponse.ok) {
              const assignees = await assigneesResponse.json()

              const isAssignedToMe = assignees.some(
                (assignee: any) => {
                  return assignee.user?.id === user?.id
                }
              )

              if (isAssignedToMe) {
                allTasks.push(task)
              }
            }
          }
        }
      }

      console.log(allTasks)

      allTasks.sort((a, b) => {
        const dateA = new Date(a.due_date).getTime();
        const dateB = new Date(b.due_date).getTime()
        return dateA - dateB
      })

      const upcomingFive = allTasks.slice(0, 5)

      setUpcomingTasks(upcomingFive)

      const projectsWithMyTasks = new Set(allTasks.map((task: any) => task.project_id))
      const activeProjectsCount = projectsWithMyTasks.size

      setActiveProjects(activeProjectsCount)

    } catch (err) {
      console.error("Error fetching upcoming tasks:", err)
    } finally {
      setTasksLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated && session?.access_token) {
      fetchUpcomingTasks()
    }
  }, [isAuthenticated, session]);

  // Refresh projects when window gains focus (in case project was created in another tab)
  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && session?.access_token) {
        fetchUpcomingTasks()
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
            <h2 className="text-lg font-semibold text-gray-700 mb-4">Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <p className="text-sm text-gray-600 mb-2">Active Projects</p>
                <div className="flex">
                  <p className="text-3xl font-bold text-gray-900">{activeProjects}</p>
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
                  <p className="text-3xl font-bold text-gray-900">{upcomingTasks.length}</p>
                </div>
              </div>
            </div>
          </div>
          {/* Tasks Section */}
          <div className="bg-white rounded-lg p-6 mb-8 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibod text-gray-900">Upcoming Tasks</h2>
              <Link to="/my-tasks" className="flex items-center cursor-pointer text-sm">View All <ChevronRight className="w-5 h-5 ml-5 text-gray-400" /></Link>
            </div>
            {tasksLoading && (
              <div className="flex justify-center gap-2 items-center text-center">
                <Spinner />
                <p className="text-gray-500 text-center py-4">Loading tasks...</p>
              </div>
            )}
            {!tasksLoading && upcomingTasks.length > 0 && (
              <div className="space-y-3">
                {upcomingTasks.map((task) => (
                  <div key={task.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors cursor-pointer">
                    {/* Left Side of Task Row */}
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 mb01">{task.name}</h4>
                        <p className="text-sm text-gray-600 line-clamp-1 mb-2">{task.description}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {task.priority === "High" && (
                            <Badge className="bg-red-100 text-red-800">{task.priority}</Badge>
                          )}
                          {task.priority === "Medium" && (
                            <Badge className="bg-yellow-100 text-yellow-800">{task.priority}</Badge>
                          )}
                          {task.priority === "Low" && (
                            <Badge className="bg-green-100 text-green-800">{task.priority}</Badge>
                          )}
                          <span className="text-gray-600">{task.status}</span>
                        </div>
                      </div>
                    </div>
                    {/* Right Side of Task Row */}
                    <div className="text-right ml-4">
                      <p className="text-xs text-gray-500 mb-1">Due</p>
                      <p className="text-sm font-medium text-gray-900">{new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      </div>
    </DashboardLayout >
  );
}

export default Dashboard;

