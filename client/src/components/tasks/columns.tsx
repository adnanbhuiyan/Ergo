import type { ColumnDef } from "@tanstack/react-table"
import { Badge } from "../ui/badge"

export type Tasks = {
    id: string,
    name: string,
    description: string,
    priority: string,
    status: string,
    due_date: string,
}

export const columns: ColumnDef<Tasks>[] = [
    {
        accessorKey: "name",
        header: "Name",
    },
    {
        accessorKey: "priority",
        header: "Priority",
        cell: ({ row }) => {
            const priority = row.getValue("priority") as string
            const colorClass = priority === "High" ? "bg-red-100 text-red-800"
                : priority === "Medium" ? "bg-yellow-100 text-yellow-800" : "bg-green-100 text-green-800"
            return <Badge className={colorClass}>{priority}</Badge>
        }
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string
            return <Badge className="bg-blue-100 text-blue-800">{status}</Badge>
        }
    },
    {
        accessorKey: "due_date",
        header: "Due Date",
        cell: ({ row }) => {
            const date = row.getValue("due_date") as string
            return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        }
    },
]