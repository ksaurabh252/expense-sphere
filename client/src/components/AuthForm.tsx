import { useEffect, useState } from "react";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

import { loginUser, registerUser, setToken, setUser } from "../services/api";

type AuthMode = "login" | "register";

interface AuthFormProps {
  mode: AuthMode;
  onModeChange: (mode: AuthMode) => void;
  onSuccess: () => void;
  isTransitioning?: boolean;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const AuthForm = ({
  mode,
  onModeChange,
  onSuccess,
  isTransitioning = false,
}: AuthFormProps) => {
  const isLogin = mode === "login";

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [apiError, setApiError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const isDisabled = isLoading || isTransitioning;

  // Clear validation and API errors when switching between login and register.
  useEffect(() => {
    setErrors({});
    setApiError("");
  }, [mode]);

  // Update the corresponding form field and clear its error.
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
    setApiError("");
  };

  // Validate the form before sending the request to the API.
  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!isLogin && !formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (!isLogin) {
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password";
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle both login and registration, then store the authenticated user.
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError("");

    if (isTransitioning || !validate()) {
      return;
    }

    try {
      setIsLoading(true);

      if (isLogin) {
        const response = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        setToken(response.token);
        setUser(response.user);
      } else {
        // Registration does not return a token, so log the user in after signup.
        await registerUser({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          confirmPassword: formData.confirmPassword,
        });

        const response = await loginUser({
          email: formData.email,
          password: formData.password,
        });

        setToken(response.token);
        setUser(response.user);
      }

      onSuccess();
    } catch (error) {
      setApiError(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form" noValidate>
      {!isLogin && (
        <div className="auth-field-intro space-y-2">
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            name="name"
            type="text"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            disabled={isDisabled}
            className="h-11 rounded-lg"
          />
          {errors.name && (
            <p className="text-xs font-medium text-red-600">{errors.name}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@example.com"
          value={formData.email}
          onChange={handleChange}
          disabled={isDisabled}
          className="h-11 rounded-lg"
        />
        {errors.email && (
          <p className="text-xs font-medium text-red-600">{errors.email}</p>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="password">Password</Label>

          {isLogin && (
            <button
              type="button"
              className="text-xs font-medium text-muted-foreground cursor-pointer transition-colors duration-200 hover:text-(--auth-accent) focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--auth-accent) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={isDisabled}
            >
              Forgot password?
            </button>
          )}
        </div>

        <Input
          id="password"
          name="password"
          type="password"
          placeholder="Enter your password"
          value={formData.password}
          onChange={handleChange}
          disabled={isDisabled}
          className="h-11 rounded-lg"
        />

        {errors.password && (
          <p className="text-xs font-medium text-red-600">
            {errors.password}
          </p>
        )}
      </div>

      {!isLogin && (
        <div className="auth-field-intro space-y-2">
          <Label htmlFor="confirmPassword">Confirm password</Label>

          <Input
            id="confirmPassword"
            name="confirmPassword"
            type="password"
            placeholder="Re-enter your password"
            value={formData.confirmPassword}
            onChange={handleChange}
            disabled={isDisabled}
            className="h-11 rounded-lg"
          />

          {errors.confirmPassword && (
            <p className="text-xs font-medium text-red-600">
              {errors.confirmPassword}
            </p>
          )}
        </div>
      )}

      {apiError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
          <p className="text-sm font-medium text-red-600">{apiError}</p>
        </div>
      )}

      <Button
        type="submit"
        disabled={isDisabled}
        className="h-11 w-full rounded-lg font-medium tracking-[-0.01em]"
      >
        {isLoading
          ? isLogin
            ? "Signing in..."
            : "Creating account..."
          : isLogin
            ? "Login"
            : "Create account"}
      </Button>

      <div className="relative py-1">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border/80" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-[#fcfcfb] px-3 text-[11px] font-medium tracking-[0.08em] text-muted-foreground">
            OR
          </span>
        </div>
      </div>

      <p className="text-center text-sm leading-6 text-muted-foreground">
        {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
        <button
          type="button"
          onClick={() => onModeChange(isLogin ? "register" : "login")}
          disabled={isDisabled}
          className="font-medium text-(--auth-accent) underline decoration-(--auth-accent)/40 underline-offset-4 transition-colors duration-200 hover:text-foreground hover:decoration-foreground/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--auth-accent) focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLogin ? "Sign up" : "Log in"}
        </button>
      </p>
    </form>
  );
};

export default AuthForm;