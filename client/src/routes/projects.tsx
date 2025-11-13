import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "@tanstack/react-router";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form"
import { DashboardLayout } from "@/components/layouts/DashboardLayout";
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/projects")({
  component: RouteComponent,
});

function RouteComponent() {
  const { session, isAuthenticated } = useAuth()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }

  const navigate = useNavigate()

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" })
    }
  }, [isAuthenticated, navigate])

  const form = useForm({
    defaultValues: {
      name: '',
      description: '',
      budget: 0,
    },
    onSubmit: async ({ value }) => {
      setError("")
      setIsLoading(true)
      const formData = new FormData()

      if (value.name !== undefined) {
        formData.append("name", value.name)
      }

      if (value.description !== undefined) {
        formData.append("description", value.description)
      }

      if (value.budget !== undefined) {
        formData.append("budget", String(value.budget))
      }

      const response = await fetch("http://localhost:8000/projects", {
        method: "POST",
        headers: { "Authorization": `Bearer ${session?.access_token}` },
        body: formData
      })

      const data = await response.json()

      if (!response.ok) {
        let errorMessage = "Registration failed. Please check your inputs.";

        const errorData: { detail?: FastAPIValidationError[] | string } = data;

        if (
          errorData.detail &&
          Array.isArray(errorData.detail) &&
          errorData.detail.length > 0
        ) {
          errorMessage = errorData.detail
            .map((err: FastAPIValidationError) => {
              const field = err.loc[err.loc.length - 1]; // Get the field name
              return `${field}: ${err.msg}`;
            })
            .join("; ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      } else {
        setIsModalOpen(false)
        setError("")
        setIsLoading(false)
        form.reset()
        // Navigate to dashboard to see the new project
        navigate({ to: "/dashboard" })
      }
    }
  })

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gray-50 p-6">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-gray-800">Projects</h1>
        </header>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsModalOpen(true)} variant="default" size="sm" className="bg-slate-600 hover:bg-slate-700 text-white">Create Project</Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[500px] bg-white z-50">
            <DialogHeader>
              <DialogTitle>Create New Project</DialogTitle>
            </DialogHeader>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 p-3 rounded mb-4">{error}</div>
            )}
            <form onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }} className="space-y-0">
              <form.Field name="name" validators={{
                onChange: ({ value }) => {
                  if (value.length < 3) return "Name must be at least 3 characters."
                },
              }}>
                {(field) => (
                  <div className="mb-4">
                    <Label htmlFor="name">Project Name</Label>
                    <Input id="name" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                    {field.state.meta.errors ? (
                      <p className="text-red-500 text-sm mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
              <form.Field name="description" validators={{
                onChange: ({ value }) => {
                  if (value.length > 500) return "Max 500 Characters"
                },
              }}>
                {(field) => (
                  <div className="mb-4">
                    <Label htmlFor="description">Description</Label>
                    <Input id="description" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(e.target.value)} className="mt-1" />
                    {field.state.meta.errors ? (
                      <p className="text-red-500 text-sm mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
              <form.Field name="budget" validators={{
                onChange: ({ value }) => {
                  if (value < 0) return "Budget must be at least 0"
                },
              }}>
                {(field) => (
                  <div className="mb-6">
                    <Label htmlFor="budget">Budget</Label>
                    <Input type="number" id="budget" value={field.state.value} onBlur={field.handleBlur} onChange={(e) => field.handleChange(Number(e.target.value))} className="mt-1" />
                    {field.state.meta.errors ? (
                      <p className="text-red-500 text-sm mt-1">
                        {field.state.meta.errors[0]}
                      </p>
                    ) : null}
                  </div>
                )}
              </form.Field>
              <Button type="submit" disabled={isLoading} className="w-full bg-slate-600 hover:bg-slate-700 text-white mt-4">
                {isLoading ? "Creating..." : "Create Project"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  )
}
