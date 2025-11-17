import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form"
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, FolderKanbanIcon, Grid3x3, List } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { Spinner } from "@/components/ui/spinner";

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  owner_id: string;
  created_at: string;
}

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation()
  const isProjectDetail = location.pathname.includes('/projects/') && location.pathname.split('/').length > 2

  const { session, isAuthenticated } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid')

  interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }

  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" })
    }
  }, [isAuthenticated, navigate])

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

  useEffect(() => {
    const handleFocus = () => {
      if (isAuthenticated && session?.access_token) {
        fetchProjects();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, session]);

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      budget: 0,
    },
    onSubmit: async ({ value }) => {
      setError("")
      setIsLoading(true)
      const formData = new FormData()

      if (value.name !== undefined) {
        formData.append("name", value.name)
      }

      if (value.description !== undefined) {
        formData.append("description", value.description)
      }

      if (value.budget !== undefined) {
        formData.append("budget", String(value.budget))
      }

      const response = await fetch("http://localhost:8000/projects", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = "Registration failed. Please check your inputs.";

        const errorData: { detail?: FastAPIValidationError[] | string } = data;

        if (
          errorData.detail &&
          Array.isArray(errorData.detail) &&
          errorData.detail.length > 0
        ) {
          errorMessage = errorData.detail
            .map((err: FastAPIValidationError) => {
              const field = err.loc[err.loc.length - 1]; // Get the field name
              return `${field}: ${err.msg}`;
            })
            .join("; ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      } else {
        setIsModalOpen(false)
        setError("")
        setIsLoading(false)
        form.reset()
        // Navigate to dashboard to see the new project
        navigate({ to: "/dashboard" })
      }
    }
  })

  return (
    <DashboardLayout>
      <Outlet />
      {!isProjectDetail && (
        <div className="min-h-screen bg-gray-50 p-6">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
            <div className="flex items-center gap-4">
              {/* Toolbar View */}
              <div className="flex gap-1 border border-gray-300 rounded-md p-1 bg-white">
                <button type="button" onClick={() => setView('grid')} className={`px-4 py-2 rounded transition-colors flex items-center gap-2 cursor-pointer ${view === 'grid' ? 'bg-slate-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}><Grid3x3 className="w-4 h-4" />
                  <span>Grid</span>
                </button>
                <button type="button" onClick={() => setView("list")} className={`px-4 py-2 rounded transition-colors flex items-center gap-2 cursor-pointer ${view === 'list' ? 'bg-slate-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
                  <List className="w-4 h-4" />
                  <span>List</span>
                </button>
              </div>
            </div>
          </header>
          <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsModalOpen(true)} variant="default" size="sm" className="bg-slate-600 hover:bg-slate-700 text-white mb-6">Create Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] bg-white z-50">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>
              )}
              <form onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }} className="space-y-0">
                <form.Field name="name" validators={{
                  onChange: ({ value }) => {
                    if (value.length < 3) return "Name must be at least 3 characters."
                  },
                }}>
                  {(field) => (
                    <div className="mb-4">
                      <Label htmlFor="name">Project Name</Label>
                      <Input id="name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                      {field.state.meta.errors ? (
                        <p className="text-red-500 text-sm mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
                <form.Field name="description" validators={{
                  onChange: ({ value }) => {
                    if (value.length > 500) return "Max 500 Characters"
                  },
                }}>
                  {(field) => (
                    <div className="mb-4">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                      {field.state.meta.errors ? (
                        <p className="text-red-500 text-sm mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
                <form.Field name="budget" validators={{
                  onChange: ({ value }) => {
                    if (value < 0) return "Budget must be at least 0"
                  },
                }}>
                  {(field) => (
                    <div className="mb-6">
                      <Label htmlFor="budget">Budget</Label>
                      <Input type="number" id="budget" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(Number(e.target.value))} className="mt-1" />
                      {field.state.meta.errors ? (
                        <p className="text-red-500 text-sm mt-1">
                          {field.state.meta.errors[0]}
                        </p>
                      ) : null}
                    </div>
                  )}
                </form.Field>
                <Button type="submit" disabled={isLoading} className="w-full bg-slate-600 hover:bg-slate-700 text-white mt-4">
                  {isLoading ? "Creating..." : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
          {/* Display Container */}
          <div>
            {isLoading && (
              <div className="flex justify-center gap-2 items-center text-center py-16 text-gray-500">
                <Spinner />
                <span className="text-lg">Loading projects...</span>
              </div>
            )}
            {!isLoading && projects.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16">
                <FolderKanbanIcon className="w-16 h-16 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">No projects yet.</h3>
                <p className="text-gray-500 text-center"></p>
              </div>
            )}
            {!isLoading && projects.length > 0 && view === 'grid' && (
              // Grid View
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    id={project.id}
                    name={project.name}
                    description={project.description}
                    budget={project.budget}
                    created_at={project.created_at}
                    onClick={() => navigate({ to: `/projects/${project.id}`, params: { projectId: project.id } })}></ProjectCard>
                ))}
              </div>
            )}
            {!isLoading && projects.length > 0 && view === 'list' && (
              // List View
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} onClick={() => navigate({ to: `/projects/${project.id}`, params: { projectId: project.id } })} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-xl font-semi-bold text-gray-800 mb-1">{project.name}</h4>
                      <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
                    </div>
                    <div className="text-center mx-8">
                      <p className="text-xs text-gray-500 mb-1">Budget</p>
                      <p className="text-lg font-bold text-slate-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget)}</p>
                    </div>
                    <div className="text-right min-w-[120px]">
                      <p className="text-xs text-gray-500 mb-1">Created</p>
                      <p className="text-sm text-gray-700">{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 ml-5 text-gray-400" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
