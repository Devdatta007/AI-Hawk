import React, { useState, useEffect } from "react";
import { Cpu, FileText, ListOrdered, GraduationCap, Shield, HelpCircle, AlertCircle, RefreshCw, Sparkles, Database, Lock, Key, Mail, Contact, ArrowRight, UserPlus, LogIn, ChevronRight } from "lucide-react";
import Header from "./components/Header";
import DashboardTab from "./components/DashboardTab";
import ResumeTab from "./components/ResumeTab";
import TrackerTab from "./components/TrackerTab";
import CoverLetterTab from "./components/CoverLetterTab";
import ChatbotTab from "./components/ChatbotTab";
import SemanticMatchTab from "./components/SemanticMatchTab";
import { AIHawkConfig, JobApplication, UserProfile } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<string>("dashboard");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const saved = localStorage.getItem("theme");
    return saved === "dark" ? "dark" : "light";
  });

  // Auth States
  const [authToken, setAuthToken] = useState<string | null>(() => localStorage.getItem("aihawk_auth_token"));
  const [userCredentials, setUserCredentials] = useState<{ id: string; email: string; name: string } | null>(null);
  const [isBypassed, setIsBypassed] = useState<boolean>(() => localStorage.getItem("aihawk_guest") === "true");
  
  // Login / Signup View States
  const [authView, setAuthView] = useState<"login" | "signup">("login");
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [nameInput, setNameInput] = useState("");
  const [phoneInput, setPhoneInput] = useState("");
  const [authError, setAuthError] = useState<string | null>(null);
  const [authSuccess, setAuthSuccess] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // DB Connection State
  const [dbMode, setDbMode] = useState<"PostgreSQL" | "SQLite-JSON">("SQLite-JSON");

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  const handleToggleTheme = () => {
    setTheme(prev => (prev === "light" ? "dark" : "light"));
  };

  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: "Devdatta Salunkhe",
    email: "devdattasalunkhe0707@gmail.com",
    phone: "+1 (555) 349-8812",
    skills: ["React", "TypeScript", "Node.js", "Express", "Tailwind CSS"],
    resumeText: "",
    experienceLevel: "Mid-Level",
    githubUrl: "",
    linkedinUrl: ""
  });
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [isRunnerActive, setIsRunnerActive] = useState<boolean>(false);
  const [config, setConfig] = useState<AIHawkConfig>({
    linkedinEnabled: true,
    indeedEnabled: true,
    naukriEnabled: false,
    searchKeywords: ["Full Stack Developer"],
    locations: ["Remote"],
    maxDailyApplies: 25,
    openaiModel: "gemini-3.5-flash",
    enableSeleniumHeadless: true,
    autoSolveCaptcha: true
  });

  const [isLoading, setIsLoading] = useState(true);

  // Authenticated Fetch Wrapper
  const secureFetch = async (url: string, options: RequestInit = {}) => {
    const headers = {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    } as Record<string, string>;

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    } else {
      headers["x-user-id"] = "user-default"; // Fallback identifier
    }

    const response = await fetch(url, { ...options, headers });
    return response;
  };

  // Sync state functions
  const fetchProfile = async () => {
    try {
      const response = await secureFetch("/api/profile");
      if (response.ok) {
        const data = await response.json();
        setUserProfile(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await secureFetch("/api/applications");
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await secureFetch("/api/config");
      if (response.ok) {
        const data = await response.json();
        setConfig(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchRunnerState = async () => {
    try {
      const response = await secureFetch("/api/runner/logs");
      if (response.ok) {
        const data = await response.json();
        setIsRunnerActive(data.isActive);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const checkDbStatus = async () => {
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data = await res.json();
        setDbMode(data.database);
      }
    } catch (err) {
      console.warn("DB mode request failed", err);
    }
  };

  // Verify profile of signed in token on boot
  const verifyTokenUser = async () => {
    if (!authToken) return false;
    try {
      const res = await secureFetch("/api/auth/me");
      if (res.ok) {
        const data = await res.json();
        setUserCredentials(data.user);
        return true;
      } else {
        // Token expired
        localStorage.removeItem("aihawk_auth_token");
        setAuthToken(null);
        return false;
      }
    } catch (err) {
      return false;
    }
  };

  // Initial load
  useEffect(() => {
    const initApp = async () => {
      setIsLoading(true);
      await checkDbStatus();
      const hasSession = await verifyTokenUser();
      
      if (hasSession || isBypassed) {
        await Promise.all([
          fetchProfile(),
          fetchApplications(),
          fetchConfig(),
          fetchRunnerState()
        ]);
      }
      setIsLoading(false);
    };
    initApp();
  }, [authToken, isBypassed]);

  // Auth Operations
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!emailInput || !passwordInput) {
      setAuthError("Email and Password are required credentials.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput, password: passwordInput })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("aihawk_auth_token", data.token);
        localStorage.removeItem("aihawk_guest");
        setAuthSuccess("Authenticated, loading personalized workspace dashboard...");
        setTimeout(() => {
          setAuthToken(data.token);
          setUserCredentials(data.user);
          setIsBypassed(false);
          setAuthLoading(false);
        }, 800);
      } else {
        setAuthError(data.error || "Authentication mismatch.");
        setAuthLoading(false);
      }
    } catch (err) {
      setAuthError("Failed to communicate with authentication gateway server.");
      setAuthLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setAuthSuccess(null);
    if (!emailInput || !passwordInput || !nameInput) {
      setAuthError("Name, Email, and Password details are required.");
      return;
    }

    setAuthLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput,
          password: passwordInput,
          name: nameInput,
          phone: phoneInput
        })
      });
      const data = await res.json();
      if (res.ok) {
        localStorage.setItem("aihawk_auth_token", data.token);
        localStorage.removeItem("aihawk_guest");
        setAuthSuccess("Profile registered successfully! Migrating workspace components...");
        setTimeout(() => {
          setAuthToken(data.token);
          setUserCredentials(data.user);
          setIsBypassed(false);
          setAuthLoading(false);
        }, 800);
      } else {
        setAuthError(data.error || "Sign up transaction rejected.");
        setAuthLoading(false);
      }
    } catch (err) {
      setAuthError("Failed to communicate with authentication gateway server.");
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("aihawk_auth_token");
    localStorage.removeItem("aihawk_guest");
    setAuthToken(null);
    setUserCredentials(null);
    setIsBypassed(false);
    setEmailInput("");
    setPasswordInput("");
    setAuthSuccess(null);
    setAuthError(null);
  };

  const handleLaunchGuest = () => {
    localStorage.setItem("aihawk_guest", "true");
    setIsBypassed(true);
  };

  // API Call: Status mutations
  const handleUpdateStatus = async (id: string, newStatus: JobApplication['status']) => {
    try {
      const response = await secureFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Generic application updates
  const handleUpdateApplication = async (id: string, updatedFields: Partial<JobApplication>) => {
    try {
      const response = await secureFetch(`/api/applications/${id}`, {
        method: "PUT",
        body: JSON.stringify(updatedFields)
      });
      if (response.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Delete target applications
  const handleDeleteApplication = async (id: string) => {
    try {
      const response = await secureFetch(`/api/applications/${id}`, {
        method: "DELETE"
      });
      if (response.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // API Call: Add custom application fields manually
  const handleAddCustomApplication = async (newApp: Partial<JobApplication>) => {
    try {
      const response = await secureFetch("/api/applications", {
        method: "POST",
        body: JSON.stringify(newApp)
      });
      if (response.ok) {
        fetchApplications();
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (isLoading) {
    return (
      <div id="aihawk-loading" className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center space-y-4 transition-colors duration-200">
        <Cpu className="h-12 w-12 text-indigo-600 dark:text-indigo-400 animate-spin" />
        <div className="text-center">
          <p className="text-sm font-bold text-gray-800 dark:text-slate-100 tracking-tight font-sans">Connecting to AIHawk Core Daemon...</p>
          <p className="text-xs text-gray-400 dark:text-slate-500 font-mono">Synchronizing PostgreSQL credentials & Selenium pipelines</p>
        </div>
      </div>
    );
  }

  // Show Auth Gateway Portal if both Token and Bypassed flag are false
  if (!authToken && !isBypassed) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 lg:p-8 font-sans transition-colors relative overflow-hidden">
        {/* Ambient Grid Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-25"></div>

        <div className="w-full max-w-5xl bg-slate-950/80 rounded-2xl border border-slate-800/80 shadow-2xl backdrop-blur-xl relative z-10 overflow-hidden flex flex-col lg:flex-row min-h-[600px]">
          
          {/* Aesthetic Brand Side-Panel */}
          <div className="flex-1 bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-900 p-8 flex flex-col justify-between border-r border-slate-800">
            <div>
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-indigo-600 p-2 text-white rounded-lg shadow-md flex items-center justify-center">
                  <Shield className="h-6 w-6" />
                </div>
                <div>
                  <span className="font-bold text-lg text-white font-sans tracking-tight">AIHawk Premium Suite</span>
                  <p className="text-[10px] text-indigo-300 font-mono uppercase tracking-wider">Automated Dev Engine</p>
                </div>
              </div>

              <h1 className="text-3xl font-extrabold text-white tracking-tight leading-tight mb-4">
                Scale your executive career search on autopilot.
              </h1>
              <p className="text-slate-300 text-sm leading-relaxed mb-6">
                Connect real-time background Selenium automation directly, audit candidates against standard guidelines using Google Gemini, and synchronize application details in high-performance PostgreSQL.
              </p>

              <div className="space-y-4">
                <div className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                  <Database className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">PostgreSQL Persistence Gate</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Secure, isolated credentials schema keeping application dashboards safe.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3 text-xs text-slate-300 bg-slate-900/60 p-3 rounded-lg border border-slate-800/40">
                  <Sparkles className="h-4 w-4 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Google Gemini Smart Matcher</span>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">Automated resume parsing, keyword optimizing, and custom web scaping grounding.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-slate-800/60 pt-6 mt-8 sm:mt-0 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-mono">Core v2.0-Production Host</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 font-bold px-2 py-0.5 rounded border border-slate-700 font-mono uppercase">
                Active Client API
              </span>
            </div>
          </div>

          {/* Interactive Form Panel */}
          <div className="w-full lg:w-[480px] p-8 flex flex-col justify-center bg-slate-950">
            {authView === "login" ? (
              <form onSubmit={handleLogin} className="space-y-6">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Access Dashboard</h2>
                  <p className="text-xs text-slate-400 mt-1">Authenticate into your secure career database account.</p>
                </div>

                {authError && (
                  <div className="bg-rose-950/40 border border-rose-900/80 rounded-lg p-3 text-xs text-rose-450 font-mono flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-550" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-900/85 rounded-lg p-3 text-xs text-emerald-400 font-mono flex items-start space-x-2">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3.5 h-4 w-4 text-slate-550" />
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-400">Security Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3.5 h-4 w-4 text-slate-550" />
                      <input
                        type="password"
                        required
                        placeholder="••••••••"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-semibold py-3 rounded-lg text-xs tracking-wide transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center space-x-2 disabled:bg-slate-800 disabled:text-slate-400"
                >
                  {authLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Secure Login</span>
                      <LogIn className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("signup");
                      setAuthError(null);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-4"
                  >
                    Need an account? Sign up here.
                  </button>
                </div>

                <div className="border-t border-slate-900/80 pt-5 mt-4">
                  <button
                    type="button"
                    onClick={handleLaunchGuest}
                    className="w-full border border-slate-800 hover:bg-slate-900/60 active:scale-98 text-slate-300 font-semibold py-2.5 rounded-lg text-xs tracking-wide transition-all font-mono flex items-center justify-center space-x-2 cursor-pointer mb-2"
                  >
                    <span>Launch Local Guest Workspace</span>
                    <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                  </button>
                  <p className="text-[10px] text-slate-500 text-center font-mono">Uses system SQLite local JSON backups. Connection setup is bypassable.</p>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSignup} className="space-y-4">
                <div>
                  <h2 className="text-2xl font-bold text-white tracking-tight">Create Professional Profile</h2>
                  <p className="text-xs text-slate-400 mt-1">Register a new profile directly in SQLite or PostgreSQL.</p>
                </div>

                {authError && (
                  <div className="bg-rose-950/40 border border-rose-900/80 rounded-lg p-3 text-xs text-rose-450 font-mono flex items-start space-x-2">
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-550" />
                    <span>{authError}</span>
                  </div>
                )}

                {authSuccess && (
                  <div className="bg-emerald-950/40 border border-emerald-900/85 rounded-lg p-3 text-xs text-emerald-400 font-mono flex items-start space-x-2">
                    <Sparkles className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                    <span>{authSuccess}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Full Name</label>
                    <div className="relative">
                      <Contact className="absolute left-3 top-3 h-4 w-4 text-slate-550" />
                      <input
                        type="text"
                        required
                        placeholder="Devdatta Salunkhe"
                        value={nameInput}
                        onChange={e => setNameInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Account Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-550" />
                      <input
                        type="email"
                        required
                        placeholder="you@domain.com"
                        value={emailInput}
                        onChange={e => setEmailInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Phone Details (Optional)</label>
                    <input
                      type="text"
                      placeholder="+1 (555) 732-8123"
                      value={phoneInput}
                      onChange={e => setPhoneInput(e.target.value)}
                      className="w-full px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-400">Password</label>
                    <div className="relative">
                      <Key className="absolute left-3 top-3 h-4 w-4 text-slate-550" />
                      <input
                        type="password"
                        required
                        placeholder="Minimum 8 characters"
                        value={passwordInput}
                        onChange={e => setPasswordInput(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-900 border border-slate-800 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-500 active:scale-98 text-white font-semibold py-2.5 rounded-lg text-xs tracking-wide transition-all shadow-md mt-4 cursor-pointer flex items-center justify-center space-x-2 disabled:bg-slate-800 disabled:text-slate-400"
                >
                  {authLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin text-white" />
                  ) : (
                    <>
                      <span>Submit Profile Registration</span>
                      <UserPlus className="h-4 w-4" />
                    </>
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthView("login");
                      setAuthError(null);
                    }}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer underline underline-offset-4"
                  >
                    Already have an account? Sign In.
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active Authenticated App Mode
  const activeEmailStr = userCredentials ? userCredentials.email : userProfile.email;
  const activeNameStr = userCredentials ? userCredentials.name : userProfile.name;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans selection:bg-indigo-600 selection:text-white transition-colors duration-200">
      
      {/* Platform global sticky Header */}
      <Header 
        userEmail={activeEmailStr} 
        isRunnerActive={isRunnerActive} 
        theme={theme} 
        onToggleTheme={handleToggleTheme}
        dbMode={dbMode}
        onLogout={handleLogout}
        isAuthenticated={!!authToken}
      />

      {/* Main Container Layout */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        
        {/* Dynamic Nav tabs menu row */}
        <div className="flex border-b border-gray-150 dark:border-slate-800 overflow-x-auto scrollbar-none mb-6 shrink-0">
          <nav className="flex space-x-6 text-xs md:text-sm font-medium pr-4">
            
            <button
              id="nails-aut-tab-btn"
              onClick={() => setActiveTab("dashboard")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "dashboard"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <Cpu className="h-4 w-4 shrink-0" />
              <span>AILS Automation Suite</span>
            </button>

            <button
              id="ats-int-tab-btn"
              onClick={() => setActiveTab("resume")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "resume"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <FileText className="h-4 w-4 shrink-0" />
              <span>ATS Intelligence Room</span>
            </button>

            <button
              id="job-pip-tab-btn"
              onClick={() => setActiveTab("tracker")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "tracker"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <ListOrdered className="h-4 w-4 shrink-0" />
              <span>Job Pipeline Tracker</span>
            </button>

            <button
              id="ai-sem-tab-btn"
              onClick={() => setActiveTab("semantic")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "semantic"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <Sparkles className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>AI Semantic Matcher</span>
            </button>

            <button
              id="bes-cov-tab-btn"
              onClick={() => setActiveTab("coverletter")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "coverletter"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <GraduationCap className="h-4 w-4 shrink-0" />
              <span>Bespoke Cover Generator</span>
            </button>

            <button
              id="car-cop-tab-btn"
              onClick={() => setActiveTab("chatbot")}
              className={`py-3 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-2 ${
                activeTab === "chatbot"
                  ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
                  : "border-transparent text-gray-500 dark:text-slate-400 hover:text-gray-700 dark:hover:text-slate-200 hover:border-gray-200 dark:hover:border-slate-700"
              }`}
            >
              <HelpCircle className="h-4 w-4 shrink-0" />
              <span>Career Copilot Chat</span>
            </button>

          </nav>
        </div>

        {/* Dynamic Active view render */}
        <div className="flex-1">
          {activeTab === "dashboard" && (
            <DashboardTab
              config={config}
              setConfig={setConfig}
              isRunnerActive={isRunnerActive}
              setIsRunnerActive={setIsRunnerActive}
              onRefreshApplications={fetchApplications}
              secureFetch={secureFetch}
              dbMode={dbMode}
              checkDbStatus={checkDbStatus}
            />
          )}

          {activeTab === "resume" && (
            <ResumeTab
              userProfile={{ ...userProfile, name: activeNameStr, email: activeEmailStr }}
              setUserProfile={setUserProfile}
              onRefreshProfile={fetchProfile}
              secureFetch={secureFetch}
              authToken={authToken}
            />
          )}

          {activeTab === "tracker" && (
            <TrackerTab
              applications={applications}
              onRefreshApplications={fetchApplications}
              onUpdateStatus={handleUpdateStatus}
              onUpdateApplication={handleUpdateApplication}
              onDeleteApplication={handleDeleteApplication}
              onAddCustomApplication={handleAddCustomApplication}
              secureFetch={secureFetch}
            />
          )}

          {activeTab === "semantic" && (
            <SemanticMatchTab
              userProfile={{ ...userProfile, name: activeNameStr, email: activeEmailStr }}
              applications={applications}
              onUpdateApplication={handleUpdateApplication}
              onAddCustomApplication={handleAddCustomApplication}
              secureFetch={secureFetch}
            />
          )}

          {activeTab === "coverletter" && (
            <CoverLetterTab
              userProfile={{ ...userProfile, name: activeNameStr, email: activeEmailStr }}
              onAddCustomApplication={handleAddCustomApplication}
              setActiveTab={setActiveTab}
              secureFetch={secureFetch}
            />
          )}

          {activeTab === "chatbot" && (
            <ChatbotTab secureFetch={secureFetch} />
          )}
        </div>

      </main>

      {/* Global simple styled Footer bar */}
      <footer className="bg-white dark:bg-slate-900 border-t border-gray-150 dark:border-slate-800 py-4 px-6 shrink-0 shadow-2xs transition-colors duration-200-all z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 dark:text-slate-500 font-mono">
          <p>© 2026 Nexvora. All Rights Reserved.</p>
          <div className="flex space-x-4 mt-2 sm:mt-0">
            <span>Core mode: <span className="text-indigo-500 font-bold uppercase">{dbMode} ENGINE</span></span>
            <span>Docker daemon: <span className="text-emerald-500 font-semibold font-mono">STANDBY_OK</span></span>
          </div>
        </div>
      </footer>

    </div>
  );
}
