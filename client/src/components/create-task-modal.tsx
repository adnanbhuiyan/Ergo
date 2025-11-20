import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useForm } from "@tanstack/react-form"
import { useAuth } from "@/contexts/AuthContext";
import { Textarea } from "./ui/textarea";

interface CreateTaskModalProps {
    projectId: string,
    onTaskCreated: () => void // Callback function to refresh tasks after creation
    trigger: ReactNode // Button that opens the modal
    defaultStatus?: string
}

export function CreateTaskModal({ projectId, onTaskCreated, trigger, defaultStatus = "To-Do" }: CreateTaskModalProps) {
    const { session, user } = useAuth()
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const form = useForm({
        defaultValues: {
            name: "",
            description: "",
            priority: "Medium",
            status: defaultStatus,
            estimated_completion_time: 0,
            budget: 0,
            expense: 0,
            due_date: ""
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
                const response = await fetch(`http://localhost:8000/projects/${projectId}/tasks`, {
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

                    setError(errorMessage);
                    setIsLoading(false)
                    return
                }

                const createdTask = data

                try {
                    console.log(user?.id)
                    console.log("🟢 Assigning task to user ID:", user?.id)
                    console.log("🟢 Full user object:", user)
                    const assignResponse = await fetch(`http://localhost:8000/tasks/${createdTask.id}/assignees?assignee_id=${user?.id}`, {
                        method: 'POST',
                        headers: { "Authorization": `Bearer ${session?.access_token}` }
                    })

                    if (!assignResponse.ok) {
                        console.error("Failed to assign task")
                    }

                } catch (err) {
                    console.error("Error assigning task:", err)
                }

                setIsOpen(false)
                setError("")
                form.reset()
                onTaskCreated()
                setIsLoading(false)

            } catch (err) {
                console.error("Error creating task:", err)
                setError("Network error. Please try again.")
                setIsLoading(false)
            }
        }
    })

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild={true}>
                {trigger}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Create New Task</DialogTitle>
                </DialogHeader>
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
                        {error}
                    </div>
                )}
                <form onSubmit={(e) => {
                    e.preventDefault() // Stops page refresh
                    e.stopPropagation() // Stops event bubbling
                    form.handleSubmit() // Triggers tanstack form submission
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

                    {/* Priority Field */}
                    <form.Field name="priority">
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="priority">Priority *</Label>
                                <Select value={field.state.value} onValueChange={field.handleChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Priority"></SelectValue>
                                    </SelectTrigger>
                                    <SelectContent>
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
                                    <SelectContent>
                                        <SelectItem value="To-Do">To-Do</SelectItem>
                                        <SelectItem value="In-Progress">In-Progress</SelectItem>
                                        <SelectItem value="In-Review">In-Review</SelectItem>
                                        <SelectItem value="Blocked">Blocked</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                    </SelectContent>
                                </Select>
                                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                    <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    {/* Estimated Time Field */}
                    <form.Field name="estimated_completion_time" validators={{
                        onChange: ({ value }) => {
                            if (value < 0) return "Must be 0 or greater"
                        }
                    }}>
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="estimated_completion_time">Estimated Hours *</Label>
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
                                    step="0.01" // Allows decimals
                                    min="0"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                    placeholder="0.00"
                                />
                                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                    <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                )}
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
                                    step="0.01" // Allows decimals
                                    min="0"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(Number(e.target.value))}
                                    placeholder="0.00"
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
                                    placeholder="0.00"
                                />
                                {field.state.meta.errors && field.state.meta.errors.length > 0 && (
                                    <p className="text-red-500 text-sm">{field.state.meta.errors[0]}</p>
                                )}
                            </div>
                        )}
                    </form.Field>

                    <Button type="submit" disabled={isLoading} className="w-full bg-slate-600 hover:bg-slate-700 text-white">
                        {isLoading ? "Creating ..." : "Create Task"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    )
}