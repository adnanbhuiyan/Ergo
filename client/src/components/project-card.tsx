import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowRight, MoreVertical, Trash2 } from "lucide-react";

interface ProjectCardProps {
    id: string;
    name: string;
    description: string;
    budget: number;
    created_at: string;
    completed_at?: string | null; // Added prop
    onClick: () => void;
    onDelete: (id: string) => void; 
}

export function ProjectCard({ id, name, description, budget, created_at, completed_at, onClick, onDelete }: ProjectCardProps) {
    const isCompleted = !!completed_at;

    return (
        <Card 
            onClick={onClick} 
            className={`cursor-pointer hover:shadow-lg transition-shadow h-full relative group ${isCompleted ? 'bg-gray-50/50' : ''}`}
        >
            <CardHeader>
                <div className="flex justify-between items-start gap-2">
                
                    <CardTitle className={`leading-tight ${isCompleted ? 'text-gray-600' : ''}`}>{name}</CardTitle>
                    

                    <div className="flex items-center gap-2 shrink-0">
                        <Badge 
                            variant={isCompleted ? "secondary" : "default"}
                            className={`whitespace-nowrap ${isCompleted ? 'bg-gray-200 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-800 hover:bg-green-100'}`}
                        >
                            {isCompleted ? "Completed" : "Active"}
                        </Badge>
                        
                        <div onClick={(e) => e.stopPropagation()}>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="h-8 w-8 p-0 hover:bg-slate-100">
                                        <span className="sr-only">Open menu</span>
                                        <MoreVertical className="h-4 w-4 text-gray-500" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem 
                                        className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onDelete(id);
                                        }}
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete Project
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-gray-600 mb-4 line-clamp-2">{description}</p>
                <div className="flex justify-between items-center">
                    <div>
                        <label className="text-xs text-gray-500 mb-1">Budget</label>
                        <p className={`text-lg font-bold ${isCompleted ? 'text-gray-500' : 'text-slate-600'}`}>
                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(budget)}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">
                            {new Date(created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                </div>
            </CardContent>
            <CardFooter>
                <div className={`text-sm flex items-center gap-1 cursor-pointer ${isCompleted ? 'text-gray-500' : 'text-blue-600'}`}>
                    <p>View Project</p>
                    <ArrowRight className="h-4 w-4" />
                </div>
            </CardFooter>
        </Card>
    );
}