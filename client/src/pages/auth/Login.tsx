import React, { useState } from 'react'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    // Handle login logic here
    console.log('Login attempt:', { email, password })
  }

  const handleGoogleLogin = () => {
    // Handle Google login logic here
    console.log('Google login')
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

            {/* Google Login Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-black hover:bg-gray-900 text-white rounded-lg font-medium transition-colors duration-200"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Log in with Google
            </button>

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

