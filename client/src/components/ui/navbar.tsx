import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function Navbar() {
  return (
    <nav className="w-full bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center">
            <span className="text-2xl font-bold text-gray-900 hover:text-slate-600 transition-colors">
              Ergo
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-gray-700 hover:text-gray-900 font-medium transition-colors">
              Login
            </Link>
            <Link to="/register">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Sign up
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
