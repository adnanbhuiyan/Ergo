import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext"; 

interface File {}

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  // Set state variables for input fields
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false); // Used for button disable state and for loading text

  const navigate = useNavigate();

  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    //
    e.preventDefault(); // Prevents page from reloading
    setError("");
    setIsLoading(true); // Show loading state

    const formData = new FormData();

    formData.append("email", email);
    formData.append("password", password);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("username", username);
    formData.append("position", position);

    //Add profile photo if user uploads one
    if (profilePicture) {
      formData.append("profile_photo", profilePicture as Blob);
    }

    try {
      const response = await fetch("http://localhost:8000/auth/signup", {
        // Making post request to the FastAPI endpoint
        method: "POST",
        body: formData,
      });

      const data = await response.json(); // parse the JSON response from server

      if (!response.ok) {
        let errorMessage = "Registration failed. Please check your inputs.";

        const errorData: { detail?: FastAPIValidationError[] | string } = data;

        if (
          errorData.detail &&
          Array.isArray(errorData.detail) &&
          errorData.detail.length > 0
        ) {
          errorMessage = errorData.detail
            .map((err: FastAPIValidationError) => {
              const field = err.loc[err.loc.length - 1]; // Get the field name
              return `${field}: ${err.msg}`;
            })
            .join("; ");
        } else if (typeof errorData.detail === "string") {
          errorMessage = errorData.detail;
        }

        setError(errorMessage);
        setIsLoading(false);
        return;
      }

      // Clear the form fields after form is successfully submitted
      setEmail("");
      setPassword("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setPosition("");
      setProfilePicture(null);

      navigate({ to: "/login" });
    } catch (err) {
      console.log(err);
      // Catch any error
      setError("Network error. Please try again");
    } finally {
      // Make sure loading state is turned off no matter what
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
        {/* Left Column displaying 'Ergo' and Promotion */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-600 flex-col justify-center items-center p-8">
          <h1 className="text-6xl font-bold text-white mb-8">Ergo</h1>
          <p className="text-white text-lg text-center leading-relaxed max-w-md">
            Sign up to start your day and get your tasks organized, boost
            productivity, and turn everyday chaos into effortless clarity.
          </p>
        </div>

        {/* Right Column displaying the Registration Form */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8">
          <div className="w-full max-w-md">
            <Link to="/" className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-6 transition-colors">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to home
            </Link>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              Create Account
            </h2>
            <p className="text-gray-600 mb-6">Sign up to get started</p>

            {error && (
              <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label
                    htmlFor="firstName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex-1">
                  <label
                    htmlFor="lastName"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 ocus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Username Field */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              {/* Position Field */}
              <div>
                <label
                  htmlFor="position"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Position
                </label>
                <input
                  id="position"
                  type="text"
                  value={position}
                  onChange={(e) => setPosition(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Software Engineer"
                  required
                />
              </div>

              {/* Profile Picture Field */}
              <div>
                <label
                  htmlFor="profilePicture"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Profile Picture (Optional)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProfilePicture(e.target.files[0]);
                    }
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-blue-500 focus:border-transparent"
                ></input>
                <p className="text-xs text-gray-500 mt-1">
                  Optional. PNG, or JPG. Max 5MB
                </p>
                {profilePicture && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={
                        profilePicture
                          ? URL.createObjectURL(profilePicture as Blob)
                          : ""
                      }
                      alt="Profile Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    ></img>
                    <Button
                      variant="outline"
                      type="button"
                      className=" text-white hover:text-white"
                      onClick={() => setProfilePicture(null)}
                    >
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {/* Email Field */}
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="you@example.com"
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Must be 8+ characters with uppercase, lowercase, number, and
                  special character (@$!%*?&)
                </p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-blue-600 py-2 px-4 rounded-lg text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors disabled:bg-blue-300 disabled:cursor-not-allowed"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            {/* Login Link */}
            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-blue-600 hover:text-blue-700 font-medium"
              >
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </div>
  );
}

export default Register;
