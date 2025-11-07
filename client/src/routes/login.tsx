import React, { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router'
import { useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: Login,
})

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setIsLoading(true)

    try {
      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.detail || 'Login failed')
        setIsLoading(false)
        return
      }

      // Store session data in localStorage
      if (data.session_data) {
        localStorage.setItem('session_token', data.session_data.access_token)
        localStorage.setItem('user_id', data.user_profile?.id || '')
        localStorage.setItem('user_email', data.user_profile?.email || email)
      }

      // Log full response for debugging
      console.log('✅ Login successful!')
      console.log('Session data:', data.session_data)
      console.log('User profile:', data.user_profile)

      // Show success message
      setSuccess(`Welcome back, ${data.user_profile?.first_name || email}!`)

      // Clear form fields after successful login
      setEmail('')
      setPassword('')

      // TODO: Redirect to dashboard or home page after successful login
      // Example: navigate('/dashboard')
      const navigate = useNavigate()
      navigate({ to: "/dashboard" })

    } catch (err) {
      setError('Network error. Please try again.')
      console.error('Login error:', err)
    } finally {
      setIsLoading(false)
    }
  }

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

          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
              {success}
            </div>
          )}

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
              disabled={isLoading}
              className="w-full px-4 py-3 bg-slate-600 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors duration-200 disabled:bg-slate-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Logging in...' : 'Enter'}
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

