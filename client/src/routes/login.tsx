import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempt:', { email, password })
  }

	// Social login removed for now

  return (
    <div className="h-screen w-screen flex">
      {/* Left Column - Promotional Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-slate-600 flex-col items-center justify-center px-12">
        <h1 className="text-6xl font-bold text-white mb-8">Ergo</h1>
        <p className="text-white text-lg text-center leading-relaxed max-w-md">
          Log in for a seamless way to organize your day, boost productivity, and turn everyday chaos into effortless clarity.
        </p>
      </div>

      {/* Right Column - Login Form */}
      <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center px-8 py-12">
        <div className="w-full max-w-md">
          <h2 className="text-2xl font-semibold text-gray-800 mb-8">Log In Below</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                placeholder="Enter your email"
                required
              />
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-500 focus:border-transparent transition-all text-black"
                placeholder="Enter your password"
                required
              />
            </div>

            {/* Social Login removed */}

            {/* Enter/Submit Button */}
            <button
              type="submit"
              className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200"
            >
              Enter
            </button>
          </form>

          {/* Links */}
          <div className="mt-6 space-y-3 text-center">
            <a
              href="#"
              className="text-blue-600 hover:text-blue-800 underline text-sm block"
            >
              Forgot Password? Click here
            </a>
            <a
              href="/register"
              className="text-blue-600 hover:text-blue-800 underline text-sm block"
            >
              New User? Register here
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login

