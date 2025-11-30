import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Settings, Search, UserPlus, X } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { CreateTaskModal } from "@/components/create-task-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "@tanstack/react-form"

// --- Interfaces ---

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    position: string;
    profile_photo_url: string;
}

interface ProjectMember {
    role: string;
    user: User;
}

interface SelectedUser extends User {
    role: string;
}

export const Route = createFileRoute("/projects/$projectId")({
    component: ProjectDetail,
})

// --- Main Route Component ---

function ProjectDetail() {
    const { session, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { projectId } = useParams({ from: "/projects/$projectId" })

    // --- Data State ---
    const [project, setProject] = useState<any>(null)
    const [members, setMembers] = useState<ProjectMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [tasks, setTasks] = useState<any[]>([])
    const [tasksLoading, setTasksLoading] = useState(false)
    
    // --- Edit Modal State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)

    const columns = ["To-Do", "In-Progress", "In-Review", "Blocked", "Completed"]

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: "/login" })
        }
    }, [isAuthenticated, navigate])

    // --- Fetchers ---

    const fetchProject = async () => {
        try {
            const response = await fetch(`http://localhost:8000/projects/${projectId}`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setProject(data)
            } else {
                throw new Error(`HTTP error! status: ${response.status}`)
            }
        } catch (err) {
            console.error("Error fetching project:", err)
            setError("Failed to load project details")
        } finally {
            setIsLoading(false)
        }
    }

    const fetchMembers = async () => {
        try {
            const response = await fetch(`http://localhost:8000/projects/${projectId}/members`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setMembers(data)
            }
        } catch (err) {
            console.error("Error fetching members:", err)
        }
    }

    const fetchTasks = async () => {
        setTasksLoading(true)
        try {
            const response = await fetch(`http://localhost:8000/projects/${projectId}/tasks`, {
                method: "GET",
                headers: { "Authorization": `Bearer ${session?.access_token}` }
            })

            if (response.ok) {
                const data = await response.json()
                setTasks(data)
            }
        } catch (err) {
            console.error("Error fetching tasks:", err)
        } finally {
            setTasksLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && session?.access_token) {
            fetchProject()
            fetchMembers()
            fetchTasks()
        }
    }, [projectId, session])


    // --- Helpers ---

    const getInitials = (user: User) => {
        if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        if (user.first_name) return user.first_name.slice(0, 2).toUpperCase();
        if (user.username) return user.username.slice(0, 2).toUpperCase();
        return "?";
    };

    const getDisplayName = (user: User) => {
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        return user.username || user.email || "Unknown User";
    };

    // Callback when edit is successful
    const handleProjectUpdate = () => {
        setIsEditModalOpen(false);
        fetchProject();
        fetchMembers();
    };

    return (
        <div>
            {isLoading && (
                <div className="flex justify-center items-center min-h-screen gap-2"><Spinner />Loading...</div>
            )}
            {error && (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => navigate({ to: "/projects" })}>Back to Projects</Button>
                </div>
            )}
            {!isLoading && !project && !error && (
                <div className="flex flex-col items-center justify-center min-h-screen">
                    <h2>Project Not Found</h2>
                    <Button onClick={() => navigate({ to: "/projects" })}>Back</Button>
                </div>
            )}
            {!isLoading && project && (
                <div className="min-h-screen bg-gray-50">
                    <div className="bg-white border-b border-gray-200 sticky top-0 z-10 p-6 shadow-sm">
                        <div className="flex justify-between items-start md:items-center flex-col md:flex-row gap-4">
                            <div className="flex items-center gap-4">
                                <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/projects" })}>
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                        {project.completed_at && <Badge variant="secondary" className="bg-green-100 text-green-800">Completed</Badge>}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1 max-w-lg">{project.description}</p>
                                </div>
                            </div>

                           
                            <div className="flex items-center gap-6 md:ml-auto">
                                {members.length > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-500 mb-1">Team Members ({members.length})</span>
                                        <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-200">
                                            <TooltipProvider>
                                                {members.slice(0, 5).map((member, index) => (
                                                    <Tooltip key={member.user.id || index}>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-white cursor-default select-none">
                                                                <AvatarImage src={member.user.profile_photo_url} alt={getDisplayName(member.user)} />
                                                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                                                    {getInitials(member.user)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-medium">{getDisplayName(member.user)}</p>
                                                            <p className="text-xs text-gray-500 capitalize">{member.role}</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                ))}
                                            </TooltipProvider>
                                            {members.length > 5 && (
                                                <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-xs font-medium text-gray-600">
                                                    +{members.length - 5}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="hidden md:block h-8 w-px bg-gray-200"></div>

                                <div className="text-right">
                                    <p className="text-xs text-gray-500 mb-1">Budget</p>
                                    <p className="text-lg font-bold text-slate-600">
                                        {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(project.budget)}
                                    </p>
                                </div>

                            
                                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="icon" className="ml-2">
                                            <Settings className="w-5 h-5 text-gray-600" />
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent className="sm:max-w-[600px] bg-white z-50 max-h-[90vh] overflow-y-auto">
                                        <DialogHeader>
                                            <DialogTitle>Project Settings</DialogTitle>
                                        </DialogHeader>
                                        
                                        {/* Render the Form Component ONLY when modal is open */}
                                        {isEditModalOpen && (
                                            <EditProjectForm 
                                                project={project} 
                                                currentMembers={members} 
                                                projectId={projectId} 
                                                onSuccess={handleProjectUpdate} 
                                            />
                                        )}
                                    </DialogContent>
                                </Dialog>

                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="kanban" className="flex-1">
                        <TabsList className="border-b px-6 bg-white">
                            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="kanban" className="p-6">
                            {tasksLoading && (
                                <div className="flex items-center gap-2"><Spinner />Loading tasks...</div>
                            )}
                            <div className="flex gap-4 overflow-x-auto pb-4">
                                {columns.map((columnStatus) => (
                                    <div key={columnStatus} className="shrink-0 w-80 bg-gray-100 rounded-lg p-4">
                                        <div className="mb-4">
                                            <div className="flex items-center gap-2 mb-3">
                                                <h3 className="font-semibold text-gray-900 text-base">{columnStatus}</h3>
                                                <Badge className=" bg-gray-200 text-gray-700 text-xs px-2 py-0.5">{tasks.filter(t => t.status === columnStatus).length}</Badge>
                                            </div>
                                            <CreateTaskModal
                                                projectId={projectId}
                                                onTaskCreated={fetchTasks}
                                                defaultStatus={columnStatus}
                                                trigger={
                                                    <Button className="w-full justify-start text-gray-500 hover:text-gray-700 hover:bg-gray-50 border-dashed" variant="outline" size="sm">
                                                        Add Task
                                                    </Button>
                                                }
                                            />
                                        </div>
                                        <div className="space-y-3 min-h-[200px]">
                                            {tasks.filter(t => t.status === columnStatus).map((task) => (
                                                <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer" >
                                                    <h4 className="font-medium text-gray-900 mb-2">{task.name}</h4>
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={task.priority === "High" ? "bg-red-100 text-red-800" : task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"}>{task.priority}</Badge>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500"><span>Due:</span><span>{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span></div>
                                                    </div>
                                                </div>
                                            ))}
                                            {tasks.filter(t => t.status === columnStatus).length === 0 && (
                                                <p className="text-sm text-gray-400 text-center py-4">No Tasks</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="gantt" className="p-6">
                            <p className="text-gray-500 text-center py-8">Gantt Chart</p>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </div>
    )
}

// --- Sub-Component: Edit Project Form ---

interface EditProjectFormProps {
    project: any;
    currentMembers: ProjectMember[];
    projectId: string;
    onSuccess: () => void;
}

function EditProjectForm({ project, currentMembers, projectId, onSuccess }: EditProjectFormProps) {
    const { session } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState("");
    
    // Member search state
    const [userQuery, setUserQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    
    // Form state for members (initialized from props)
    const [formMembers, setFormMembers] = useState<SelectedUser[]>(
        currentMembers.map(m => ({ ...m.user, role: m.role }))
    );

    const editForm = useForm({
        defaultValues: {
            name: project.name || "",
            description: project.description || "",
            budget: project.budget || 0,
            is_completed: !!project.completed_at
        },
        onSubmit: async ({ value }) => {
            setUpdateError("")
            setIsUpdating(true)
            
            try {
                const formData = new FormData()
                formData.append("name", value.name)
                formData.append("description", value.description)
                formData.append("budget", String(value.budget))
                
                // Add the current date if project is marked as completed
                if (value.is_completed && !project.completed_at) {
                    formData.append("completed_at", new Date().toISOString())
                } 
                
                // Send Updated Project Details
                const response = await fetch(`http://localhost:8000/projects/${projectId}`, {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${session?.access_token}` },
                    body: formData
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.detail || "Failed to update project");
                }

                // Edit Members
                const usersToAdd = formMembers.filter(fm => !currentMembers.some(m => m.user.id === fm.id));
                const usersToRemove = currentMembers.filter(m => !formMembers.some(fm => fm.id === m.user.id));

                await Promise.all([
                    ...usersToAdd.map(u => 
                        fetch(`http://localhost:8000/projects/${projectId}/members`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${session?.access_token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ user_id: u.id, role: u.role })
                        })
                    ),
                    ...usersToRemove.map(m => 
                        fetch(`http://localhost:8000/projects/${projectId}/members/${m.user.id}`, {
                            method: "DELETE",
                            headers: { "Authorization": `Bearer ${session?.access_token}` }
                        })
                    )
                ]);

                onSuccess();

            } catch (err: any) {
                setUpdateError(err.message || "Failed to update project")
            } finally {
                setIsUpdating(false)
            }
        }
    })

    // Search Users Effect
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
                    const filtered = data.filter((u: User) =>
                        !formMembers.some(selected => selected.id === u.id)
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
    }, [userQuery, session?.access_token, formMembers]);

    // Helpers for the form
    const getInitials = (user: User) => {
        if (user.first_name && user.last_name) return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        if (user.first_name) return user.first_name.slice(0, 2).toUpperCase();
        if (user.username) return user.username.slice(0, 2).toUpperCase();
        return "?";
    };

    const getDisplayName = (user: User) => {
        if (user.first_name && user.last_name) return `${user.first_name} ${user.last_name}`;
        return user.username || user.email || "Unknown User";
    };

    return (
        <form onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            editForm.handleSubmit()
        }} className="space-y-4">
            
            {updateError && (
                <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4 text-sm">{updateError}</div>
            )}

            {/* Name */}
            <editForm.Field name="name" validators={{
                onChange: ({ value }) => value.length < 3 ? "Name must be at least 3 characters." : undefined,
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="name">Project Name</Label>
                        <Input id="name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                        {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                )}
            </editForm.Field>

            {/* Description */}
            <editForm.Field name="description" validators={{
                onChange: ({ value }) => value.length > 500 ? "Max 500 Characters" : undefined,
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                        {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                )}
            </editForm.Field>

            {/* Budget */}
            <editForm.Field name="budget" validators={{
                onChange: ({ value }) => value < 0 ? "Budget must be at least 0" : undefined,
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="budget">Budget</Label>
                        <Input type="number" id="budget" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(Number(e.target.value))} className="mt-1" />
                        {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                )}
            </editForm.Field>

            {/* Status */}
            <editForm.Field name="is_completed">
                {(field) => (
                    <div className="flex items-center space-x-2 pt-2">
                        <Checkbox 
                            id="is_completed" 
                            checked={field.state.value} 
                            onCheckedChange={(checked) => field.handleChange(checked === true)} 
                        />
                        <Label htmlFor="is_completed" className="font-normal">Mark project as completed</Label>
                    </div>
                )}
            </editForm.Field>

            {/* Manage Members */}
            <div className="pt-4 border-t border-gray-100">
                <Label>Manage Team Members</Label>
                
                {/* Search */}
                <div className="relative mt-2">
                    <div className="relative">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Add users by username or email..."
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
                                        onClick={() => {
                                            setFormMembers([...formMembers, { ...user, role: "Member" }]);
                                            setUserQuery("");
                                            setUserSearchResults([]);
                                        }}
                                    >
                                        <Avatar className="h-8 w-8">
                                            <AvatarImage src={user.profile_photo_url} />
                                            <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-gray-900">{getDisplayName(user)}</p>
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

                {/* Active Member List in Form */}
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Current Team ({formMembers.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {formMembers.map((user) => (
                            <div key={user.id} className="flex items-center gap-2 bg-slate-100 text-slate-800 px-3 py-1.5 rounded-full text-sm">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.profile_photo_url} />
                                    <AvatarFallback className="text-[10px]">{getInitials(user)}</AvatarFallback>
                                </Avatar>
                                <span>{user.username}</span>
                                <span className="text-xs text-slate-500 border-l pl-2 border-slate-300">{user.role}</span>
                                <button
                                    type="button"
                                    onClick={() => setFormMembers(formMembers.filter(m => m.id !== user.id))}
                                    className="hover:bg-slate-200 rounded-full p-0.5 transition-colors"
                                >
                                    <X className="h-3 w-3" />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <Button type="submit" disabled={isUpdating} className="w-full bg-slate-600 hover:bg-slate-700 text-white mt-6">
                {isUpdating ? (
                    <div className="flex items-center gap-2">
                        <Spinner className="h-4 w-4" />
                        <span>Saving Changes...</span>
                    </div>
                ) : "Save Changes"}
            </Button>

        </form>
    )
}