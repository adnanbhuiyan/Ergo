import { createFileRoute, useParams, useNavigate } from "@tanstack/react-router"
import { useEffect, useState, useMemo } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { getApiUrl } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { ArrowLeft, Settings, Search, UserPlus, X, Mail, Briefcase, Link, Trash2 } from "lucide-react"
import { Spinner } from "@/components/ui/spinner"
import { CreateTaskModal } from "@/components/create-task-modal"
import { EditTaskModal } from "@/components/edit-task-modal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { useForm } from "@tanstack/react-form"
import { Separator } from "@/components/ui/separator"
import { GanttChart } from "@/components/gantt-chart"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

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

interface TaskDependency {
    id: string;
    name: string,
    status: string
}

interface TaskAssignee {
    user: User;
    role?: string;
}

interface Task {
    id: string;
    name: string
    description: string,
    priority: string;
    status: string;
    due_date: string;
    created_at: string;
    budget: number;
    expense: number;
    estimated_completion_time: number | null;
    actual_completed_time: number | null;
    completed_on: string | null;
    project_id: string;
    created_by: string;
    depends_on: TaskDependency[];
    blocking: TaskDependency[];
    assignees?: TaskAssignee[];
}

export const Route = createFileRoute("/projects/$projectId")({
    component: ProjectDetail,
})

// --- Main Route Component ---

