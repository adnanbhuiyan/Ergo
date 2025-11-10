import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { logout, isAuthenticated, user } = useAuth();

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/login" }); // Redirect if not authenticated
    }
  }, [isAuthenticated, navigate]);

  return (
    <div>
      <h2>Hello "/dashboard"!</h2>
      <Button variant="default" size="lg" onClick={() => logout()}>
        Logout
      </Button>
    </div>
  );
}
