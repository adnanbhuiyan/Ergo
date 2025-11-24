import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { CreateTaskModal } from "@/components/create-task-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

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

export const Route = createFileRoute("/projects/$projectId")({
    component: ProjectDetail,
})

function ProjectDetail() {
    const { session, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { projectId } = useParams({ from: "/projects/$projectId" })

    const [project, setProject] = useState<any>(null)
    const [members, setMembers] = useState<ProjectMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [tasks, setTasks] = useState<any[]>([])
    const [tasksLoading, setTasksLoading] = useState(false)
    const columns = ["To-Do", "In-Progress", "In-Review", "Blocked", "Completed"]

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: "/login" })
        }
    }, [isAuthenticated, navigate])

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
                console.log("Members data:", data)
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

    // Get member initials 
    const getInitials = (m: ProjectMember) => {
        if (m.user.first_name && m.user.last_name) {
            return `${m.user.first_name[0]}${m.user.last_name[0]}`.toUpperCase();
        }
        if (m.user.first_name) return m.user.first_name.slice(0, 2).toUpperCase();
        if (m.user.username) return m.user.username.slice(0, 2).toUpperCase();
        if (m.user.email) return m.user.email[0].toUpperCase();
        return "?";
    };

    //Display the member"s name
    const getDisplayName = (m: ProjectMember) => {
        if (m.user.first_name && m.user.last_name) return `${m.user.first_name} ${m.user.last_name}`;
        return m.user.username || m.user.email || "Unknown User";
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
                                    <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1 max-w-lg">{project.description}</p>
                                </div>
                            </div>

                            {/* Display the team members as a stack of avatars */}
                            <div className="flex items-center gap-6 md:ml-auto">
                                {members.length > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-500 mb-1">Team Members ({members.length})</span>
                                        <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-200">
                                            <TooltipProvider>
                                                {members.slice(0, 5).map((member, index) => (
                                                    // Use id, or index as fallback key
                                                    <Tooltip key={member.user.id || index}>
                                                        <TooltipTrigger asChild>
                                                            <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-white cursor-default select-none">
                                                                <AvatarImage src={member.user.profile_photo_url} alt={getDisplayName(member)} />
                                                                <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                                                    {getInitials(member)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="font-medium">{getDisplayName(member)}</p>
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