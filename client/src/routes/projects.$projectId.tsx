import { createFileRoute, useParams, useNavigate } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { DashboardLayout } from '@/components/layouts/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ArrowLeft } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

export const Route = createFileRoute('/projects/$projectId')({
    component: ProjectDetail,
})

function ProjectDetail() {
    const { user, session, isAuthenticated } = useAuth()
    const navigate = useNavigate()
    const { projectId } = useParams({ from: '/projects/$projectId' })

    const [project, setProject] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState("")

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
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        if (isAuthenticated && session?.access_token) {
            fetchProject()
        }
    }, [projectId, session])

    return (
        <DashboardLayout>
            {isLoading && (
                <div className='flex justify-center items-center min-h-screen gap-2'><Spinner />Loading...</div>
            )}
            {error && (
                <div className='flex flex-col items-center justify-center min-h-screen'>
                    <p>{error}</p>
                    <Button onClick={() => navigate({ to: "/projects" })}>Back</Button>
                </div>
            )}
            {!isLoading && !project && (
                <div className='flex flex-col items-center justify-center min-h-screen'>
                    <h2>Project Not Found</h2>
                    <p>The project you're looking for doesn't exist.</p>
                    <Button onClick={() => navigate({ to: "/projects" })}>Back</Button>
                </div>
            )}
            {!isLoading && project && (
                <div className='min-h-screen bg-gray-50'>
                    <div className='bg-white border-b border-gray-200 sticky top-0 z-10 p-6'>
                        <div className='flex justify-between items-center'>
                            {/* Left Side */}
                            <div className='flex items-center gap-4'>
                                <Button variant="ghost" onClick={() => navigate({ to: "/projects" })}><ArrowLeft className='w-5 h-5' /></Button>
                                <div className='flex flex-col'>
                                    <h1 className='text-2xl font-bold text-gray-900'>{project.name}</h1>
                                    <p className='text-sm text-gray-600 mt-1 line-clamp-2'>{project.description}</p>
                                </div>
                            </div>
                            {/* Right Side */}
                            <div className='text-right'>
                                <p className='text-xs text-gray-500 mb-1'>Budget</p>
                                <p className='text-lg font-bold text-slate-600'>{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(project.budget)}</p>
                            </div>
                        </div>
                    </div>
                    <Tabs defaultValue="kanban" className='flex-1'>
                        <TabsList className='border-b px-6 bg-white'>
                            <TabsTrigger value="kanban">Kanban Board</TabsTrigger>
                            <TabsTrigger value="gantt">Gantt Chart</TabsTrigger>
                        </TabsList>
                        <TabsContent value="kanban" className='p-6'>
                            <p className='text-gray-500 text-center py-8'>Kanban Board</p>
                        </TabsContent>
                        <TabsContent value="gantt" className='p-6'>
                            <p className='text-gray-500 text-center py-8'>Gantt Chart</p>
                        </TabsContent>
                    </Tabs>
                </div>
            )}
        </DashboardLayout>
    )
}
