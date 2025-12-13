import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useNavigate, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import { getApiUrl } from "../lib/api"; 

interface File {}

export const Route = createFileRoute("/register")({
  component: Register,
});

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [position, setPosition] = useState("");
  const [error, setError] = useState("");
  const [profilePicture, setProfilePicture] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Password Validation State
  const [passValidations, setPassValidations] = useState({
    length: false,
    upper: false,
    lower: false,
    number: false,
    special: false,
    match: false
  });

  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      navigate({ to: "/dashboard" });
    }
  }, [isAuthenticated, navigate]);

  // Checks if the password meets the requirements in real-time
  useEffect(() => {
    setPassValidations({
      length: password.length >= 8,
      upper: /[A-Z]/.test(password),
      lower: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[@$!%*?&]/.test(password),
      match: password !== "" && password === confirmPassword
    });
  }, [password, confirmPassword]);

  const isFormValid = Object.values(passValidations).every(Boolean);

  interface FastAPIValidationError {
    loc: (string | number)[];
    msg: string;
    type: string;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");

    if (!isFormValid) {
        setError("Please ensure all password requirements are met.");
        return;
    }

    setIsLoading(true);

    const formData = new FormData();
    formData.append("email", email);
    formData.append("password", password);
    formData.append("first_name", firstName);
    formData.append("last_name", lastName);
    formData.append("username", username);
    formData.append("position", position);

    if (profilePicture) {
      formData.append("profile_photo", profilePicture as Blob);
    }

    try {
      const response = await fetch(`${getApiUrl()}/auth/signup`, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        let errorMessage = "Registration failed.";

        const errorData: { detail?: FastAPIValidationError[] | string } = data;

        if (errorData.detail && Array.isArray(errorData.detail) && errorData.detail.length > 0) {
          errorMessage = errorData.detail
            .map((err: FastAPIValidationError) => {
              const field = err.loc[err.loc.length - 1];
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

      // Reset Form
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setFirstName("");
      setLastName("");
      setUsername("");
      setPosition("");
      setProfilePicture(null);

      // Navigate to login with a search param to display the success message
      navigate({ to: "/login", search: { registered: "true" } });
      
    } catch (err) {
      console.log(err);
      setError("Network error. Please try again");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex">
        {/* Left Column */}
        <div className="hidden lg:flex lg:w-1/2 bg-slate-600 flex-col justify-center items-center p-8">
          <h1 className="text-6xl font-bold text-white mb-8">Ergo</h1>
          <p className="text-white text-lg text-center leading-relaxed max-w-md">
            Sign up to start your day and get your tasks organized, boost
            productivity, and turn everyday chaos into effortless clarity.
          </p>
        </div>

        {/* Right Column */}
        <div className="w-full lg:w-1/2 bg-white flex flex-col items-center justify-center p-8 overflow-y-auto h-screen">
          <div className="w-full max-w-md my-8">
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
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r">
                <p className="font-bold">Error</p>
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name Fields */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
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
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                  <input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              {/* Username & Position */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">Position</label>
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

              {/* Profile Picture */}
              <div>
                <label htmlFor="profilePicture" className="block text-sm font-medium text-gray-700 mb-1">Profile Picture (Optional)</label>
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
                <p className="text-xs text-gray-500 mt-1">Optional. PNG or JPG. Max 5MB</p>
                {profilePicture && (
                  <div className="mt-3 flex items-center gap-3">
                    <img
                      src={URL.createObjectURL(profilePicture as Blob)}
                      alt="Profile Preview"
                      className="w-16 h-16 rounded-full object-cover border-2 border-gray-300"
                    ></img>
                    <Button variant="outline" type="button" onClick={() => setProfilePicture(null)}>Remove</Button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
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

              {/* Password Section */}
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-2 mb-3 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />

                {/* Password Requirements Checklist */}
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                    <RequirementItem met={passValidations.length} text="8+ Characters" />
                    <RequirementItem met={passValidations.upper} text="Uppercase Letter" />
                    <RequirementItem met={passValidations.lower} text="Lowercase Letter" />
                    <RequirementItem met={passValidations.number} text="Number" />
                    <RequirementItem met={passValidations.special} text="Special Character (@$!%*?&)" />
                    <RequirementItem met={passValidations.match} text="Passwords Match" />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !isFormValid}
                className="w-full bg-blue-600 py-3 px-4 rounded-lg text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
              >
                {isLoading ? "Creating account..." : "Sign Up"}
              </button>
            </form>

            <p className="text-center text-sm text-gray-600 mt-6">
              Already have an account?{" "}
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">Sign In</Link>
            </p>
          </div>
        </div>
      </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 ${met ? "text-green-600" : "text-gray-400"}`}>
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {met ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                )}
            </svg>
            <span>{text}</span>
        </div>
    );
}

export default Register;