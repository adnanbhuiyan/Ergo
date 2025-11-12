import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Link } from '@tanstack/react-router';
import Landing from "../assets/landing.svg"; 
import Navbar from "@/components/ui/navbar"; 
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useAuth } from "../contexts/AuthContext";

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const navigate = useNavigate();
  
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  return (
      <>
        <Navbar />
        <div className="flex h-screen w-full items-center justify-center bg-slate-600">
        <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-4 md:grid-cols-2 lg:gap-20">
          <div className="flex flex-col items-start text-left text-white">
            <h1 className="mb-4 text-6xl font-bold leading-tight md:text-6xl lg:text-9xl">
              Ergo
            </h1>
            <p className="mb-8 text-lg text-gray-200 md:text-xl">
              Collaborate and manage your projects with your team
            </p>
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-x-4 sm:space-y-0">
              <Link to="/login">
                <Button variant="outline" size="lg">
                  Login
                </Button>
              </Link>
              <Link to="/register">
                <Button variant="outline" size="lg" className="bg-transparent text-white hover:bg-white hover:text-slate-600">
                  Register
                </Button>
              </Link>

            </div>
          </div>

          <div className="flex items-center justify-center">
            <img
              src={Landing}
              alt="Recruiting process illustration"
              className="w-full max-w-lg rounded-lg object-cover"
            />
          </div>
        </div>
      </div>
    </>
  )
}
