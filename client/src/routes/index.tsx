import { createFileRoute } from '@tanstack/react-router'
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from '@tanstack/react-router';
import Navbar from "@/components/ui/navbar"; 
import { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { CheckCircle2, Users, FileText, Zap } from "lucide-react";

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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        {/* Hero Section */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-28">
          <div className="max-w-4xl mx-auto text-center">
            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Transform your workflow with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-slate-600">
                Ergo
              </span>
            </h1>

            {/* Description */}
            <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              We're here to transform the intricacies of your life, providing a user-friendly platform that not only manages your tasks effortlessly but also enhances your overall efficiency.
            </p>

            {/* CTA Button */}
            <Link to="/register">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300">
                Get Started
              </Button>
            </Link>

            {/* Feature Icons */}
            <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-blue-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Task Management</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-green-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Team Collaboration</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Project Tracking</span>
              </div>
              <div className="flex flex-col items-center gap-3 p-6 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-6 h-6 text-orange-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">Boost Productivity</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
