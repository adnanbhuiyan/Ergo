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
    isOwner: boolean;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function EditTaskModal({ task, isOwner, isOpen, onClose, onSuccess }: EditTaskModalProps) {
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
            <DialogContent className="sm:max-w-[700px] bg-gradient-to-br from-gray-50 to-white max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold text-gray-900">Edit Task {isOwner ? "" : "(Viewer Permissions Only)"}</DialogTitle>
                    <p className="text-sm text-gray-500 mt-2">
                        {isOwner ? "Update task details and assignments" : "View task information"}
                    </p>
                </DialogHeader>

                {!isOwner && (
                    <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p className="text-sm text-yellow-800">
                            <span className="font-semibold">View Only:</span> You can view this task but cannot make changes. Only the task creator can edit.
                        </p>
                    </div>
                )}

                {updateError && (
                    <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">
                        {updateError}
                    </div>
                )}

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (isOwner) editForm.handleSubmit();
                    }}
                    className="space-y-5"
                >
                    {/* Task Name */}
                    <editForm.Field name="name">
                        {(field) => (
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-sm font-semibold text-gray-700">Task Name *</Label>
                                <Input
                                    className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                    id="name"
                                    disabled={!isOwner}
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
                                <Label htmlFor="description" className="text-sm font-semibold text-gray-700">Description *</Label>
                                <Textarea
                                    id="description"
                                    disabled={!isOwner}
                                    value={field.state.value}
                                    onBlur={field.handleBlur}
                                    onChange={(e) => field.handleChange(e.target.value)}
                                    rows={3}
                                    className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        )}
                    </editForm.Field>

                    <div className="border-t border-gray-200 pt-5 mt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Task Details</h3>
                        {/* Priority and Status */}
                        <div className="grid grid-cols-2 gap-4">
                            <editForm.Field name="priority">
                                {(field) => (
                                    <div className="space-y-2">
                                        <Label>Priority *</Label>
                                        <Select
                                            value={field.state.value}
                                            onValueChange={field.handleChange}
                                            disabled={!isOwner}
                                        >
                                            <SelectTrigger className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="z-[100] bg-white border border-gray-200 shadow-xl rounded-xl"
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
                                            disabled={!isOwner}
                                        >
                                            <SelectTrigger className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent
                                                position="popper"
                                                className="z-[100] bg-white border border-gray-200 shadow-xl rounded-xl"
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
                    </div>

                    {/* Budget, Expense, Hours */}
                    <div className="grid grid-cols-3 gap-4">
                        <editForm.Field name="budget">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="budget" className="text-sm font-semibold text-gray-700">Budget *</Label>
                                    <Input
                                        className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        id="budget"
                                        type="number"
                                        step="0.01"
                                        disabled={!isOwner}
                                        value={field.state.value === 0 ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.handleChange(val === "" ? 0 : Number(val));
                                        }}
                                    />
                                </div>
                            )}
                        </editForm.Field>

                        <editForm.Field name="expense">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="expense" className="text-sm font-semibold text-gray-700">Expense *</Label>
                                    <Input
                                        className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        id="expense"
                                        type="number"
                                        step="0.01"
                                        disabled={!isOwner}
                                        value={field.state.value === 0 ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.handleChange(val === "" ? 0 : Number(val));
                                        }}
                                    />
                                </div>
                            )}
                        </editForm.Field>

                        <editForm.Field name="estimated_completion_time">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="hours" className="text-sm font-semibold text-gray-700">Hours *</Label>
                                    <Input
                                        className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        id="hours"
                                        type="number"
                                        disabled={!isOwner}
                                        value={field.state.value === 0 ? "" : field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            field.handleChange(val === "" ? 0 : Number(val));
                                        }}
                                    />
                                </div>
                            )}
                        </editForm.Field>
                    </div>

                    <div className="border-t border-gray-200 pt-5 mt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-4">Timeline</h3>
                        {/* Due Date */}
                        <editForm.Field name="due_date">
                            {(field) => (
                                <div className="space-y-2">
                                    <Label htmlFor="due_date" className="text-sm font-semibold text-gray-700">Due Date *</Label>
                                    <Input
                                        className="border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        id="due_date"
                                        type="date"
                                        disabled={!isOwner}
                                        value={field.state.value}
                                        onBlur={field.handleBlur}
                                        onChange={(e) => field.handleChange(e.target.value)}
                                    />
                                </div>
                            )}
                        </editForm.Field>
                    </div>

                    {/* Assignees Section */}
                    <div className="pt-5 border-t border-gray-200 mt-5">
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Task Assignees</h3>
                        {isOwner && (
                            <p className="text-xs text-gray-500 mb-3">Select team members to assign to this task</p>
                        )}
                        {/* Show viewer message if not owner */}
                        {!isOwner && (
                            <p className="text-xs text-gray-500 mt-1 mb-2">
                                Only the task creator can modify assignees.
                            </p>
                        )}

                        <div className="mt-3 border border-gray-200 rounded-xl p-4 max-h-48 overflow-y-auto space-y-3 bg-gray-50">
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
                                                disabled={!isOwner}
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
                                                className={`flex items-center gap-2 text-sm font-normal w-full ${isOwner ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'}`}
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
                    <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-gray-200">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all"
                        >
                            {isOwner ? "Cancel" : "Close"}
                        </Button>
                        {isOwner && (
                            <Button
                                type="submit"
                                disabled={isUpdating}
                                className="bg-gradient-to-r from-blue-600 to-slate-600 hover:from-blue-700 hover:to-slate-700 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
                            >
                                {isUpdating ? (
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Updating...
                                    </span>
                                ) : "Update Task"}
                            </Button>
                        )}
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}