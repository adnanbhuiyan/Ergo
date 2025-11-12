import React from 'react'
import { Link } from "@tanstack/react-router";

export default function Navbar() {
  return (
    <div>
        <div className="p-2 flex gap-2">
            <Link to="/" className="[&.active]:font-bold">
                Home
            </Link>{' '}
            <Link to="/register" className="[&.active]:font-bold">
                Register
            </Link>{' '}
            <Link to="/login" className="[&.active]:font-bold">
                Login
            </Link>
            <Link to="/dashboard" className='[&.active]:font-bold'>
                Dashboard
            </Link>
        </div>
    </div>
  )
}
