import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@tanstack/react-form";
import { getApiUrl } from "@/lib/api";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";

interface TaskDependency {
    id: string;
    name: string;
    status: string;
}

interface Task {
    id: string;
    name: string;
    description: string;
    priority: string;
    status: string;
    due_date: string;
    created_at: string;
    budget: number;
    expense: number;
    estimated_completion_time: number | null;
    project_id: string;
    depends_on: TaskDependency[];
    blocking: TaskDependency[];
}

interface Assignee {
    user: {
        id: string;
        email: string;
        first_name: string;
        last_name: string;
        username: string;
        position: string;
        profile_photo_url: string;
    };
}

interface User {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    username: string;
    position: string;
    profile_photo_url: string;
}

interface EditTaskModalProps {
    task: Task;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTaskModal({ task, isOpen, onClose, onSuccess }: EditTaskModalProps) {
    const { session } = useAuth();
    const [isUpdating, setIsUpdating] = useState(false);
    const [updateError, setUpdateError] = useState("");

    // State for differing changes in task assignees on submit
    const [currentAssignees, setCurrentAssignees] = useState<User[]>([]);
    
    // State for the UI selection
    const [formAssignees, setFormAssignees] = useState<User[]>([]);
    
    // All available project members
    const [projectMembers, setProjectMembers] = useState<User[]>([]);

    // Fetch data when modal opens
    useEffect(() => {
        if (isOpen && task.id) {
            fetchAssignees();
            if (task.project_id) {
                fetchProjectMembers();
            }
        }
    }, [isOpen, task.id, task.project_id]);

    const fetchAssignees = async () => {
        try {
            const response = await fetch(
                `${getApiUrl()}/tasks/${task.id}/assignees`,
                {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                }
            );
            if (response.ok) {
                const data: Assignee[] = await response.json();
                const users = data.map((a) => a.user);
                setCurrentAssignees(users);
                setFormAssignees(users);
            }
        } catch (err) {
            console.error("Error fetching assignees:", err);
        }
    };

    const fetchProjectMembers = async () => {
        try {
            const response = await fetch(
                `${getApiUrl()}/projects/${task.project_id}/members`,
                {
                    headers: { Authorization: `Bearer ${session?.access_token}` },
                }
            );
            if (response.ok) {
                const data = await response.json();
                const members = data.map((item: any) => item.user);
                setProjectMembers(members);
            }
        } catch (err) {
            console.error("Error fetching project members:", err);
        }
    };

    const getInitials = (user: User) => {
        if (user.first_name && user.last_name)
            return `${user.first_name[0]}${user.last_name[0]}`.toUpperCase();
        if (user.first_name) return user.first_name.slice(0, 2).toUpperCase();
        return user.username?.slice(0, 2).toUpperCase() || "?";
    };

    const getDisplayName = (user: User) => {
        if (user.first_name && user.last_name)
            return `${user.first_name} ${user.last_name}`;
        return user.username || user.email || "Unknown User";
    };

    const editForm = useForm({
        defaultValues: {
            name: task.name,
            description: task.description,
            priority: task.priority,
            status: task.status,
            estimated_completion_time: task.estimated_completion_time || 0,
            budget: task.budget,
            expense: task.expense,
            due_date: new Date(task.due_date).toISOString().split("T")[0],
        },
        onSubmit: async ({ value }) => {
            setUpdateError("");
            setIsUpdating(true);

            try {
                // Update task details
                const formData = new FormData();
                formData.append("name", value.name);
                formData.append("description", value.description);
                formData.append("priority", value.priority);
                formData.append("status", value.status);
                formData.append("estimated_completion_time", String(value.estimated_completion_time));
                formData.append("budget", String(value.budget));
                formData.append("expense", String(value.expense));
                formData.append("due_date", value.due_date);

                const response = await fetch(
                    `${getApiUrl()}/tasks/${task.id}`,
                    {
                        method: "PATCH",
                        headers: { Authorization: `Bearer ${session?.access_token}` },
                        body: formData,
                    }
                );

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || "Failed to update task");
                }

                // Calculate differences in list of assignees
                const assigneesToAdd = formAssignees.filter(
                    (fa) => !currentAssignees.some((ca) => ca.id === fa.id)
                );
                const assigneesToRemove = currentAssignees.filter(
                    (ca) => !formAssignees.some((fa) => fa.id === ca.id)
                );

                await Promise.all([
                    ...assigneesToAdd.map((user) =>
                        fetch(
                            `${getApiUrl()}/tasks/${task.id}/assignees?assignee_id=${user.id}`,
                            {
                                method: "POST",
                                headers: { Authorization: `Bearer ${session?.access_token}` },
                            }
                        )
                    ),
                    ...assigneesToRemove.map((user) =>
                        fetch(
                            `${getApiUrl()}/tasks/${task.id}/assignees/${user.id}`,
                            {
                                method: "DELETE",
                                headers: { Authorization: `Bearer ${session?.access_token}` },
                            }
                        )
                    ),
                ]);

                onSuccess();
                onClose();
            } catch (err: any) {
                setUpdateError(err.message || "Failed to update task");
            } finally {
                setIsUpdating(false);
            }
        },
    });

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[600px] bg-white max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Task</DialogTitle>
                </DialogHeader>

                {updateError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
                        {updateError}
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        editForm.handleSubmit();
                    }}
                    className="space-y-4"
                >
                    {/* Task Name */}
                    <editForm.Field name="name">
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="name">Task Name *</Label>
                                <Input
                                    id="name"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                />
                            </div>
                        )}
                    </editForm.Field>

                    {/* Description */}
                    <editForm.Field name="description">
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="description">Description *</Label>
                                <Textarea
                                    id="description"
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        )}
                    </editForm.Field>

                    {/* Priority and Status */}
                    <div className="grid grid-cols-2 gap-4">
                        <editForm.Field name="priority">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label>Priority *</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={field.handleChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="z-100 bg-white border border-gray-200 shadow-lg"
                                        >
                                            <SelectItem value="Low">Low</SelectItem>
                                            <SelectItem value="Medium">Medium</SelectItem>
                                            <SelectItem value="High">High</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </editForm.Field>

                        <editForm.Field name="status">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label>Status *</Label>
                                    <Select
                                        value={field.state.value}
                                        onValueChange={field.handleChange}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent
                                            position="popper"
                                            className="z-100 bg-white border border-gray-200 shadow-lg"
                                        >
                                            <SelectItem value="To-Do">To-Do</SelectItem>
                                            <SelectItem value="In-Progress">In-Progress</SelectItem>
                                            <SelectItem value="In-Review">In-Review</SelectItem>
                                            <SelectItem value="Blocked">Blocked</SelectItem>
                                            <SelectItem value="Completed">Completed</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                        </editForm.Field>
                    </div>

                    {/* Budget, Expense, Hours */}
                    <div className="grid grid-cols-3 gap-4">
                        <editForm.Field name="budget">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="budget">Budget *</Label>
                                    <Input
                                        id="budget"
                                        type="number"
                                        step="0.01"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </editForm.Field>

                        <editForm.Field name="expense">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="expense">Expense *</Label>
                                    <Input
                                        id="expense"
                                        type="number"
                                        step="0.01"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </editForm.Field>

                        <editForm.Field name="estimated_completion_time">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="hours">Hours *</Label>
                                    <Input
                                        id="hours"
                                        type="number"
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(Number(e.target.value))}
                                    />
                                </div>
                            )}
                        </editForm.Field>
                    </div>

                    {/* Due Date */}
                    <editForm.Field name="due_date">
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
                    </editForm.Field>

                    {/* Assignees Section */}
                    <div className="pt-4 border-t border-gray-200">
                        <Label>Task Assignees</Label>
                        
                        <div className="mt-2 border border-input rounded-md p-3 max-h-40 overflow-y-auto space-y-2 bg-white">
                            {projectMembers.length === 0 ? (
                                <p className="text-sm text-gray-500">No project members found.</p>
                            ) : (
                                projectMembers.map((member) => {
                                    const isSelected = formAssignees.some(u => u.id === member.id);
                                    
                                    return (
                                        <div key={member.id} className="flex items-center space-x-2">
                                            <Checkbox 
                                                id={`assignee-${member.id}`}
                                                checked={isSelected}
                                                onCheckedChange={(checked) => {
                                                    if (checked) {
                                                        setFormAssignees([...formAssignees, member]);
                                                    } else {
                                                        setFormAssignees(formAssignees.filter(u => u.id !== member.id));
                                                    }
                                                }}
                                            />
                                            <Label 
                                                htmlFor={`assignee-${member.id}`} 
                                                className="flex items-center gap-2 text-sm font-normal cursor-pointer w-full"
                                            >
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.profile_photo_url} />
                                                    <AvatarFallback className="text-[10px]">
                                                        {getInitials(member)}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">
                                                    {getDisplayName(member)}
                                                    <span className="text-gray-400 ml-1">(@{member.username})</span>
                                                </span>
                                            </Label>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isUpdating}
                            className="bg-slate-600 hover:bg-slate-700 text-white"
                        >
                            {isUpdating ? "Updating..." : "Update Task"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}