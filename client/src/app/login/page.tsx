"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// Login function
async function login(formData: FormData) {
  try {
    // Create the request body with email and password
    const requestBody = {
      email: formData.get('email'),
      password: formData.get('password')
    };
    
    console.log('Login attempt for:', requestBody.email);
    
    const res = await fetch('/api/auth', {
      method: 'POST',
      body: JSON.stringify(requestBody),
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include'  // Important: include cookies in the request
    });

    const data = await res.json();
    console.log('Login response:', data);
    
    if (!res.ok) {
      return { 
        error: data.error || 'Login failed', 
        success: false 
      };
    }
    
    // Successfully logged in
    return { 
      success: true 
    };
  } catch (error) {
    console.error('Login error:', error);
    return { 
      error: 'An unexpected error occurred', 
      success: false 
    };
  }
}

// Signup function
async function signup(formData: FormData) {
  try {
    // Create the request body with the correct field names
    const requestBody = {
      email: formData.get("email"),
      password: formData.get("password"),
      full_name: formData.get("firstName"),
      team_id: formData.get("teamID"),
    };

    console.log("Signup request:", requestBody);

    const res = await fetch("/api/register", {
      method: "POST",
      body: JSON.stringify(requestBody),
      headers: {
        "Content-Type": "application/json",
      },
    });

    const data = await res.json();

    if (!res.ok) {
      return {
        error: data.error || "Registration failed",
        success: false,
      };
    }

    // Check if email confirmation is required
    if (data.requires_confirmation) {
      return {
        success: true,
        message:
          "Account created successfully! Please check your email for a confirmation link.",
        requiresConfirmation: true,
      };
    } else {
      return {
        success: true,
        message: "Account created successfully! You can now log in.",
      };
    }
  } catch (error) {
    console.error("Signup error:", error);
    return {
      error: "An unexpected error occurred",
      success: false,
    };
  }
}

interface LoginPageProps {
  initialMode?: "login" | "signup";
}

export default function LoginPage({ initialMode = "login" }: LoginPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(() => {
    // Check for error parameters in URL
    const urlError = searchParams.get("error");
    if (urlError === "invalid_confirmation_link") {
      return "The confirmation link is invalid or has expired.";
    }
    if (urlError === "invalid_confirmation") {
      return "We couldn't verify your email. Please try again.";
    }
    if (urlError === "confirmation_failed") {
      return "Email confirmation failed. Please contact support.";
    }
    return null;
  });

  const [isSignUp, setIsSignUp] = useState(initialMode === "signup");
  const [firstName, setFirstName] = useState("");
  const [teamID, setTeamID] = useState("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Set initial sign up state based on props
  useEffect(() => {
    setIsSignUp(initialMode === "signup");
  }, [initialMode]);

  const handleSubmit = async (formData: FormData) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      if (isSignUp) {
        // Add the additional fields for signup
        formData.append("firstName", firstName);
        formData.append("teamID", teamID);

        const {
          error: signupError,
          success,
          message,
          requiresConfirmation,
        } = await signup(formData);

        if (signupError) {
          setError(signupError);
          return;
        }

        if (success && message) {
          // Show success message for signup with email confirmation
          setSuccessMessage(message);

          // Only switch to login mode if no confirmation is required or after user action
          if (!requiresConfirmation) {
            // Switch to login mode
            setIsSignUp(false);
            // Clear signup form
            setFirstName("");
            setTeamID("");
          }
        } else if (success) {
          // Auto-confirmed signup - redirect user
          router.push("/");
          router.refresh();
        }
      } else {
        // Handle login
        const { error: loginError, success } = await login(formData);

        if (loginError) {
          setError(loginError);
          return;
        }

        if (success) {
          // Redirect on successful login
          router.push("/");
          router.refresh();
        }
      }
    } catch (e) {
      console.error("Authentication error:", e);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-muted/40 p-4">
      <div className="w-full max-w-md mx-auto p-6 space-y-6 bg-card rounded-xl border shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-arena-gold animate-neon-pulse">
            Legends Arena
          </h1>
          <p className="text-muted-foreground mt-2">
            {isSignUp ? "Create a new account" : "Sign in to your account"}
          </p>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/30 rounded text-destructive text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-green-500/10 border border-green-500/30 rounded text-green-600 dark:text-green-400 text-sm">
            {successMessage}
          </div>
        )}

        <form action={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="you@example.com"
              disabled={isLoading}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              placeholder="••••••••"
              disabled={isLoading}
            />
          </div>

          {isSignUp && (
            <>
              <div className="space-y-2">
                <label htmlFor="firstName" className="text-sm font-medium">
                  First Name
                </label>
                <input
                  id="firstName"
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required={isSignUp}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="Your name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="teamID" className="text-sm font-medium">
                  Team ID
                </label>
                <input
                  id="teamID"
                  type="text"
                  value={teamID}
                  onChange={(e) => setTeamID(e.target.value)}
                  required={isSignUp}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  placeholder="8-character team ID"
                  disabled={isLoading}
                />
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex w-full items-center justify-center rounded-md bg-arena-gold px-4 py-2 text-sm font-medium text-black hover:bg-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : isSignUp ? "Sign Up" : "Sign In"}
          </button>
        </form>

        <div className="text-center text-sm">
          <span className="text-muted-foreground">
            {isSignUp ? "Already have an account? " : "Don't have an account? "}
          </span>
          <button
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setSuccessMessage(null);
            }}
            className="text-primary hover:underline font-medium"
            disabled={isLoading}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>
      </div>
    </div>
  );
}
