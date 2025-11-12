import Missing from "../../assets/missing.svg"; 
import { Link } from '@tanstack/react-router';
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4"> 
        <img 
          src={Missing} 
          alt="Animated 404 graphic" 
          className="w-full max-w-6xl mb-8" 
        />
        <p className="text-2xl md:text-3xl font-semibold text-gray-700 mb-4">
          The page you are looking for does not exist.
        </p>
        <Link 
          to="/" 
        >
            <Button variant="outline" size="lg" className="p-8 w-3xs cursor-pointer">
                  Go to homepage
            </Button>
        </Link>
    </div>
  )
}