function ProjectDetail() {
    const { session, isAuthenticated, user } = useAuth()
    const navigate = useNavigate()
    const { projectId } = useParams({ from: "/projects/$projectId" })

    // --- Data State ---
    const [project, setProject] = useState<any>(null)
    const [members, setMembers] = useState<ProjectMember[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")
    const [tasks, setTasks] = useState<Task[]>([])
    const [tasksLoading, setTasksLoading] = useState(false)

    // --- Edit/Delete State ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false)
    const [isEditTaskOpen, setIsEditTaskOpen] = useState(false)
    const [editingTask, setEditingTask] = useState<Task | null>(null)

    // Delete Task State
    const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)
    const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    const columns = ["To-Do", "In-Progress", "In-Review", "Blocked", "Completed"]

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: "/login" })
        }
    }, [isAuthenticated, navigate])

    // --- Fetchers ---

    const fetchProject = async () => {
        try {
            const response = await fetch(`${getApiUrl()}/projects/${projectId}`, {
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
            const response = await fetch(`${getApiUrl()}/projects/${projectId}/members`, {
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
            const response = await fetch(`${getApiUrl()}/projects/${projectId}/tasks`, {
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

    const handleProjectUpdate = () => {
        setIsEditModalOpen(false);
        fetchProject();
        fetchMembers();
    };

    const handleDeleteTask = async () => {
        if (!taskToDelete) return;
        setIsDeleting(true);

        try {
            const headers = { "Authorization": `Bearer ${session?.access_token}` };

            //Remove task assignees
            if (taskToDelete.assignees && taskToDelete.assignees.length > 0) {
                await Promise.all(taskToDelete.assignees.map(assignee =>
                    fetch(`${getApiUrl()}/tasks/${taskToDelete.id}/assignees/${assignee.user.id}`, {
                        method: "DELETE",
                        headers
                    })
                ));
            }

            // Remove any depends on dependencies
            if (taskToDelete.depends_on && taskToDelete.depends_on.length > 0) {
                await Promise.all(taskToDelete.depends_on.map(dep => {
                    const depId = typeof dep === 'string' ? dep : dep.id;
                    return fetch(`${getApiUrl()}/tasks/${taskToDelete.id}/dependencies/${depId}`, {
                        method: "DELETE",
                        headers
                    })
                }));
            }

            // Remove any blocking dependencies
            if (taskToDelete.blocking && taskToDelete.blocking.length > 0) {
                await Promise.all(taskToDelete.blocking.map(blockedTask => {
                    const blockedTaskId = typeof blockedTask === 'string' ? blockedTask : blockedTask.id;
                    return fetch(`${getApiUrl()}/tasks/${blockedTaskId}/dependencies/${taskToDelete.id}`, {
                        method: "DELETE",
                        headers
                    })
                }));
            }

            // Delete the Task after all dependencies and assignees have been removed
            const response = await fetch(`${getApiUrl()}/tasks/${taskToDelete.id}`, {
                method: "DELETE",
                headers
            });

            if (response.ok) {
                setTasks(prevTasks => prevTasks.filter(t => t.id !== taskToDelete.id));
                setIsDeleteAlertOpen(false);
                setTaskToDelete(null);
            } else {
                console.error("Failed to delete task");
            }
        } catch (error) {
            console.error("Error deleting task and relations:", error);
        } finally {
            setIsDeleting(false);
        }
    };

    const filteredMembers = members.filter(m => m.user.id !== user?.id);

    const isOwner = useMemo(() => {
        if (!user?.id || members.length === 0) return false;
        const currentUserMember = members.find(m => m.user.id === user.id);
        return currentUserMember?.role === "Owner" || project?.owner_id === user.id;
    }, [members, user?.id, project]);

    const isTaskOwner = (task: Task) => {
        return task.created_by === (session as any)?.user?.id;
    }

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
                                        {project.completed_at && <Badge variant="secondary" className="bg-gray-200 text-gray-700">Completed</Badge>}
                                        {!project.completed_at && <Badge variant="secondary" className="bg-green-100 text-green-800">Active</Badge>}
                                    </div>
                                    <p className="text-sm text-gray-600 mt-1 line-clamp-1 max-w-lg">{project.description}</p>
                                </div>
                            </div>


                            <div className="flex items-center gap-6 md:ml-auto">
                                {members.length > 0 && (
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs text-gray-500 mb-1">Team Members ({members.length})</span>
                                        <div className="flex -space-x-2 overflow-hidden hover:space-x-1 transition-all duration-10">
                                            {filteredMembers.slice(0, 5).map((member, index) => (
                                                <HoverCard key={member.user.id || index}>
                                                    <HoverCardTrigger asChild>
                                                        <Avatar className="inline-block h-8 w-8 rounded-full ring-2 ring-white cursor-pointer hover:z-10 transition-transform hover:scale-105">
                                                            <AvatarImage src={member.user.profile_photo_url} alt={getDisplayName(member.user)} />
                                                            <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                                                {getInitials(member.user)}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    </HoverCardTrigger>

                                                    <HoverCardContent className="w-80 bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                                                        <div className="flex justify-between space-x-4">
                                                            <Avatar className="h-12 w-12 ring-2 ring-slate-700">
                                                                <AvatarImage src={member.user.profile_photo_url} />
                                                                <AvatarFallback className="bg-slate-800 text-slate-300">
                                                                    {getInitials(member.user)}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className="space-y-1 flex-1">
                                                                <h4 className="text-sm font-semibold text-white">{getDisplayName(member.user)}</h4>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge variant="outline" className="text-xs font-normal border-slate-600 text-slate-300">
                                                                        {member.role}
                                                                    </Badge>
                                                                    {member.user.username && <span className="text-xs text-slate-400">@{member.user.username}</span>}
                                                                </div>
                                                                <div className="flex items-center pt-2">
                                                                    <Mail className="mr-2 h-3 w-3 text-slate-500" />
                                                                    <span className="text-xs text-slate-400">{member.user.email}</span>
                                                                </div>
                                                                {member.user.position && (
                                                                    <div className="flex items-center pt-1">
                                                                        <Briefcase className="mr-2 h-3 w-3 text-slate-500" />
                                                                        <span className="text-xs text-slate-400">{member.user.position}</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
                                            ))}
                                            {filteredMembers.length > 5 && (
                                                <HoverCard>
                                                    <HoverCardTrigger asChild>
                                                        <div className="flex items-center justify-center h-8 w-8 rounded-full ring-2 ring-white bg-gray-100 text-xs font-medium text-gray-600 cursor-pointer hover:bg-gray-200">
                                                            +{filteredMembers.length - 5}
                                                        </div>
                                                    </HoverCardTrigger>
                                                    <HoverCardContent className="w-60 bg-slate-900 border-slate-800 text-slate-100 shadow-xl">
                                                        <div className="space-y-2">
                                                            <h4 className="text-sm font-medium text-slate-100">Other Members</h4>
                                                            <Separator className="bg-slate-700" />
                                                            <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                                                                {filteredMembers.slice(5).map((member) => (
                                                                    <div key={member.user.id} className="flex items-center gap-2">
                                                                        <Avatar className="h-6 w-6 ring-1 ring-slate-700">
                                                                            <AvatarImage src={member.user.profile_photo_url} />
                                                                            <AvatarFallback className="bg-slate-800 text-slate-300 text-[10px]">
                                                                                {getInitials(member.user)}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <span className="text-sm text-slate-300 truncate">{getDisplayName(member.user)}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </HoverCardContent>
                                                </HoverCard>
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
                                    <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-gray-50 to-white z-50 max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-bold text-gray-900">
                                                Project Settings {isOwner ? "" : "(Viewer Permissions Only)"}
                                            </DialogTitle>
                                            <p className="text-sm text-gray-500 mt-2">
                                                {isOwner ? "Update project details and manage team" : "View project information"}
                                            </p>                                        </DialogHeader>
                                        {isEditModalOpen && (
                                            <EditProjectForm
                                                project={project}
                                                currentMembers={members}
                                                projectId={projectId}
                                                isOwner={isOwner}
                                                onSuccess={handleProjectUpdate}
                                            />
                                        )}
                                    </DialogContent>
                                </Dialog>

                            </div>
                        </div>
                    </div>

                    <Tabs defaultValue="kanban" className="flex-1">
                        <div className="px-6 py-4 bg-white border-b">
                            <TabsList className="inline-flex items-center rounded-xl bg-gray-100 p-1 shadow-sm border-0">
                                <TabsTrigger
                                    value="kanban"
                                    className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50"
                                >
                                    Kanban Board
                                </TabsTrigger>
                                <TabsTrigger
                                    value="gantt"
                                    className="px-6 py-2.5 rounded-lg font-semibold text-sm transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-600 data-[state=active]:to-slate-600 data-[state=active]:text-white data-[state=active]:shadow-md data-[state=inactive]:text-gray-600 data-[state=inactive]:hover:text-gray-900 data-[state=inactive]:hover:bg-gray-50"
                                >
                                    Gantt Chart
                                </TabsTrigger>
                            </TabsList>
                        </div>
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
                                                <div
                                                    key={task.id}
                                                    className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer relative group"
                                                    onClick={(e) => {
                                                        e.stopPropagation()
                                                        setEditingTask(task);
                                                        setIsEditTaskOpen(true);
                                                    }}
                                                >
                                                    {/* Delete Button (Visible on Hover) */}
                                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-gray-400 hover:text-red-600 hover:bg-red-50"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                setTaskToDelete(task);
                                                                setIsDeleteAlertOpen(true);
                                                            }}
                                                        >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </div>

                                                    <h4 className="font-medium text-gray-900 mb-2 pr-6">{task.name}</h4>
                                                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{task.description}</p>

                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge className={
                                                            task.priority === "High" ? "bg-red-100 text-red-800" :
                                                                task.priority === "Medium" ? "bg-yellow-100 text-yellow-800" :
                                                                    "bg-green-100 text-green-800"
                                                        }>
                                                            {task.priority}
                                                        </Badge>
                                                        <div className="flex items-center gap-1 text-xs text-gray-500">
                                                            <span>Due:</span>
                                                            <span>{new Date(task.due_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                                                        </div>
                                                    </div>

                                                    {/* Footer: Dependencies and Assignees */}
                                                    <div className="flex items-end justify-between mt-3 pt-2 border-t border-gray-100 min-h-6">

                                                        {/* Left Side: Dependencies */}
                                                        <div className="flex-1 flex flex-wrap gap-1">
                                                            {task.depends_on && task.depends_on.length > 0 && (
                                                                <div className="flex flex-wrap gap-1">
                                                                    {task.depends_on.map((dep: any) => {
                                                                        const depId = typeof dep === 'string' ? dep : dep.id || dep.depends_on_task_id;
                                                                        const depTask = tasks.find(t => t.id === depId);
                                                                        const isDepCompleted = depTask?.status === "Completed";
                                                                        return (
                                                                            <Badge
                                                                                key={depId}
                                                                                variant="outline"
                                                                                className={`text-[9px] px-1.5 py-0 h-5 border-amber-200 bg-amber-50 text-amber-700 truncate max-w-[100px] flex items-center gap-1 ${isDepCompleted ? 'line-through opacity-60' : ''}`}
                                                                                title={depTask?.name || "Dependency"}
                                                                            >
                                                                                <Link className="w-2.5 h-2.5" />
                                                                                {depTask ? depTask.name : "Dep"}
                                                                            </Badge>
                                                                        )
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Right Side: Assignees */}
                                                        {task.assignees && task.assignees.length > 0 && (
                                                            <div className="flex -space-x-2 ml-2 shrink-0">
                                                                {task.assignees.slice(0, 3).map((assignee: TaskAssignee) => (
                                                                    <HoverCard key={assignee.user.id}>
                                                                        <HoverCardTrigger asChild>
                                                                            <Avatar className="h-6 w-6 border-2 border-white ring-1 ring-gray-100 cursor-pointer">
                                                                                <AvatarImage src={assignee.user.profile_photo_url} />
                                                                                <AvatarFallback className="text-[9px] bg-slate-100 text-slate-600">
                                                                                    {getInitials(assignee.user)}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                        </HoverCardTrigger>
                                                                        <HoverCardContent className="w-auto p-2 text-xs bg-slate-900 text-white border-none">
                                                                            {getDisplayName(assignee.user)}
                                                                        </HoverCardContent>
                                                                    </HoverCard>
                                                                ))}
                                                                {task.assignees.length > 3 && (
                                                                    <div className="flex items-center justify-center h-6 w-6 rounded-full border-2 border-white bg-gray-100 text-[9px] font-medium text-gray-600">
                                                                        +{task.assignees.length - 3}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </TabsContent>
                        <TabsContent value="gantt" className="p-6">
                            {tasksLoading ? (
                                <div className="flex items-center gap-2">
                                    <Spinner /> Loading tasks...
                                </div>
                            ) : (
                                <GanttChart tasks={tasks} />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            )}

            {/* Edit Task Modal */}
            {editingTask && (
                <EditTaskModal
                    task={editingTask}
                    isOwner={isTaskOwner(editingTask)}
                    isOpen={isEditTaskOpen}
                    onClose={() => {
                        setIsEditTaskOpen(false);
                        setEditingTask(null);
                    }}
                    onSuccess={() => {
                        fetchTasks();
                        setIsEditTaskOpen(false);
                        setEditingTask(null);
                    }}
                />
            )}

            {/* Delete Confirmation Alert */}
            <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
                <AlertDialogContent className="bg-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will permanently delete the task <span className="font-semibold text-gray-900">"{taskToDelete?.name}"</span> and remove it from the project. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                handleDeleteTask();
                            }}
                            className="bg-red-600 hover:bg-red-700 focus:ring-red-600"
                            disabled={isDeleting}
                        >
                            {isDeleting ? <Spinner className="w-4 h-4 text-white" /> : "Delete Task"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// --- Sub-Component: Edit Project Form ---

interface EditProjectFormProps {
    project: any;
    currentMembers: ProjectMember[];
    projectId: string;
    isOwner: boolean;
    onSuccess: () => void;
}

function EditProjectForm({ project, currentMembers, projectId, isOwner, onSuccess }: EditProjectFormProps) {
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
            budget: project.budget || "",
            is_completed: !!project.completed_at
        },
        onSubmit: async ({ value }) => {
            if (!isOwner) return;

            setUpdateError("")
            setIsUpdating(true)

            try {
                const formData = new FormData()

                // Esure budget is a number
                const safeBudget = value.budget === "" ? 0 : Number(value.budget);

                formData.append("name", value.name)
                formData.append("description", value.description)
                formData.append("budget", value.budget || "0")

                // Logic for Toggling Between Active and Completed
                if (value.is_completed) {
                    if (!project.completed_at) {
                        formData.append("completed_at", new Date().toISOString())
                    }
                } else {
                    formData.append("completed_at", "")
                }

                // PUT Request to Update Project Details
                const response = await fetch(`${getApiUrl()}/projects/${projectId}`, {
                    method: "PUT",
                    headers: { "Authorization": `Bearer ${session?.access_token}` },
                    body: formData
                })

                if (!response.ok) {
                    const data = await response.json()
                    throw new Error(data.detail || "Failed to update project");
                }

                // Modify Members
                const usersToAdd = formMembers.filter(fm => !currentMembers.some(m => m.user.id === fm.id));
                const usersToRemove = currentMembers.filter(m => !formMembers.some(fm => fm.id === m.user.id));

                await Promise.all([
                    ...usersToAdd.map(u =>
                        fetch(`${getApiUrl()}/projects/${projectId}/members`, {
                            method: "POST",
                            headers: {
                                "Authorization": `Bearer ${session?.access_token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify({ user_id: u.id, role: u.role })
                        })
                    ),
                    ...usersToRemove.map(m =>
                        fetch(`${getApiUrl()}/projects/${projectId}/members/${m.user.id}`, {
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
        if (!isOwner) return;

        const searchUsers = async () => {
            if (!userQuery || userQuery.length < 2) {
                setUserSearchResults([]);
                return;
            }
            setIsSearchingUsers(true);
            try {
                const url = `${getApiUrl()}/users?user_query=${encodeURIComponent(userQuery)}`
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
    }, [userQuery, session?.access_token, formMembers, isOwner]);

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
            if (isOwner) editForm.handleSubmit()
        }} className="space-y-5">

            {updateError && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                    <div className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                            <p className="font-semibold text-sm">Error</p>
                            <p className="text-sm mt-1">{updateError}</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Name */}
            <editForm.Field name="name" validators={{
                onChange: ({ value }) => value.length < 3 ? "Name must be at least 3 characters." : undefined,
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="name" className="text-sm font-semibold text-gray-700 mb-2">Project Name</Label>
                        <Input
                            id="name"
                            disabled={!isOwner}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        {field.state.meta.errors ? <p className="text-red-500 text-sm mt-1">{field.state.meta.errors[0]}</p> : null}
                    </div>
                )}
            </editForm.Field>

            {/* Description */}
            <editForm.Field name="description" validators={{
                onChange: ({ value }) => {
                    if (value.length < 3) return "Description must be at least 3 characters.";
                    if (value.length > 500) return "Description cannot exceed 500 characters.";
                    return undefined;
                }
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="description" className="text-sm font-semibold text-gray-700 mb-2">Description <span className="text-red-500">*</span></Label>
                        <Input
                            id="description"
                            disabled={!isOwner}
                            value={field.state.value}
                            onBlur={field.handleBlur}
                            onChange={(e) => field.handleChange(e.target.value)}
                            className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                        <div className="flex justify-between mt-1">
                            {field.state.meta.errors ? (
                                <p className="text-red-500 text-xs">{field.state.meta.errors[0]}</p>
                            ) : <span></span>}
                            <span className={`text-xs ${field.state.value.length > 500 ? 'text-red-500' : 'text-gray-400'}`}>
                                {field.state.value.length}/500
                            </span>
                        </div>
                    </div>
                )}
            </editForm.Field>

            {/* Budget */}
            <editForm.Field name="budget" validators={{
                onChange: ({ value }) => {
                    if (value === "") return undefined;
                    if (Number(value) < 0) return "Budget cannot be negative.";
                    return undefined;
                },
            }}>
                {(field) => (
                    <div>
                        <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">Budget (USD) <span className="text-red-500">*</span></Label>
                        <div className="relative mt-2">
                            <Input
                                type="number"
                                id="budget"
                                step="0.01"
                                placeholder="0.00"
                                disabled={!isOwner}
                                value={field.state.value === 0 || field.state.value === "0" ? "" : field.state.value}
                                onBlur={field.handleBlur}
                                onChange={(e) => field.handleChange(e.target.value)}
                                className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                            />
                        </div>
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
                            disabled={!isOwner}
                            checked={field.state.value}
                            onCheckedChange={(checked) => field.handleChange(checked === true)}
                        />
                        <Label htmlFor="is_completed" className="font-normal text-sm font-semibold text-gray-700">Mark project as completed</Label>
                    </div>
                )}
            </editForm.Field>

            {/* Manage Members */}
            <div className="pt-5 border-t border-gray-200 mt-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Manage Team Members</h3>
                <p className="text-xs text-gray-500 mb-3">Add or remove collaborators from your project</p>

                {/* Search Field - Hide if not owner */}
                {isOwner && (
                    <div className="relative mt-2">
                        <div className="relative">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Add users by username or email..."
                                className="pl-8 border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                value={userQuery}
                                onChange={(e) => setUserQuery(e.target.value)}
                            />
                        </div>
                        {userQuery.length >= 2 && (
                            <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-xl shadow-xl mt-1 max-h-60 overflow-y-auto">
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
                )}

                {/* Active Member List in Form */}
                <div className="mt-4 space-y-2">
                    <p className="text-xs font-medium text-gray-500 uppercase">Current Team ({formMembers.length})</p>
                    <div className="flex flex-wrap gap-2">
                        {formMembers.map((user) => (
                            <div key={user.id} className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-800 px-3 py-1.5 rounded-full text-sm">
                                <Avatar className="h-5 w-5">
                                    <AvatarImage src={user.profile_photo_url} />
                                    <AvatarFallback className="text-[10px]">{getInitials(user)}</AvatarFallback>
                                </Avatar>
                                <span>{user.username}</span>
                                <span className="text-xs text-blue-600 border-l pl-2 border-blue-300">{user.role}</span>
                                {/* Only show remove button if user is owner and they are not removing themselves */}
                                {isOwner && (
                                    <button
                                        type="button"
                                        onClick={() => setFormMembers(formMembers.filter(m => m.id !== user.id))}
                                        className="hover:bg-blue-100 rounded-full p-0.5 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {isOwner && (
                <editForm.Subscribe
                    selector={(state) => ({
                        isSubmitting: state.isSubmitting,
                        values: state.values
                    })}
                >
                    {({ isSubmitting, values }) => {
                        // Check to ensure fields are filled before enabling submit button
                        const isNameValid = values.name.length >= 3;
                        const isDescValid = values.description.length >= 3 && values.description.length <= 500;
                        const isBudgetValid = Number(values.budget) >= 0;

                        const isFormValid = isNameValid && isDescValid && isBudgetValid;

                        return (
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="w-full bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 mt-6"
                            >
                                {isUpdating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Saving Changes...
                                    </span>
                                ) : "Save Changes"}
                            </Button>
                        );
                    }}
                </editForm.Subscribe>
            )}

        </form>
    )
}