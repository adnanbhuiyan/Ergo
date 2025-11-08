import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuth } from '../contexts/AuthContext'
import { Button } from "@/components/ui/button";

export const Route = createFileRoute('/dashboard')({
  beforeLoad: ({ context, location }) => {
    //Redirect user to login page if they are not authenticated
    if (!context.auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { logout } = useAuth();
  
  return (
    <div>
      <h2>Hello "/dashboard"!</h2>
      <Button variant="default" size="lg" onClick={() => logout()}>
            Logout
      </Button>
    </div>
  )
  
}
