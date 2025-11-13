import React from "react"
import type { ReactNode } from "react"
import { Link } from "@tanstack/react-router"
import { LayoutDashboard, FolderKanban, Settings } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar"
import { LogOut } from "lucide-react"
import { Button } from "../ui/button"

interface DashboardLayoutProps {
    children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
    const { user, logout } = useAuth()
    const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'U';
    return (
        <div className="flex h-screen">
            <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 bg-slate-50 border-b">
                    <h1 className="text-2xl font-bold text-slate-900">Ergo</h1>
                </div>
                <nav className="flex-1 py-4">
                    <div>
                        <ul>
                            <Link to="/dashboard" className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mx-2 transition-colors" activeProps={{
                                className: "bg-slate-100 text-slate-900 font-medium"
                            }}>
                                <LayoutDashboard className="w-5 h-5" />
                                <span>Dashboard</span>
                            </Link>
                        </ul>
                        <ul>
                            <Link to="/projects" className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mx-2 transition-colors" activeProps={{
                                className: "bg-slate-100 text-slate-900 font-medium"
                            }}>
                                <FolderKanban className="w-5 h-5" />
                                <span>Projects</span>
                            </Link>
                        </ul>
                        <ul>
                            <Link to="/settings" className="flex items-center gap-3 px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-lg mx-2 transition-colors" activeProps={{
                                className: "bg-slate-100 text-slate-900 font-medium"
                            }}>
                                <Settings className="w-5 h-5" />
                                <span>Settings</span>
                            </Link>
                        </ul>
                    </div>
                </nav>
                <div className="border-t p-4 flex items-center gap-3">
                    <Avatar className="w-10 h-10">
                        <AvatarImage src={user?.profile_photo_url} alt={user?.username} />
                        <AvatarFallback className="bg-slate-200 text-slate-700">
                            {initials}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{user?.username}</p>
                    </div>
                </div>
                <Button onClick={() => logout()} variant="default">
                    <LogOut className="w-5 h-5 text-gray-600" />
                </Button>
            </div>
            <div className="flex-1 bg-gray-50 overflow-auto">
                {children}
            </div>
        </div>
    )
}