import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import AuthForm from "../components/AuthForm";

type AuthMode = "login" | "register";

const Auth = () => {
  const [mode, setMode] = useState<AuthMode>("login");
  const [isModeTransitioning, setIsModeTransitioning] = useState(false);
  const transitionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      if (transitionTimer.current) {
        clearTimeout(transitionTimer.current);
      }
    };
  }, []);

  const handleModeChange = (nextMode: AuthMode) => {
    if (nextMode === mode || isModeTransitioning) {
      return;
    }

    setIsModeTransitioning(true);

    transitionTimer.current = setTimeout(() => {
      setMode(nextMode);
      setIsModeTransitioning(false);
    }, 120);
  };

  const handleSuccess = () => {
    navigate("/dashboard");
  };

  const isLogin = mode === "login";

  return (
    <main className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-6xl items-center px-6 py-10 lg:px-8">
        <div className="grid w-full overflow-hidden rounded-2xl border border-border/80 bg-card shadow-[0_16px_45px_-28px_rgba(15,23,42,0.28)] lg:grid-cols-2">
          <section className="hidden min-h-155 flex-col justify-between border-r border-border/80 bg-muted/35 p-10 lg:flex">
            <div className="flex items-center gap-2.5">
              <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
                S
              </div>
              <span className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">
                SplitEase
              </span>
            </div>

            <div className="max-w-md">
              <p className="mb-4 text-[13px] font-medium tracking-[0.01em] text-[color:var(--auth-accent)]">
                Simple expense management
              </p>
              <h1 className="max-w-sm text-[2.6rem] font-semibold leading-[1.1] tracking-[-0.045em] text-foreground">
                Keep your group expenses{" "}
                <span className="text-muted-foreground">clear and organized.</span>
              </h1>
              <p className="mt-5 max-w-sm text-[15px] leading-6 text-muted-foreground">
                Track shared expenses, see who owes what, and settle up without keeping everything in your head.
              </p>
            </div>

            <p className="text-[12px] font-medium tracking-[0.01em] text-muted-foreground">
              Manage expenses. Split fairly. Settle easily.
            </p>
          </section>

          <section className="flex min-h-155 items-center justify-center bg-[#fcfcfb] p-6 sm:p-10">
            <div className="w-full max-w-md">
              <div className="mb-10 flex items-center gap-2.5 lg:hidden">
                <div className="flex size-8 items-center justify-center rounded-lg bg-foreground text-sm font-semibold text-background">
                  S
                </div>
                <span className="text-[17px] font-semibold tracking-[-0.025em] text-foreground">
                  SplitEase
                </span>
              </div>

              <div className="mb-8">
                <div key={mode} className="auth-copy-transition">
                  <h2 className="text-[1.7rem] font-semibold leading-tight tracking-[-0.035em] text-foreground">
                    {isLogin ? "Welcome back" : "Create your account"}
                  </h2>
                  <p className="mt-2 text-[14px] leading-6 text-muted-foreground">
                    {isLogin
                      ? "Enter your details to access your account."
                      : "Create an account to start managing your expenses."}
                  </p>
                </div>
              </div>

              <div className="relative mb-7 grid grid-cols-2 rounded-lg border border-border/80 bg-muted/60 p-1">
                <div
                  aria-hidden="true"
                  className={`absolute inset-y-1 w-[calc(50%-4px)] rounded-md bg-background shadow-[0_1px_2px_rgba(15,23,42,0.08)] transition-transform duration-200 ease-out motion-reduce:transition-none ${!isLogin ? "translate-x-[calc(100%+4px)]" : "translate-x-0"
                    }`}
                />
                <button
                  type="button"
                  onClick={() => handleModeChange("login")}
                  disabled={isModeTransitioning}
                  aria-pressed={isLogin}
                  className={`relative z-10 rounded-md px-3 py-2 text-sm font-medium cursor-pointer transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--auth-accent)] focus-visible:ring-offset-1 disabled:cursor-default ${isLogin ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Login
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange("register")}
                  disabled={isModeTransitioning}
                  aria-pressed={!isLogin}
                  className={`relative z-10 rounded-md cursor-pointer px-3 py-2 text-sm font-medium transition-colors duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--auth-accent)] focus-visible:ring-offset-1 disabled:cursor-default ${!isLogin ? "text-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  Sign up
                </button>
              </div>

              <div
                className="auth-mode-surface"
                data-transitioning={isModeTransitioning}
                aria-busy={isModeTransitioning}
              >
                <AuthForm
                  mode={mode}
                  onModeChange={handleModeChange}
                  onSuccess={handleSuccess}
                  isTransitioning={isModeTransitioning}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Auth;
