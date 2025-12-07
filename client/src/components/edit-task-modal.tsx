import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useForm } from "@tanstack/react-form";
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
import { Search, X, UserPlus } from "lucide-react";

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

    const [currentAssignees, setCurrentAssignees] = useState<User[]>([]);
    const [userQuery, setUserQuery] = useState("");
    const [userSearchResults, setUserSearchResults] = useState<User[]>([]);
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const [formAssignees, setFormAssignees] = useState<User[]>([]);

    // Fetch current assignees when modal opens
    useEffect(() => {
        if (isOpen && task.id) {
            fetchAssignees();
        }
    }, [isOpen, task.id]);

    const fetchAssignees = async () => {
        try {
            const response = await fetch(
                `http://localhost:8000/tasks/${task.id}/assignees`,
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

    // Search users UseEffect
    useEffect(() => {
        const searchUsers = async () => {
            if (!userQuery || userQuery.length < 2) {
                setUserSearchResults([]);
                return;
            }
            setIsSearchingUsers(true);
            try {
                const response = await fetch(
                    `http://localhost:8000/users?user_query=${encodeURIComponent(userQuery)}`,
                    {
                        headers: { Authorization: `Bearer ${session?.access_token}` },
                    }
                );
                if (response.ok) {
                    const data = await response.json();
                    const filtered = data.filter(
                        (u: User) => !formAssignees.some((a) => a.id === u.id)
                    );
                    setUserSearchResults(filtered);
                }
            } catch (error) {
                console.error("Failed to search users", error);
            } finally {
                setIsSearchingUsers(false);
            }
        };

        const timeoutId = setTimeout(searchUsers, 300);
        return () => clearTimeout(timeoutId);
    }, [userQuery, session?.access_token, formAssignees]);

    const handleAddAssignee = (user: User) => {
        setFormAssignees([...formAssignees, user]);
        setUserQuery("");
        setUserSearchResults([]);
    };

    const handleRemoveAssignee = (userId: string) => {
        setFormAssignees(formAssignees.filter((a) => a.id !== userId));
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

                for (let pair of formData.entries()) {
                    console.log(pair[0], '=', pair[1]);
                }

                const response = await fetch(
                    `http://localhost:8000/tasks/${task.id}`,
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

                // Update assignees
                const assigneesToAdd = formAssignees.filter(
                    (fa) => !currentAssignees.some((ca) => ca.id === fa.id)
                );
                const assigneesToRemove = currentAssignees.filter(
                    (ca) => !formAssignees.some((fa) => fa.id === ca.id)
                );

                await Promise.all([
                    ...assigneesToAdd.map((user) =>
                        fetch(
                            `http://localhost:8000/tasks/${task.id}/assignees?assignee_id=${user.id}`,
                            {
                                method: "POST",
                                headers: { Authorization: `Bearer ${session?.access_token}` },
                            }
                        )
                    ),
                    ...assigneesToRemove.map((user) =>
                        fetch(
                            `http://localhost:8000/tasks/${task.id}/assignees/${user.id}`,
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

                    {/* Priority and Status - Side by side */}
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
                                            className="z-[100] bg-white border border-gray-200 shadow-lg"
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
                                            className="z-[100] bg-white border border-gray-200 shadow-lg"
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

                    {/* Budget, Expense, Hours - 3 columns */}
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

                        {/* Search */}
                        <div className="relative mt-2">
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                                <Input
                                    placeholder="Search users to assign..."
                                    className="pl-8"
                                    value={userQuery}
                                    onChange={(e) => setUserQuery(e.target.value)}
                                />
                            </div>

                            {/* Search Results */}
                            {userQuery.length >= 2 && (
                                <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                                    {isSearchingUsers ? (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            Searching...
                                        </div>
                                    ) : userSearchResults.length > 0 ? (
                                        userSearchResults.map((user) => (
                                            <div
                                                key={user.id}
                                                className="p-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3"
                                                onClick={() => handleAddAssignee(user)}
                                            >
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={user.profile_photo_url} />
                                                    <AvatarFallback>{getInitials(user)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium">
                                                        {getDisplayName(user)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{user.email}</p>
                                                </div>
                                                <UserPlus className="h-4 w-4 text-gray-400" />
                                            </div>
                                        ))
                                    ) : (
                                        <div className="p-4 text-center text-sm text-gray-500">
                                            No users found
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Current Assignees */}
                        {formAssignees.length > 0 && (
                            <div className="mt-3 space-y-2">
                                <Label className="text-sm text-gray-600">
                                    Assigned ({formAssignees.length})
                                </Label>
                                <div className="space-y-2">
                                    {formAssignees.map((assignee) => (
                                        <div
                                            key={assignee.id}
                                            className="flex items-center justify-between p-2 bg-gray-50 rounded-md"
                                        >
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={assignee.profile_photo_url} />
                                                    <AvatarFallback>{getInitials(assignee)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-medium">
                                                        {getDisplayName(assignee)}
                                                    </p>
                                                    <p className="text-xs text-gray-500">{assignee.position}</p>
                                                </div>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleRemoveAssignee(assignee.id)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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