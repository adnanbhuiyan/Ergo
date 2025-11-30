import { useEffect, useState, useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate, Outlet, useLocation } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle, 
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form"
import { DashboardLayout } from "@/components/layouts/dashboard-layout";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronRight, FolderKanbanIcon, Grid3x3, List, Search, X, UserPlus, Trash2, CheckCircle2 } from "lucide-react";
import { ProjectCard } from "@/components/project-card";
import { Spinner } from "@/components/ui/spinner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// --- Interfaces ---

interface Project {
  id: string;
  name: string;
  description: string;
  budget: number;
  owner_id: string;
  created_at: string;
  completed_at: string | null; // Added this field
}

interface PublicUserProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  position: string;
  profile_photo_url: string;
}

interface SelectedUser extends PublicUserProfile {
  role: string;
}

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const location = useLocation()
  const isProjectDetail = location.pathname.includes('/projects/') && location.pathname.split('/').length > 2

  const { session, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  // --- Main State ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [projects, setProjects] = useState<Project[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid')

  // --- Delete Dialog State ---
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // --- User Search State ---
  const [userQuery, setUserQuery] = useState("")
  const [userSearchResults, setUserSearchResults] = useState<PublicUserProfile[]>([])
  const [isSearchingUsers, setIsSearchingUsers] = useState(false)
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([])

  // --- Derived State (Splitting Active vs Completed) ---
  const activeProjects = useMemo(() => projects.filter(p => !p.completed_at), [projects]);
  const completedProjects = useMemo(() => projects.filter(p => p.completed_at), [projects]);

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

  //Delete Project Dialog
  const confirmDelete = (projectId: string) => {
    setProjectToDelete(projectId);
  }

  //Logic for deleting the project
  const executeDeleteProject = async () => {
    if (!session?.access_token || !projectToDelete) return;

    try {
      const response = await fetch(`http://localhost:8000/projects/${projectToDelete}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${session.access_token}`
        },
      });

      if (response.ok) {
        setProjects((prevProjects) => prevProjects.filter((p) => p.id !== projectToDelete));
        setProjectToDelete(null); // Close dialog
      } else {
        const errorData = await response.json();
        console.error("Failed to delete project:", errorData);
      }
    } catch (err) {
      console.error("Error deleting project:", err);
    }
  };

  // --- User Search Logic ---
  useEffect(() => {
    const searchUsers = async () => {
      if (!userQuery || userQuery.length < 2) {
        setUserSearchResults([]);
        return;
      }
      setIsSearchingUsers(true);
      try {
        const url = `http://localhost:8000/users?user_query=${encodeURIComponent(userQuery)}`
        const response = await fetch(url, {
          method: "GET",
          headers: { "Authorization": `Bearer ${session?.access_token}` }
        })

        if (response.ok) {
          const data = await response.json();
          const filtered = data.filter((u: PublicUserProfile) =>
            !selectedUsers.some(selected => selected.id === u.id)
          );
          setUserSearchResults(filtered);
        }
      } catch (error) {
        console.error("Failed to search users", error);
      } finally {
        setIsSearchingUsers(false);
      }
    };

    const timeoutId = setTimeout(() => {
      searchUsers();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [userQuery, session?.access_token, selectedUsers]);

  const handleAddUser = (user: PublicUserProfile) => {
    setSelectedUsers([...selectedUsers, { ...user, role: "Member" }]);
    setUserQuery("");
    setUserSearchResults([]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(u => u.id !== userId));
  };

  // --- Form Handling ---
  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      budget: 0,
    },
    onSubmit: async ({ value }) => {
      setError("")
      setIsSubmitting(true)
      const formData = new FormData()

      if (value.name) formData.append("name", value.name)
      if (value.description) formData.append("description", value.description)
      if (value.budget !== undefined) formData.append("budget", String(value.budget))

      try {
        const response = await fetch("http://localhost:8000/projects", {
          method: "POST",
          headers: { "Authorization": `Bearer ${session?.access_token}` },
          body: formData
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.detail || "Failed to create project");
        }

        const newProjectId = data.id;

        if (selectedUsers.length > 0) {
          await Promise.all(
            selectedUsers.map(user =>
              fetch(`http://localhost:8000/projects/${newProjectId}/members`, {
                method: "POST",
                headers: {
                  "Authorization": `Bearer ${session?.access_token}`,
                  "Content-Type": "application/json"
                },
                body: JSON.stringify({
                  user_id: user.id,
                  role: user.role
                })
              })
            )
          );
        }

        setIsModalOpen(false)
        setError("")
        form.reset()
        setSelectedUsers([])
        await fetchProjects();
        navigate({ to: "/dashboard" })

      } catch (err: any) {
        let errorMessage = "Failed to create project at this time.";
        if (typeof err.message === 'string') errorMessage = err.message;
        setError(errorMessage);
      } finally {
        setIsSubmitting(false)
      }
    }
  })

  // Helper to render the list rows 
  const renderListRow = (project: Project) => (
    <div 
        key={project.id} 
        onClick={() => navigate({ to: `/projects/${project.id}`, params: { projectId: project.id } })} 
        className={`bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group ${project.completed_at ? 'bg-gray-50' : ''}`}
    >
        <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
                <h4 className={`text-xl font-semi-bold ${project.completed_at ? 'text-gray-600' : 'text-gray-800'}`}>{project.name}</h4>
                {project.completed_at && <Badge variant="secondary" className="text-xs bg-gray-200 text-gray-700">Completed</Badge>}
                {!project.completed_at && <Badge className="text-xs bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>}
            </div>
            <p className="text-sm text-gray-600 line-clamp-1">{project.description}</p>
        </div>
        <div className="text-center mx-8">
            <p className="text-xs text-gray-500 mb-1">Budget</p>
            <p className={`text-lg font-bold ${project.completed_at ? 'text-gray-500' : 'text-slate-600'}`}>
                {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget)}
            </p>
        </div>
        <div className="text-right min-w-[120px]">
            <p className="text-xs text-gray-500 mb-1">Created</p>
            <p className="text-sm text-gray-700">{new Date(project.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
        </div>
        
        {/* List View Delete Button */}
        <div className="flex items-center gap-4 ml-5">
            <button 
                onClick={(e) => {
                e.stopPropagation();
                confirmDelete(project.id); 
                }}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-5 h-5" />
            </button>
            <ChevronRight className="w-5 h-5 text-gray-400" />
        </div>
    </div>
  )

  return (
    <DashboardLayout>
      <Outlet />
      {!isProjectDetail && (
        <div className="min-h-screen bg-gray-50 p-6">
          <header className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
            <div className="flex items-center gap-4">
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

          <Dialog open={isModalOpen} onOpenChange={(open) => {
            setIsModalOpen(open);
            if (!open) {
              form.reset();
              setSelectedUsers([]);
              setError("");
              setUserQuery("");
            }
          }}>
            <DialogTrigger asChild>
              <Button onClick={() => setIsModalOpen(true)} variant="default" size="sm" className="bg-slate-600 hover:bg-slate-700 text-white mb-6">Create Project</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white z-50 max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>

              {error && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
              )}

              <form onSubmit={(e) => {
                e.preventDefault()
                e.stopPropagation()
                form.handleSubmit()
              }} className="space-y-4">

                <form.Field name="name" validators={{
                  onChange: ({ value }) => value.length < 3 ? "Name must be at least 3 characters." : undefined,
                }}>
                  {(field) => (
                    <div>
                      <Label htmlFor="name">Project Name</Label>
                      <Input id="name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                      {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                  )}
                </form.Field>

                <form.Field name="description" validators={{
                  onChange: ({ value }) => value.length > 500 ? "Max 500 Characters" : undefined,
                }}>
                  {(field) => (
                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                      {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                  )}
                </form.Field>

                <form.Field name="budget" validators={{
                  onChange: ({ value }) => value < 0 ? "Budget must be at least 0" : undefined,
                }}>
                  {(field) => (
                    <div>
                      <Label htmlFor="budget">Budget</Label>
                      <Input type="number" id="budget" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(Number(e.target.value))} className="mt-1" />
                      {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                  )}
                </form.Field>

                <div className="pt-4 border-t border-gray-100">
                  <Label>Invite Team Members</Label>
                  <div className="relative mt-2">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search users by their username or email..."
                        className="pl-8"
                        value={userQuery}
                        onChange={(e) => setUserQuery(e.target.value)}
                      />
                    </div>
                    {userQuery.length >= 2 && (
                      <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {isSearchingUsers ? (
                          <div className="p-4 text-center text-sm text-gray-500">Searching...</div>
                        ) : userSearchResults.length > 0 ? (
                          userSearchResults.map((user) => (
                            <div
                              key={user.id}
                              className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 transition-colors"
                              onClick={() => handleAddUser(user)}
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={user.profile_photo_url} />
                                <AvatarFallback>{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-900">{user.first_name} {user.last_name}</p>
                                <p className="text-xs text-gray-500">{user.email}</p>
                              </div>
                              <UserPlus className="h-4 w-4 text-gray-400" />
                            </div>
                          ))
                        ) : (
                          <div className="p-4 text-center text-sm text-gray-500">No users found.</div>
                        )}
                      </div>
                    )}
                  </div>
                  {selectedUsers.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase">Inviting {selectedUsers.length} people</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedUsers.map((user) => (
                          <div key={user.id} className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full text-sm">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={user.profile_photo_url} />
                              <AvatarFallback className="text-[10px]">{user.first_name[0]}{user.last_name[0]}</AvatarFallback>
                            </Avatar>
                            <span>{user.username}</span>
                            <span className="text-xs text-slate-500 border-l pl-2 border-slate-300">{user.role}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveUser(user.id)}
                              className="hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Button type="submit" disabled={isSubmitting} className="w-full bg-slate-600 hover:bg-slate-700 text-white mt-6">
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <Spinner className="h-4 w-4" />
                      <span>Creating & Inviting...</span>
                    </div>
                  ) : "Create Project"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          
          <AlertDialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
            <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the project and remove all associated data.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogCancel onClick={(e) => {
                        e.stopPropagation();
                        setProjectToDelete(null);
                    }}>
                        Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction 
                        className="bg-red-600 hover:bg-red-700 text-white"
                        onClick={(e) => {
                            e.stopPropagation();
                            executeDeleteProject();
                        }}
                    >
                        Delete
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>


          {/* Project List Rendering */}
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
              </div>
            )}
            
            {/* Active Projects */}
            {!isLoading && projects.length > 0 && (
              <div className="space-y-8">

                <div>
                   <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                     <div className="w-2 h-2 rounded-full bg-green-500"></div>
                     Active Projects
                   </h2>
                   {activeProjects.length === 0 ? (
                      <p className="text-gray-500 text-sm italic ml-4">No active projects.</p>
                   ) : (
                     <>
                        {view === 'grid' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {activeProjects.map((project) => (
                              <ProjectCard
                                key={project.id}
                                id={project.id}
                                name={project.name}
                                description={project.description}
                                budget={project.budget}
                                created_at={project.created_at}
                                completed_at={project.completed_at}
                                onClick={() => navigate({ to: `/projects/${project.id}`, params: { projectId: project.id } })}
                                onDelete={confirmDelete} 
                              />
                            ))}
                          </div>
                        )}
                        {view === 'list' && (
                          <div className="space-y-4">
                            {activeProjects.map(renderListRow)}
                          </div>
                        )}
                     </>
                   )}
                </div>

                {/* Completed Projects (Only show if there are completed projects) */}
                {completedProjects.length > 0 && (
                   <div className="pt-4 border-t border-gray-200">
                      <h2 className="text-xl font-bold text-gray-600 mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-gray-400" />
                        Completed Projects
                      </h2>
                      {view === 'grid' && (
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 opacity-80">
                            {completedProjects.map((project) => (
                              <ProjectCard
                                key={project.id}
                                id={project.id}
                                name={project.name}
                                description={project.description}
                                budget={project.budget}
                                created_at={project.created_at}
                                completed_at={project.completed_at}
                                onClick={() => navigate({ to: `/projects/${project.id}`, params: { projectId: project.id } })}
                                onDelete={confirmDelete} 
                              />
                            ))}
                          </div>
                        )}
                        {view === 'list' && (
                          <div className="space-y-4 opacity-80">
                            {completedProjects.map(renderListRow)}
                          </div>
                        )}
                   </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}