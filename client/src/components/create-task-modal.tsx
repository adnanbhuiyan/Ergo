import { useState, type ReactNode, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox" 
import { useForm } from "@tanstack/react-form"
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "./ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"; // Assuming you have these components available
import { getApiUrl } from "@/lib/api";

interface CreateTaskModalProps {
    projectId: string,
    onTaskCreated: () => void
    trigger: ReactNode
    defaultStatus?: string
}

// Interface for fetching existing tasks
interface SimpleTask {
    id: string;
    name: string;
}

// Interface for fetching project members
interface ProjectMember {
    user: {
        id: string;
        username: string;
        first_name: string;
        last_name: string;
        profile_photo_url: string;
    }
    role: string;
}

export function CreateTaskModal({ projectId, onTaskCreated, trigger, defaultStatus = "To-Do" }: CreateTaskModalProps) {
    const { session, user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")
    
    // State to hold existing tasks and members
    const [existingTasks, setExistingTasks] = useState<SimpleTask[]>([])
    const [projectMembers, setProjectMembers] = useState<ProjectMember[]>([])

    // Fetch data when modal opens
    useEffect(() => {
        if (isOpen && projectId && session?.access_token) {
            const fetchData = async () => {
                try {
                    // 1. Fetch Tasks (for dependencies)
                    const tasksRes = await fetch(`${getApiUrl()}/projects/${projectId}/tasks`, {
                        method: "GET",
                        headers: { "Authorization": `Bearer ${session.access_token}` }
                    });
                    if (tasksRes.ok) {
                        setExistingTasks(await tasksRes.json());
                    }

                    // 2. Fetch Members (for assignees)
                    const membersRes = await fetch(`${getApiUrl()}/projects/${projectId}/members`, {
                        method: "GET",
                        headers: { "Authorization": `Bearer ${session.access_token}` }
                    });
                    if (membersRes.ok) {
                        setProjectMembers(await membersRes.json());
                    }

                } catch (err) {
                    console.error("Failed to load project data", err);
                }
            };
            fetchData();
        }
    }, [isOpen, projectId, session]);

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            priority: "Medium",
            status: defaultStatus,
            estimated_completion_time: 0,
            budget: 0,
            expense: 0,
            due_date: "",
            dependency_task_ids: [] as string[],
            assignee_ids: [] as string[] 
        },
        onSubmit: async ({ value }) => {
            setError("")
            setIsLoading(true)
            const formData = new FormData()

            formData.append("name", value.name)
            formData.append("description", value.description)
            formData.append("priority", value.priority)
            formData.append("status", value.status)
            formData.append("estimated_completion_time", String(value.estimated_completion_time))
            formData.append("budget", String(value.budget))
            formData.append("expense", String(value.expense))
            formData.append("due_date", value.due_date)

            try {
                // Create the Task
                const response = await fetch(`${getApiUrl()}/projects/${projectId}/tasks`, {
                    method: "POST",
                    headers: { "Authorization": `Bearer ${session?.access_token}` },
                    body: formData
                },)

                const data = await response.json()

                if (!response.ok) {
                    let errorMessage = "Failed to create task. Please check your inputs"
                    if (data.detail && Array.isArray(data.detail)) {
                        errorMessage = data.detail.map((err: any) => {
                            const field = err.loc[err.loc.length - 1];
                            return `${field}: ${err.msg}`;
                        }).join("; ");
                    } else if (typeof data.detail === "string") {
                        errorMessage = data.detail
                    }
                    throw new Error(errorMessage);
                }

                const createdTask = data

                // Assign Users to Task 
                if (value.assignee_ids.length > 0) {
                    try {
                        await Promise.all(
                            value.assignee_ids.map(userId => 
                                fetch(`${getApiUrl()}/tasks/${createdTask.id}/assignees?assignee_id=${userId}`, {
                                    method: 'POST',
                                    headers: { "Authorization": `Bearer ${session?.access_token}` }
                                })
                            )
                        );
                    } catch (err) {
                        console.error("Error assigning users:", err)
                    }
                } else if (user?.id) {
                    // If no one selected, assign task creator to be responsible for the task
                    await fetch(`${getApiUrl()}/tasks/${createdTask.id}/assignees?assignee_id=${user.id}`, {
                        method: 'POST',
                        headers: { "Authorization": `Bearer ${session?.access_token}` }
                    }) 
                    
                }

                // Add Multiple Dependencies
                if (value.dependency_task_ids.length > 0) {
                    try {
                        await Promise.all(
                            value.dependency_task_ids.map(depId => 
                                fetch(`${getApiUrl()}/tasks/${createdTask.id}/dependencies`, {
                                    method: 'POST',
                                    headers: { 
                                        "Authorization": `Bearer ${session?.access_token}`,
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        depends_on_task_id: depId
                                    })
                                })
                            )
                        );
                    } catch (err) {
                        console.error("Error adding dependencies:", err)
                    }
                }

                setIsOpen(false)
                setError("")
                form.reset()
                onTaskCreated()
            } catch (err: any) {
                console.error("Error creating task:", err)
                setError(err.message || "Network error. Please try again.")
            } finally {
                setIsLoading(false)
            }
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild={true}>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white z-50 max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    form.handleSubmit()
                }} className="space-y-4">

                    {/* Name Field */}
                    <form.Field name="name" validators={{
                        onChange: ({ value }) => {
                            if (value.length < 3) return "Name must be at least 3 characters.";
                        }
                    }}>
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="name">Task Name *</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Enter task name"
                                />
                                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                    <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Description Field */}
                    <form.Field name="description" validators={{
                        onChange: ({ value }) => {
                            if (value.length > 500) return "Max 500 characters."
                        }
                    }}>
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    placeholder="Describe the task." />
                                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                    <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Priority Field */}
                        <form.Field name="priority">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priority *</Label>
                                    <Select value={field.state.value} onValueChange={field.handleChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Priority"></SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="z-100 bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={5}>
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </form.Field>

                        {/* Status Field */}
                        <form.Field name="status">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="status">Status *</Label>
                                    <Select value={field.state.value} onValueChange={field.handleChange}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select Status"></SelectValue>
                                        </SelectTrigger>
                                        <SelectContent className="z-100 bg-white border border-gray-200 shadow-lg" position="popper" sideOffset={5}>
                                            <SelectItem value="To-Do">To-Do</SelectItem>
                                            <SelectItem value="In-Progress">In-Progress</SelectItem>
                                            <SelectItem value="In-Review">In-Review</SelectItem>
                                            <SelectItem value="Blocked">Blocked</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </form.Field>
                    </div>

                    {/* --- Task Assignees Field --- */}
                    <form.Field name="assignee_ids">
                        {(field) => (
                            <div className="space-y-2">
                                <Label>Assignees</Label>
                                <div className="border border-input rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
                                    {projectMembers.length === 0 ? (
                                        <p className="text-sm text-gray-500">No project members found.</p>
                                    ) : (
                                        projectMembers.map((member) => (
                                            <div key={member.user.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`assignee-${member.user.id}`}
                                                    checked={field.state.value.includes(member.user.id)}
                                                    onCheckedChange={(checked) => {
                                                        const current = [...field.state.value];
                                                        if (checked) {
                                                            field.handleChange([...current, member.user.id]);
                                                        } else {
                                                            field.handleChange(current.filter(id => id !== member.user.id));
                                                        }
                                                    }}
                                                />
                                                <Label 
                                                    htmlFor={`assignee-${member.user.id}`} 
                                                    className="flex items-center gap-2 text-sm font-normal cursor-pointer w-full"
                                                >
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarImage src={member.user.profile_photo_url} />
                                                        <AvatarFallback className="text-[10px]">
                                                            {member.user.first_name?.[0]}{member.user.last_name?.[0]}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="truncate">
                                                        {member.user.first_name} {member.user.last_name} 
                                                        <span className="text-gray-400 ml-1">(@{member.user.username})</span>
                                                    </span>
                                                </Label>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}
                    </form.Field>

                    {/* Dependencies Multi-Select Field */}
                    <form.Field name="dependency_task_ids">
                        {(field) => (
                            <div className="space-y-2">
                                <Label>Dependencies (Optional)</Label>
                                <div className="border border-input rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
                                    {existingTasks.length === 0 ? (
                                        <p className="text-sm text-gray-500">No other tasks available.</p>
                                    ) : (
                                        existingTasks.map((task) => (
                                            <div key={task.id} className="flex items-center space-x-2">
                                                <Checkbox 
                                                    id={`dep-${task.id}`}
                                                    checked={field.state.value.includes(task.id)}
                                                    onCheckedChange={(checked) => {
                                                        const current = [...field.state.value];
                                                        if (checked) {
                                                            field.handleChange([...current, task.id]);
                                                        } else {
                                                            field.handleChange(current.filter(id => id !== task.id));
                                                        }
                                                    }}
                                                />
                                                <Label 
                                                    htmlFor={`dep-${task.id}`} 
                                                    className="text-sm font-normal cursor-pointer leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                                >
                                                    {task.name}
                                                </Label>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <p className="text-xs text-gray-500">
                                    Select tasks that must be completed before this task starts.
                                </p>
                            </div>
                        )}
                    </form.Field>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Estimated Time Field */}
                        <form.Field name="estimated_completion_time" validators={{
                            onChange: ({ value }) => {
                                if (value < 0) return "Must be 0 or greater"
                            }
                        }}>
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="estimated_completion_time">Est. Hours *</Label>
                                    <Input
                                        id="estimated_completion_time"
                                        type="number"
                                        min="0"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        placeholder="0"
                                    />
                                    {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                        <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                    )}
                                </div>
                            )}
                        </form.Field>

                        {/* Due Date Field */}
                        <form.Field name="due_date">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="due_date">Due Date *</Label>
                                    <Input
                                        id="due_date"
                                        type="date"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Budget Field */}
                        <form.Field name="budget" validators={{
                            onChange: ({ value }) => {
                                if (value < 0) return "Must be 0 or greater"
                            }
                        }}>
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget *</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                        </form.Field>

                        {/* Expense Field */}
                        <form.Field name="expense" validators={{
                            onChange: ({ value }) => {
                                if (value < 0) return "Must be 0 or greater"
                            }
                        }}>
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="expense">Expense *</Label>
                                    <Input
                                        id="expense"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                        placeholder="0.00"
                                    />
                                </div>
                            )}
                        </form.Field>
                    </div>

                    <Button type="submit" disabled={isLoading} className="w-full bg-slate-600 hover:bg-slate-700 text-white mt-4">
                        {isLoading ? "Creating ..." : "Create Task"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}