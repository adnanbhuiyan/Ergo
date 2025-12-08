import { createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from "react"
import { useAuth } from '@/contexts/AuthContext'
import { useNavigate } from '@tanstack/react-router'
import { getApiUrl } from '@/lib/api'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Spinner } from '@/components/ui/spinner'
import { DataTable } from '@/components/tasks/data-table'
import { columns } from "@/components/tasks/columns"

export const Route = createFileRoute('/my-tasks')({
    component: MyTasks,
})

function MyTasks() {
    const { user, session, isAuthenticated } = useAuth()
    const navigate = useNavigate()

    const [allTasks, setAllTasks] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        if (!isAuthenticated) {
            navigate({ to: "/login" })
        }
    }, [isAuthenticated, navigate])

    const fetchAllMyTasks = async () => {
        if (!session?.access_token || !isAuthenticated) return

        setIsLoading(true)
        const allTasks: any[] = []

        try {
            const projectsResponse = await fetch(`${getApiUrl()}/projects", {
                method: "GET",
                headers: { "Authorization": `Bearer ${session.access_token}` }
            })

            if (!projectsResponse.ok) return

            const userProjects = await projectsResponse.json()

            for (const project of userProjects) {
                const tasksResponse = await fetch(`${getApiUrl()}/projects/${project.id}/tasks`, {
                    method: "GET",
                    headers: { 'Authorization': `Bearer ${session.access_token}` }
                })

                if (tasksResponse.ok) {
                    const projectTasks = await tasksResponse.json()

                    for (const task of projectTasks) {
                        const assigneesResponse = await fetch(`${getApiUrl()}/tasks/${task.id}/assignees`, {
                            method: "GET",
                            headers: { "Authorization": `Bearer ${session.access_token}` }
                        })
                        if (assigneesResponse.ok) {
                            const assignees = await assigneesResponse.json()

                            const isAssignedToMe = assignees.some(
                                (assignee: any) => {
                                    return assignee.user?.id === user?.id
                                }
                            )

                            if (isAssignedToMe) {
                                allTasks.push(task)
                            }
                        }
                    }
                }
            }

            allTasks.sort((a, b) => {
                const dateA = new Date(a.due_date).getTime();
                const dateB = new Date(b.due_date).getTime()
                return dateA - dateB
            })

            setAllTasks(allTasks)

        } catch (err) {
            console.error("Error fetching upcoming tasks:", err)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && session?.access_token) {
            fetchAllMyTasks()
        }
    }, [isAuthenticated, session])

    return (
        <DashboardLayout>
            <main className='p-8'>
                <h1 className='text-3xl font-bold text-gray-900 mb-2'>My Tasks</h1>
                <p className='text-gray-600 mb-8'>All tasks assigned to you across all projects</p>
                {isLoading ? <Spinner /> : <DataTable columns={columns} data={allTasks} />}
            </main>
        </DashboardLayout>
    )
}
