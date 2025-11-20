import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "./ui/card";
import { Badge } from "./ui/badge";
import { ArrowRight } from "lucide-react";

interface ProjectCardProps {
    id: string,
    name: string,
    description: string,
    budget: number,
    created_at: string,
    onClick: () => void // Function with no parameters returns nothing
}

export function ProjectCard({ id, name, description, budget, created_at, onClick }: ProjectCardProps) {
    return (
        <Card onClick={onClick} className="cursor-pointer hover:shadow-lg transition-shadow h-full">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle>{name}</CardTitle>
                    <Badge className="bg-green-100 text-green-800">Active</Badge>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <label className="text-xs text-gray-500 mb-1">Budget</label>
                        <p className="text-lg font-bold text-slate-600">{new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget)}</p>
                    </div>
                    <div>
                        <p className="text-sx text-gray-500">
                            {new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <div className="text-sm text-blue-600 flex items-center gap-1 cursor-pointer">
                    <p>View Project</p>
                    <ArrowRight /></div>
            </CardFooter>
        </Card>
    )
}