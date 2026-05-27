import React, { useState } from "react";
import { JobApplication, InterviewStep } from "../types";
import { Search, Plus, Calendar, MapPin, DollarSign, ExternalLink, ChevronDown, ChevronUp, Trash2, Check, Copy, Award, Percent, BookOpen, Layers, Download, ArrowUpDown, Clock, Milestone, Sparkles, Lightbulb } from "lucide-react";

interface InterviewTip {
  question: string;
  tip: string;
  completed?: boolean;
}

interface TrackerTabProps {
  applications: JobApplication[];
  onRefreshApplications: () => void;
  onUpdateStatus: (id: string, newStatus: JobApplication['status']) => void;
  onUpdateApplication: (id: string, updatedFields: Partial<JobApplication>) => void;
  onDeleteApplication: (id: string) => void;
  onAddCustomApplication: (app: Partial<JobApplication>) => void;
  secureFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function TrackerTab({
  applications,
  onRefreshApplications,
  onUpdateStatus,
  onUpdateApplication,
  onDeleteApplication,
  onAddCustomApplication,
  secureFetch
}: TrackerTabProps) {
  const [viewMode, setViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedTimelineAppId, setSelectedTimelineAppId] = useState<string | null>(null);
  const [customStepTitle, setCustomStepTitle] = useState("");
  
  // Custom interactive interview tips state map
  const [interviewTipsMap, setInterviewTipsMap] = useState<Record<string, InterviewTip[]>>({});
  const [loadingTipsMap, setLoadingTipsMap] = useState<Record<string, boolean>>({});

  const fetchInterviewTips = async (appId: string, jobTitle: string, company: string) => {
    if (loadingTipsMap[appId]) return;
    setLoadingTipsMap(prev => ({ ...prev, [appId]: true }));
    try {
      const response = await fetch("/api/generator/interview-tips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobTitle, company })
      });
      const data = await response.json();
      if (data && data.tips) {
        setInterviewTipsMap(prev => ({
          ...prev,
          [appId]: data.tips.map((t: any) => ({ ...t, completed: false }))
        }));
      }
    } catch (err) {
      console.error("Failed to load interview tips", err);
    } finally {
      setLoadingTipsMap(prev => ({ ...prev, [appId]: false }));
    }
  };

  const toggleTipCompleted = (appId: string, tipIndex: number) => {
    const currentTips = interviewTipsMap[appId];
    if (!currentTips) return;
    const updated = [...currentTips];
    updated[tipIndex] = { ...updated[tipIndex], completed: !updated[tipIndex].completed };
    setInterviewTipsMap(prev => ({
      ...prev,
      [appId]: updated
    }));
  };

  const [search, setSearch] = useState("");
  const [timelineSearch, setTimelineSearch] = useState("");
  const [filterPortal, setFilterPortal] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [dateSortOrder, setDateSortOrder] = useState<'desc' | 'asc'>('desc');

  // Helper function to safely load/initialize interview steps for custom visualization
  const ensureSteps = (app: JobApplication): InterviewStep[] => {
    if (app.interviewSteps && app.interviewSteps.length > 0) {
      return app.interviewSteps;
    }
    return [
      { id: "hr", label: "Initial HR Screen", status: "completed", date: "Scheduled", notes: " recruiter alignment call to discuss background & parameters." },
      { id: "tech_test", label: "Technical Assessment", status: "active", date: "", notes: "Review fundamental coding challenges or a take-home systems design task." },
      { id: "tech_panel", label: "Technical Panel & Code Review", status: "pending", date: "", notes: "Deep technical dive containing systems architectures or live logic reviews." },
      { id: "cultural", label: "Leadership Alignment & Values", status: "pending", date: "", notes: "Hiring Manager conversation about cultural principles." },
      { id: "offer", label: "Roundtable & Offer Negotiations", status: "pending", date: "", notes: "Final step: review compensation sheets, options packages, or timing." }
    ];
  };

  const handleUpdateStepStatus = (appId: string, stepId: string, currentSteps: InterviewStep[], newStatus: InterviewStep['status']) => {
    const updated = currentSteps.map(step => 
      step.id === stepId ? { ...step, status: newStatus } : step
    );
    onUpdateApplication(appId, { interviewSteps: updated });
  };

  const handleUpdateStepDate = (appId: string, stepId: string, currentSteps: InterviewStep[], dateValue: string) => {
    const updated = currentSteps.map(step => 
      step.id === stepId ? { ...step, date: dateValue } : step
    );
    onUpdateApplication(appId, { interviewSteps: updated });
  };

  const handleUpdateStepNotes = (appId: string, stepId: string, currentSteps: InterviewStep[], notesValue: string) => {
    const updated = currentSteps.map(step => 
      step.id === stepId ? { ...step, notes: notesValue } : step
    );
    onUpdateApplication(appId, { interviewSteps: updated });
  };

  const handleAddCustomStep = (appId: string, currentSteps: InterviewStep[]) => {
    if (!customStepTitle.trim()) return;
    const newStep: InterviewStep = {
      id: "custom-" + Date.now(),
      label: customStepTitle.trim(),
      status: "pending",
      notes: "",
      date: ""
    };
    onUpdateApplication(appId, { interviewSteps: [...currentSteps, newStep] });
    setCustomStepTitle("");
  };

  const handleResetSteps = (appId: string) => {
    onUpdateApplication(appId, { interviewSteps: undefined });
  };

  const hasUpcomingInterview = (app: JobApplication): boolean => {
    const steps = ensureSteps(app);
    return steps.some(step => step.date && step.date.trim() !== "" && step.status !== "completed");
  };
  
  // Custom form state modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCompany, setNewCompany] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("Remote");
  const [newSalary, setNewSalary] = useState("");
  const [newPortal, setNewPortal] = useState<'LinkedIn' | 'Indeed' | 'Naukri' | 'Manual' | 'None'>('Manual');
  const [newMatch, setNewMatch] = useState(85);
  const [newNotes, setNewNotes] = useState("");
  const [newCover, setNewCover] = useState("");

  // Expansions state map to view deep cover letters or extra notes
  const [expandedAppIds, setExpandedAppIds] = useState<string[]>([]);
  const [copiedAppId, setCopiedAppId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    if (expandedAppIds.includes(id)) {
      setExpandedAppIds(expandedAppIds.filter(item => item !== id));
    } else {
      setExpandedAppIds([...expandedAppIds, id]);
    }
  };

  const handleCopyLetter = (letterText: string, id: string) => {
    navigator.clipboard.writeText(letterText || "");
    setCopiedAppId(id);
    setTimeout(() => setCopiedAppId(null), 2000);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    onAddCustomApplication({
      company: newCompany,
      title: newTitle,
      location: newLocation,
      salary: newSalary || "Undisclosed",
      portal: newPortal === 'None' ? 'Manual' : newPortal,
      matchRate: Number(newMatch),
      status: "applied",
      notes: newNotes,
      coverLetter: newCover || "Dear Recruiters, I am really excited about this position..."
    });

    // Reset Form
    setNewCompany("");
    setNewTitle("");
    setNewLocation("Remote");
    setNewSalary("");
    setNewNotes("");
    setNewCover("");
    setShowAddModal(false);
  };

  // Filter computations
  const filteredApps = applications.filter((app) => {
    const matchesSearch = app.company.toLowerCase().includes(search.toLowerCase()) || 
                          app.title.toLowerCase().includes(search.toLowerCase()) ||
                          app.location.toLowerCase().includes(search.toLowerCase());
    const matchesPortal = filterPortal === "all" || app.portal === filterPortal;
    const matchesStatus = filterStatus === "all" || app.status === filterStatus;
    return matchesSearch && matchesPortal && matchesStatus;
  });

  // Sort by applied/crawled date
  const sortedApps = [...filteredApps].sort((a, b) => {
    const parseDate = (dString?: string) => {
      if (!dString) return 0;
      const match = dString.match(/\d{4}-\d{2}-\d{2}/);
      if (match) {
        return new Date(match[0]).getTime();
      }
      const p = Date.parse(dString);
      return !isNaN(p) ? p : 0;
    };

    const dateA = parseDate(a.appliedDate);
    const dateB = parseDate(b.appliedDate);

    if (dateSortOrder === "desc") {
      return dateB - dateA;
    } else {
      return dateA - dateB;
    }
  });

  const handleExportToCSV = () => {
    if (filteredApps.length === 0) return;

    const headers = [
      "ID",
      "Company",
      "Title",
      "Location",
      "Salary",
      "Portal",
      "Match Rate (%)",
      "Status",
      "Applied Date",
      "Notes",
      "Cover Letter"
    ];

    const escapeCSV = (val: any) => {
      const str = String(val ?? "").replace(/"/g, '""');
      return str.includes(",") || str.includes("\n") || str.includes('"')
        ? `"${str}"`
        : str;
    };

    const csvContent = [
      headers.join(","),
      ...filteredApps.map((app) => {
        return [
          app.id,
          app.company,
          app.title,
          app.location,
          app.salary,
          app.portal,
          app.matchRate,
          app.status,
          app.appliedDate || "",
          app.notes || "",
          app.coverLetter || ""
        ]
          .map(escapeCSV)
          .join(",");
      })
    ].join("\n");

    const blob = new Blob(["\ufeff" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `aihawk_applications_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // KPI computations
  const totalCount = applications.length;
  const interviewingCount = applications.filter(a => a.status === 'interviewing').length;
  const appliedCount = applications.filter(a => a.status === 'applied').length;
  const avgMatchRate = applications.length > 0
    ? Math.round(applications.reduce((acc, curr) => acc + curr.matchRate, 0) / applications.length)
    : 0;

  // Timeline computations
  const interviewingApps = applications.filter(app => app.status === 'interviewing');
  
  const filteredInterviewingApps = interviewingApps.filter(app => {
    if (!timelineSearch.trim()) return true;
    const query = timelineSearch.toLowerCase();
    
    const matchBasic = 
      app.company.toLowerCase().includes(query) ||
      app.title.toLowerCase().includes(query) ||
      (app.location && app.location.toLowerCase().includes(query));
      
    if (matchBasic) return true;
    
    const steps = ensureSteps(app);
    const matchStep = steps.some(step => 
      (step.label && step.label.toLowerCase().includes(query)) ||
      (step.notes && step.notes.toLowerCase().includes(query)) ||
      (step.date && step.date.toLowerCase().includes(query))
    );
    
    return matchStep;
  });

  const activeTimelineApp = filteredInterviewingApps.find(app => app.id === selectedTimelineAppId) || filteredInterviewingApps[0] || null;

  const stepsList = activeTimelineApp ? ensureSteps(activeTimelineApp) : [];
  const finishedCount = stepsList.filter(s => s.status === 'completed').length;
  const ratio = stepsList.length > 0 ? Math.round((finishedCount / stepsList.length) * 100) : 0;
  const percentVal = Math.min(ratio, 100);

  return (
    <div id="tracker-tab-container" className="space-y-6">
      
      {/* 4 Multi-column SaaS KPIs widgets */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Applied */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-2xs flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-lg text-indigo-600">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Applications Scans</p>
            <p className="text-xl font-bold text-gray-900">{totalCount}</p>
          </div>
        </div>

        {/* Suitable Candidates Avg Match */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-2xs flex items-center space-x-4">
          <div className="bg-emerald-50 p-3 rounded-lg text-emerald-600">
            <Percent className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Avg ATS Suitability</p>
            <p className="text-xl font-bold text-gray-900">{avgMatchRate}%</p>
          </div>
        </div>

        {/* Active Pipeline Screenings */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-2xs flex items-center space-x-4">
          <div className="bg-amber-50 p-3 rounded-lg text-amber-600">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Active screenings</p>
            <p className="text-xl font-bold text-gray-900">{interviewingCount}</p>
          </div>
        </div>

        {/* Success Applies */}
        <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-2xs flex items-center space-x-4">
          <div className="bg-sky-50 p-3 rounded-lg text-sky-600">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-gray-400">Total Applied Jobs</p>
            <p className="text-xl font-bold text-gray-900">{appliedCount}</p>
          </div>
        </div>

      </div>

      {/* View Mode Tabs Switcher */}
      <div className="flex border-b border-gray-150 dark:border-slate-800 space-x-6 text-xs md:text-sm font-medium">
        <button
          onClick={() => setViewMode('list')}
          className={`pb-2.5 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5 ${
            viewMode === 'list'
              ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-650 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>Pipeline Card List</span>
        </button>
        <button
          onClick={() => setViewMode('timeline')}
          className={`pb-2.5 px-1 border-b-2 font-semibold transition-all cursor-pointer inline-flex items-center space-x-1.5 ${
            viewMode === 'timeline'
              ? "border-indigo-600 dark:border-indigo-400 text-indigo-600 font-bold"
              : "border-transparent text-gray-400 hover:text-gray-650 dark:text-slate-400 dark:hover:text-slate-300"
          }`}
        >
          <Calendar className="h-4 w-4" />
          <span className="relative">
            Interview Progress Timeline
            {interviewingCount > 0 && (
              <span className="absolute -top-1.5 -right-5 bg-amber-500 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full leading-none animate-pulse">
                {interviewingCount}
              </span>
            )}
          </span>
        </button>
      </div>

      {viewMode === 'list' ? (
        <>
          {/* Primary search filter bar */}
          <div className="bg-white rounded-xl border border-gray-150 p-4 shadow-2xs flex flex-col md:flex-row space-y-3 md:space-y-0 md:items-center md:space-x-4">
            
            {/* Search Input bar */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400 pointer-events-none">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search matching title, corporate name, or city tags..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs border border-gray-200 rounded-lg pl-9 pr-4 py-2 bg-slate-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900"
              />
            </div>

            {/* Filter Portal Selection */}
            <div className="flex space-x-3 items-center">
              <select
                value={filterPortal}
                onChange={(e) => setFilterPortal(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700"
              >
                <option value="all">All Portals</option>
                <option value="LinkedIn">LinkedIn Source Only</option>
                <option value="Indeed">Indeed Posts</option>
                <option value="Naukri">Naukri Crawls</option>
                <option value="Manual">Manual Additions</option>
              </select>

              {/* Filter Status Selection */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="text-xs bg-white border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 outline-none text-gray-700"
              >
                <option value="all">All Statuses</option>
                <option value="applied">Applied Targets</option>
                <option value="interviewing">Interviewing Pipeline</option>
                <option value="offered">Offered letters</option>
                <option value="rejected">Unselected / Rejected</option>
                <option value="queued">Automation queued</option>
                <option value="saved">Saved bookmarks</option>
              </select>

              {/* Date Added Sort Switcher */}
              <button
                id="toggle-date-sort-btn"
                type="button"
                onClick={() => setDateSortOrder(prev => prev === "desc" ? "asc" : "desc")}
                className="text-xs bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2 px-3 rounded-lg flex items-center space-x-1.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-all cursor-pointer whitespace-nowrap"
                title={`Sort by Date Added (Currently sorting by: ${dateSortOrder === 'desc' ? 'Newest First' : 'Oldest First'})`}
              >
                <ArrowUpDown className="h-3.5 w-3.5 text-gray-500" />
                <span>Date: {dateSortOrder === "desc" ? "Newest" : "Oldest"}</span>
              </button>

              {/* Add custom manually file trigger */}
              <button
                id="open-add-modal-btn"
                onClick={() => setShowAddModal(true)}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center space-x-1 shadow transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>Manually Add Job</span>
              </button>

              {/* Export to CSV trigger */}
              <button
                id="export-applications-csv-btn"
                onClick={handleExportToCSV}
                disabled={filteredApps.length === 0}
                className="bg-white hover:bg-gray-50 border border-gray-200 disabled:bg-gray-55 disabled:text-gray-350 disabled:cursor-not-allowed active:scale-[0.98] text-gray-700 font-semibold text-xs py-2 px-4 rounded-lg flex items-center space-x-1.5 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
                title="Export current matched applications to CSV"
              >
                <Download className="h-4 w-4 text-gray-500" />
                <span>Export CSV</span>
              </button>
            </div>

          </div>

          {/* Grid of applications results */}
          {sortedApps.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-150 p-12 text-center text-gray-400">
              <p className="font-semibold text-sm mb-1">No matching target pipelines found</p>
              <p className="text-xs">Adjust search keys or start AIHawk agent runner to crawl LinkedIn easy apply targets.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sortedApps.map((app) => {
                const isExpanded = expandedAppIds.includes(app.id);
                const isCopied = copiedAppId === app.id;

                // Status Styling details
                let statusPill = "bg-gray-100 text-gray-700 border-gray-200";
                if (app.status === "applied") statusPill = "bg-blue-50 text-blue-700 border-blue-200";
                else if (app.status === "interviewing") statusPill = "bg-amber-50 text-amber-700 border-amber-200";
                else if (app.status === "offered") statusPill = "bg-emerald-50 text-emerald-700 border-emerald-200";
                else if (app.status === "rejected") statusPill = "bg-rose-50 text-rose-700 border-rose-200";
                else if (app.status === "queued") statusPill = "bg-indigo-100 text-indigo-800 border-indigo-200";

                return (
                  <div
                    key={app.id}
                    className="bg-white rounded-xl border border-gray-150 shadow-2xs hover:shadow-xs transition duration-150 overflow-hidden"
                  >
                    {/* Header row details */}
                    <div className="p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
                      
                      {/* Left Metadata elements */}
                      <div className="flex items-start space-x-4">
                        {/* Portal Tag Badge */}
                        <div className="text-center pt-1.5 shrink-0">
                          <span className="text-[10px] font-mono px-2 py-1 rounded bg-slate-50 text-slate-800 border border-slate-150 shadow-2xs block">
                            {app.portal}
                          </span>
                        </div>

                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900 text-sm">{app.title}</h3>
                            <span className="text-xs font-bold text-gray-400">•</span>
                            <span className="text-xs font-semibold text-gray-500">{app.company}</span>
                            {hasUpcomingInterview(app) && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200 dark:border-amber-900/60 px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider shrink-0" title="Upcoming Interview scheduled">
                                <Clock className="h-2.5 w-2.5" />
                                <span>Upcoming</span>
                              </span>
                            )}
                          </div>

                          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400 font-medium">
                            <span className="flex items-center space-x-1">
                              <MapPin className="h-3.5 w-3.5 text-gray-400" />
                              <span>{app.location}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <DollarSign className="h-3.5 w-3.5 text-gray-400" />
                              <span>{app.salary}</span>
                            </span>
                            <span>•</span>
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3.5 w-3.5 text-gray-400" />
                              <span>Crawled {app.appliedDate}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Status Controls and Actions */}
                      <div className="flex flex-wrap items-center gap-3">
                        
                        {/* Suitability score match */}
                        <div className="text-right">
                          <div className={`px-2.5 py-1 rounded border font-semibold font-mono text-xs ${app.matchRate >= 85 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : 'bg-amber-50 text-amber-800 border-amber-200'}`}>
                            {app.matchRate}% Match
                          </div>
                        </div>

                        {/* Status selection interactive dropdown */}
                        <select
                          value={app.status || "applied"}
                          onChange={(e) => onUpdateStatus(app.id, e.target.value as JobApplication['status'])}
                          className={`text-xs font-semibold py-1.5 px-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${statusPill}`}
                        >
                          <option value="applied">Applied</option>
                          <option value="interviewing">Interviewing</option>
                          <option value="offered">Offered 🎉</option>
                          <option value="rejected">Rejected ❌</option>
                          <option value="queued">Queued</option>
                          <option value="saved">Saved</option>
                        </select>

                        {/* Expand Letter Button */}
                        <button
                          onClick={() => toggleExpand(app.id)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg p-2 transition-colors cursor-pointer"
                          title="Inspect Cover Letter & Notes"
                        >
                          {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                        </button>

                        {/* Delete entry completely */}
                        <button
                          onClick={() => onDeleteApplication(app.id)}
                          className="bg-red-50 hover:bg-red-100 text-red-600 rounded-lg p-2 transition-colors cursor-pointer"
                          title="Delete Application from list"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>

                    </div>

                    {/* Collapsible expansion pane: Cover Letter, notes, etc. */}
                    {isExpanded && (
                      <div className="bg-slate-50 border-t border-gray-150 p-5 space-y-4 animate-fade-in text-xs md:text-sm">
                        {/* Optional URL link redirects */}
                        {app.link && (
                          <div className="flex justify-end p-0">
                            <a
                              href={app.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-indigo-600 hover:text-indigo-800 inline-flex items-center space-x-1 font-semibold text-xs"
                            >
                              <span>Open original job coordinates</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}

                        {/* Form internal comments */}
                        {app.notes && (
                          <div className="space-y-1">
                            <h4 className="font-semibold text-gray-700">Internal application records / notes</h4>
                            <p className="text-gray-600 bg-white border border-gray-100 p-3 rounded-lg leading-relaxed">
                              {app.notes}
                            </p>
                          </div>
                        )}

                        {/* BESPOKE TAILORED AI COVER LETTER DISPLAY */}
                        {app.coverLetter && (
                          <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between items-center">
                              <h4 className="font-semibold text-gray-700 uppercase font-mono text-[11px] tracking-wider">
                                Generated Bespoke Cover Letter
                              </h4>
                              
                              <button
                                onClick={() => handleCopyLetter(app.coverLetter || "", app.id)}
                                className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-indigo-200 inline-flex items-center space-x-1 cursor-pointer transition-colors"
                              >
                                {isCopied ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Copied letter!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy to clipboard</span>
                                  </>
                                )}
                              </button>
                            </div>

                            <pre className="font-sans text-xs bg-white border border-gray-100 p-4 rounded-xl leading-relaxed text-gray-700 whitespace-pre-wrap overflow-x-auto max-h-[340px]">
                              {app.coverLetter}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* ==========================================
           INTERVIEW PROGRESS TIMELINE WORKSPACE
           ========================================== */
        <div className="space-y-6 animate-fade-in text-xs md:text-sm">
          
          {/* Timeline View Header Card */}
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900 dark:text-slate-100 flex items-center space-x-2">
                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 p-1.5 rounded-lg">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <span>Active Interview Progress Workspace</span>
                </h2>
                <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 max-w-xl leading-relaxed">
                  Track steps, schedule screening calendars, record focus notes, and review milestone pipelines for all applications currently in the Interviewing stage.
                </p>
              </div>
              
              <div className="flex space-x-3 text-xs font-mono">
                <div className="bg-amber-50/50 dark:bg-amber-955/20 border border-amber-150 dark:border-amber-900 rounded-lg p-2 px-3 text-amber-850 dark:text-amber-400">
                  <span className="font-bold">{interviewingCount}</span> interviewing
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-955/20 border border-emerald-150 dark:border-emerald-900 rounded-lg p-2 px-3 text-emerald-800 dark:text-emerald-400">
                  <span className="font-bold">
                    {applications.filter(a => a.status === 'interviewing' && ensureSteps(a).every(s => s.status === 'completed')).length}
                  </span> cleared
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Layout Body */}
          {interviewingCount === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-16 text-center max-w-xl mx-auto flex flex-col items-center space-y-4 shadow-3xs">
              <div className="p-4 bg-amber-50 dark:bg-slate-800 text-amber-500 rounded-full">
                <Calendar className="h-10 w-10 animate-bounce" />
              </div>
              <h3 className="font-bold text-gray-900 dark:text-slate-200">No active interviews found</h3>
              <p className="text-xs text-gray-400 dark:text-slate-400 max-w-sm leading-relaxed">
                You don't have any jobs set to the <strong>'Interviewing'</strong> stage. Modify any pipeline application to <strong>'Interviewing'</strong> inside the Card list to initialize its progress track.
              </p>
              <button
                onClick={() => setViewMode('list')}
                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs py-2 px-5 rounded-lg transition-all cursor-pointer"
              >
                Go to Pipeline Card List
              </button>
            </div>
          ) : (
            <div className="space-y-4">
                
                {/* Search Bar Workspace Input */}
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-400 pointer-events-none">
                    <Search className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search company name, job level, interview step milestone, specific date, or recorded preparation notes..."
                    value={timelineSearch}
                    onChange={(e) => setTimelineSearch(e.target.value)}
                    className="w-full text-xs font-medium border border-gray-220 dark:border-slate-800 rounded-xl pl-10 pr-24 py-3 bg-white dark:bg-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-900 dark:text-slate-100 shadow-3xs placeholder:text-gray-400 dark:placeholder:text-slate-550"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-2">
                    {timelineSearch && (
                      <button
                        type="button"
                        onClick={() => setTimelineSearch("")}
                        className="text-[10px] bg-gray-100 hover:bg-gray-205 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-500 dark:text-slate-400 font-bold px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        Clear
                      </button>
                    )}
                    <span className="text-[9px] font-mono font-bold text-gray-400 dark:text-slate-500 select-none bg-slate-50 dark:bg-slate-950 border border-gray-150 dark:border-slate-800/80 px-2 py-0.5 rounded">
                      {filteredInterviewingApps.length} matched
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-6 items-start">
                  
                  {/* Left side list */}
                  <div className="col-span-12 md:col-span-4 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-4 rounded-xl space-y-3 max-h-[680px] overflow-y-auto shadow-3xs">
                    <div className="border-b border-gray-100 dark:border-slate-850 pb-2">
                      <h3 className="font-semibold text-gray-500 text-[10px] uppercase font-mono tracking-wider">Interviewing Companies</h3>
                    </div>

                    <div className="space-y-2">
                      {filteredInterviewingApps.length === 0 ? (
                        <div className="p-6 text-center space-y-2 border border-dashed border-gray-200 dark:border-slate-800 rounded-xl">
                          <p className="text-xs text-gray-400 dark:text-slate-500">No active pipelines or prepare notes match "{timelineSearch}"</p>
                          <button
                            type="button"
                            onClick={() => setTimelineSearch("")}
                            className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline font-bold"
                          >
                            Reset filter
                          </button>
                        </div>
                      ) : (
                        filteredInterviewingApps.map(app => {
                          const appSteps = ensureSteps(app);
                          const doneCount = appSteps.filter(s => s.status === 'completed').length;
                          const nextMilestone = appSteps.find(s => s.status === 'active')?.label || "Deciding Draft";
                          const isSelected = activeTimelineApp && app.id === activeTimelineApp.id;
                          const completedPercent = Math.round((doneCount / appSteps.length) * 100);

                          return (
                            <button
                              key={app.id}
                              onClick={() => setSelectedTimelineAppId(app.id)}
                              className={`w-full text-left p-3 rounded-xl border transition-all cursor-pointer flex flex-col space-y-1.5 relative overflow-hidden ${
                                isSelected 
                                  ? "border-indigo-500 bg-indigo-50/30 dark:bg-indigo-950/25 scale-[1.01]" 
                                  : "border-gray-150 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-gray-50 dark:hover:bg-slate-800"
                              }`}
                            >
                          {isSelected && (
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600 dark:bg-indigo-400"></div>
                          )}

                          <div className="flex justify-between items-start">
                            <div>
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <h4 className="font-bold text-gray-900 dark:text-slate-100 text-sm">{app.company}</h4>
                                {hasUpcomingInterview(app) && (
                                  <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-750 dark:bg-amber-950/40 dark:text-amber-450 dark:border-amber-900/60 border border-amber-200 px-1 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider shrink-0" title="Upcoming Interview scheduled">
                                    <Clock className="h-2 w-2" />
                                    <span>Upcoming</span>
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-gray-400 dark:text-slate-500 truncate leading-tight">{app.title}</p>
                            </div>
                            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900 self-start">
                              {app.matchRate}% Match
                            </span>
                          </div>

                          <div className="space-y-1 pt-1">
                            <div className="flex justify-between text-[9px] font-semibold text-gray-400 dark:text-slate-400">
                              <span className="truncate max-w-[150px] text-indigo-600 dark:text-indigo-400">Round: {nextMilestone}</span>
                              <span className="font-mono">{doneCount}/{appSteps.length} complete</span>
                            </div>
                            <div className="w-full h-1 bg-gray-150 dark:bg-slate-800 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                                style={{ width: `${completedPercent}%` }}
                              ></div>
                            </div>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

                {/* Right side detailed pane */}
                {activeTimelineApp && (
                  <div id="timeline-detail-workspace-pane" className="col-span-12 md:col-span-8 space-y-4">
                      
                      {/* Sub Header Card */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-5 shadow-3xs flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 select-none uppercase rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-150 dark:border-indigo-900">
                              {activeTimelineApp.portal} Source
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono">Applied Date: {activeTimelineApp.appliedDate}</span>
                          </div>
                          <h3 className="font-bold text-gray-900 dark:text-slate-100 text-base sm:text-lg mt-1 leading-tight">{activeTimelineApp.title}</h3>
                          <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold select-none">
                            <span>{activeTimelineApp.company}</span>
                            {hasUpcomingInterview(activeTimelineApp) && (
                              <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-755 dark:bg-amber-950/40 dark:text-amber-450 dark:border-amber-900/60 border border-amber-200 px-1.5 py-0.2 rounded text-[9px] font-bold uppercase tracking-wider shrink-0" title="Upcoming Interview scheduled">
                                <Clock className="h-2.5 w-2.5" />
                                <span>Upcoming</span>
                              </span>
                            )}
                            <span className="text-gray-300">•</span>
                            <span className="text-gray-500 dark:text-slate-400 font-normal">{activeTimelineApp.location}</span>
                            <span className="text-gray-300">•</span>
                            <span className="text-emerald-700 dark:text-emerald-400 font-mono font-bold">{activeTimelineApp.salary}</span>
                          </div>
                        </div>

                        {/* Top quick decision update buttons */}
                        <div className="flex items-center space-x-2 shrink-0">
                          {activeTimelineApp.link && (
                            <a
                              href={activeTimelineApp.link}
                              target="_blank"
                              rel="noreferrer"
                              className="bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-750 p-2 rounded-lg border border-gray-200 dark:border-slate-700 text-gray-650 dark:text-slate-300 transition-colors"
                              title="Go to job original coordinates"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}
                          <button
                            onClick={() => onUpdateStatus(activeTimelineApp.id, 'offered')}
                            className="bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs py-2 px-3.5 rounded-lg flex items-center space-x-1 shadow-2xs transition-all cursor-pointer"
                          >
                            <Award className="h-4 w-4" />
                            <span>Mark Offered 🎉</span>
                          </button>
                          <button
                            onClick={() => onUpdateStatus(activeTimelineApp.id, 'rejected')}
                            className="bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:text-rose-400 text-rose-700 font-semibold text-xs py-2 px-3 rounded-lg flex items-center shadow-3xs transition-all cursor-pointer"
                          >
                            <span>Rejected ❌</span>
                          </button>
                        </div>
                      </div>

                      {/* Main Workspace Frame */}
                      <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-5 shadow-3xs space-y-6">
                        
                        {/* Interactive Steps Metre Progress Track */}
                        <div>
                          <div className="flex justify-between items-center text-xs font-semibold text-gray-700 dark:text-slate-300 mb-2">
                            <span>Process Progression: <span className="text-indigo-600 dark:text-indigo-400">{percentVal}% Completed</span></span>
                            <span className="font-mono text-gray-400 dark:text-slate-500">{finishedCount} of {stepsList.length} Rounds Clear</span>
                          </div>

                          <div className="flex gap-1 bg-gray-100 dark:bg-slate-800 p-1 rounded-full w-full overflow-hidden">
                            {stepsList.map(step => {
                              let nodeBg = "bg-gray-200 dark:bg-slate-700";
                              if (step.status === 'completed') nodeBg = "bg-emerald-500";
                              else if (step.status === 'active') nodeBg = "bg-indigo-600 dark:bg-indigo-500 animate-pulse";

                              return (
                                <div
                                  key={step.id}
                                  className={`h-2 rounded-full flex-1 transition-all duration-350 ${nodeBg}`}
                                  title={`${step.label} (${step.status})`}
                                ></div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Timeline Flow Steps details */}
                        <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5 space-y-4">
                          <div className="flex justify-between items-center">
                            <h4 className="text-[10px] font-bold uppercase font-mono tracking-wider text-gray-400 dark:text-slate-500">
                              Interactive Interview Steps Checklist
                            </h4>
                            <button
                              type="button"
                              onClick={() => handleResetSteps(activeTimelineApp.id)}
                              className="text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-semibold text-xs cursor-pointer"
                            >
                              Reset to Default Milestones
                            </button>
                          </div>

                          {/* Outer timeline vertical dashed strip */}
                          <div className="relative pl-6 space-y-6 border-l-2 border-dashed border-gray-150 dark:border-slate-800 ml-4">
                            {stepsList.map((step) => {
                              return (
                                <div key={step.id} className="relative group animate-fade-in text-xs md:text-sm">
                                  
                                  {/* Milestone node circular badge absolute positioning */}
                                  <div className="absolute -left-[35px] top-1 flex items-center justify-center">
                                    {step.status === 'completed' ? (
                                      <div
                                        onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'pending')}
                                        className="bg-emerald-500 text-white rounded-full p-1 border-4 border-white dark:border-slate-900 shadow-2xs cursor-pointer active:scale-90 transition-all"
                                        title="Click to reset status"
                                      >
                                        <Check className="h-3 w-3" />
                                      </div>
                                    ) : step.status === 'active' ? (
                                      <div
                                        onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'completed')}
                                        className="bg-indigo-600 dark:bg-indigo-500 text-white rounded-full p-1 border-4 border-white dark:border-slate-900 shadow-2xs cursor-pointer active:scale-90 transition-all relative"
                                        title="Click to mark completed"
                                      >
                                        <span className="absolute inset-0 bg-indigo-600 dark:bg-indigo-500 rounded-full animate-ping opacity-65"></span>
                                        <span className="block h-2 w-2 bg-white rounded-full relative z-10"></span>
                                      </div>
                                    ) : (
                                      <div
                                        onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'active')}
                                        className="bg-white dark:bg-slate-900 border-2 border-gray-200 dark:border-slate-750 text-gray-300 rounded-full p-1.5 shadow-3xs cursor-pointer active:scale-95 transition"
                                        title="Click to mark active"
                                      >
                                        <div className="h-1.5 w-1.5 bg-gray-200 dark:bg-slate-700 rounded-full"></div>
                                      </div>
                                    )}
                                  </div>

                                  {/* Step detailed contents container card */}
                                  {(() => {
                                    const query = timelineSearch.toLowerCase().trim();
                                    const isStepMatched = !query || 
                                      (step.label && step.label.toLowerCase().includes(query)) ||
                                      (step.notes && step.notes.toLowerCase().includes(query)) ||
                                      (step.date && step.date.toLowerCase().includes(query));

                                    return (
                                      <div className={`border rounded-xl p-4 shadow-3xs transition-all duration-200 ${
                                        isStepMatched 
                                          ? timelineSearch.trim()
                                            ? "bg-indigo-50/40 dark:bg-indigo-950/15 border-indigo-400 dark:border-indigo-900/60 ring-2 ring-indigo-500/5 shadow-2xs"
                                            : "bg-slate-50/55 dark:bg-slate-950/20 border-gray-100 dark:border-slate-800 hover:border-gray-200 dark:hover:border-slate-700 hover:shadow-2xs"
                                          : "bg-white/30 dark:bg-slate-900/10 border-gray-100/40 dark:border-slate-900/30 opacity-40 grayscale-[25%] pointer-events-none select-none"
                                      }`}>
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div>
                                            <h5 className="font-bold text-gray-950 dark:text-slate-100 text-sm flex items-center gap-1.5 flex-wrap">
                                              <span>{step.label}</span>
                                              {step.status === 'active' && (
                                                <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 text-[9px] font-mono px-1.5 py-0.2 rounded-full uppercase animate-pulse">
                                                  Current Ring
                                                </span>
                                              )}
                                              {timelineSearch.trim() && isStepMatched && (
                                                <span className="bg-amber-100 dark:bg-amber-955/35 text-amber-800 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 text-[8px] font-bold font-mono px-1.5 py-0.2 rounded uppercase">
                                                  Match Note
                                                </span>
                                              )}
                                            </h5>
                                            <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">{step.notes || "No focus preparation notes recorded."}</p>
                                          </div>

                                          {/* Done toggle switch states buttons list */}
                                          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 border border-gray-150 dark:border-slate-800 p-0.5 rounded-lg shrink-0 select-none">
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'pending')}
                                              className={`text-[9px] uppercase font-bold font-mono px-2 py-0.5. py-1 rounded transition-colors cursor-pointer ${
                                                step.status === 'pending'
                                                  ? "bg-gray-100 text-gray-700 dark:bg-slate-800 dark:text-slate-200"
                                                  : "text-gray-400 hover:text-gray-650 dark:hover:text-slate-300"
                                              }`}
                                            >
                                              Pending
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'active')}
                                              className={`text-[9px] uppercase font-bold font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
                                                step.status === 'active'
                                                  ? "bg-indigo-50 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-450 font-bold"
                                                  : "text-gray-400 hover:text-gray-650 dark:hover:text-slate-300"
                                              }`}
                                            >
                                              Active
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() => handleUpdateStepStatus(activeTimelineApp.id, step.id, stepsList, 'completed')}
                                              className={`text-[9px] uppercase font-bold font-mono px-2 py-1 rounded transition-colors cursor-pointer ${
                                                step.status === 'completed'
                                                  ? "bg-emerald-55 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-450 font-bold"
                                                  : "text-gray-400 hover:text-gray-650 dark:hover:text-slate-300"
                                              }`}
                                            >
                                              Passed
                                            </button>
                                          </div>
                                        </div>

                                        {/* Sub scheduling Inputs date/prep */}
                                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-3 pt-3 border-t border-gray-100/60 dark:border-slate-800/60 text-xs">
                                          {/* Dates Input */}
                                          <div className="col-span-1 md:col-span-4 space-y-1">
                                            <label className="text-[10px] uppercase font-mono font-bold text-gray-405 text-gray-400 dark:text-slate-500 flex items-center gap-1 select-none">
                                              <Calendar className="h-3 w-3" />
                                              <span>Schedule date</span>
                                            </label>
                                            <input
                                              type="text"
                                              placeholder="e.g. May 31, 2:30 PM"
                                              value={step.date || ""}
                                              onChange={(e) => handleUpdateStepDate(activeTimelineApp.id, step.id, stepsList, e.target.value)}
                                              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs rounded p-1 px-2 w-full text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                          </div>

                                          {/* Preparations Focus Input */}
                                          <div className="col-span-1 md:col-span-8 space-y-1">
                                            <label className="text-[10px] uppercase font-mono font-bold text-gray-405 text-gray-400 dark:text-slate-500 flex items-center gap-1 select-none">
                                              <Clock className="h-3 w-3" />
                                              <span>Preparation focus / Reminder tips</span>
                                            </label>
                                            <input
                                              type="text"
                                              placeholder="e.g. Focus on micro-frontend systems, custom hooks, and mock testing strategies"
                                              value={step.notes || ""}
                                              onChange={(e) => handleUpdateStepNotes(activeTimelineApp.id, step.id, stepsList, e.target.value)}
                                              className="bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 text-xs rounded p-1 px-2 w-full text-gray-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })()}
                                </div>
                              );
                            })}

                            {/* Add bespoke custom workflow step form */}
                            <div className="flex gap-2 bg-slate-50/20 dark:bg-slate-900/10 p-3.5 border border-dashed border-gray-250 dark:border-slate-800 rounded-xl max-w-lg mt-3">
                              <div className="flex-1">
                                <input
                                  type="text"
                                  placeholder="Append customizable milestone (e.g. Executive Director debrief)..."
                                  value={customStepTitle}
                                  onChange={(e) => setCustomStepTitle(e.target.value)}
                                  className="bg-white dark:bg-slate-900 border border-gray-250 dark:border-slate-800 text-xs rounded-lg p-2 px-3 w-full font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500 text-gray-850 dark:text-slate-200"
                                />
                              </div>
                              <button
                                type="button"
                                onClick={() => handleAddCustomStep(activeTimelineApp.id, stepsList)}
                                className="bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-semibold text-xs py-2 px-4 rounded-lg flex items-center gap-1 cursor-pointer select-none"
                              >
                                <Plus className="h-4 w-4" />
                                <span>Add Step</span>
                              </button>
                            </div>

                          </div>
                        </div>

                        {/* Smart AI Interview Tips Section */}
                        <div className="border-t border-gray-100 dark:border-slate-800/80 pt-5 space-y-4">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse animate-duration-1000" />
                              <h4 className="text-[10px] font-bold uppercase font-mono tracking-wider text-gray-400 dark:text-slate-500">
                                AI Interview Tips & Prep Assistant
                              </h4>
                            </div>
                            {interviewTipsMap[activeTimelineApp.id] && (
                              <button
                                type="button"
                                disabled={loadingTipsMap[activeTimelineApp.id]}
                                onClick={() => fetchInterviewTips(activeTimelineApp.id, activeTimelineApp.title, activeTimelineApp.company)}
                                className="text-[10px] text-indigo-650 dark:text-indigo-400 hover:underline disabled:opacity-50 transition font-semibold cursor-pointer"
                              >
                                {loadingTipsMap[activeTimelineApp.id] ? "Updating..." : "Regenerate Tips 🔄"}
                              </button>
                            )}
                          </div>

                          {!interviewTipsMap[activeTimelineApp.id] && !loadingTipsMap[activeTimelineApp.id] ? (
                            <div className="bg-gradient-to-r from-indigo-50/20 to-indigo-100/10 dark:from-slate-900/20 dark:to-slate-900/40 border border-indigo-100/50 dark:border-slate-800 rounded-xl p-5 text-center space-y-3">
                              <p className="text-xs text-gray-500 dark:text-slate-400 max-w-md mx-auto">
                                Generate a targeted interview prep checklist and custom behavioral questions tailored specifically for the <span className="font-semibold text-gray-800 dark:text-slate-200">{activeTimelineApp.title}</span> position at <span className="font-semibold text-gray-800 dark:text-slate-200">{activeTimelineApp.company}</span>.
                              </p>
                              <button
                                type="button"
                                onClick={() => fetchInterviewTips(activeTimelineApp.id, activeTimelineApp.title, activeTimelineApp.company)}
                                className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 hover:scale-[1.01] active:scale-[0.99] text-white font-semibold text-xs py-2 px-4 rounded-lg shadow-sm transition-all cursor-pointer"
                              >
                                <Lightbulb className="h-3.5 w-3.5 text-amber-300" />
                                <span>Generate Prep Checklist</span>
                              </button>
                            </div>
                          ) : loadingTipsMap[activeTimelineApp.id] ? (
                            <div className="bg-slate-50/50 dark:bg-slate-900/10 border border-gray-100 dark:border-slate-800 rounded-xl p-6 space-y-4">
                              <div className="flex items-center gap-3">
                                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping"></span>
                                <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                                  Consulting Gemini specifications for {activeTimelineApp.company}...
                                </span>
                              </div>
                              <div className="space-y-2">
                                <div className="h-4 bg-gray-100 dark:bg-slate-800 rounded-md w-3/4 animate-pulse"></div>
                                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-md w-5/6 animate-pulse"></div>
                                <div className="h-3 bg-gray-100 dark:bg-slate-800 rounded-md w-1/2 animate-pulse"></div>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-3">
                              {interviewTipsMap[activeTimelineApp.id].map((tip, index) => (
                                <div 
                                  key={index}
                                  onClick={() => toggleTipCompleted(activeTimelineApp.id, index)}
                                  className={`flex items-start gap-3 p-3.5 border rounded-xl cursor-pointer transition-all duration-200 select-none ${
                                    tip.completed 
                                      ? "bg-slate-50/40 dark:bg-slate-950/20 border-gray-150 dark:border-slate-800 opacity-60" 
                                      : "bg-white dark:bg-slate-900 border-gray-150 dark:border-slate-800 hover:border-indigo-150 dark:hover:border-indigo-900/40 hover:shadow-3xs"
                                  }`}
                                >
                                  <div className="mt-0.5 shrink-0">
                                    <div className={`h-4.5 w-4.5 rounded border flex items-center justify-center transition-all ${
                                      tip.completed 
                                        ? "bg-emerald-500 border-emerald-500 text-white" 
                                        : "border-gray-200 dark:border-slate-700 hover:border-indigo-500"
                                    }`}>
                                      {tip.completed && <Check className="h-3.5 w-3.5 stroke-[3px]" />}
                                    </div>
                                  </div>
                                  
                                  <div className="space-y-1">
                                    <h5 className={`text-xs font-bold transition-all ${
                                      tip.completed 
                                        ? "line-through text-gray-400 dark:text-slate-500" 
                                        : "text-gray-800 dark:text-slate-200 hover:text-indigo-650"
                                    }`}>
                                      {tip.question}
                                    </h5>
                                    <p className="text-xs text-gray-500 dark:text-slate-400 leading-relaxed font-normal">
                                      <span className="font-semibold text-indigo-600 dark:text-indigo-400">Prep Core Strategy: </span>
                                      {tip.tip}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                      </div>
                    </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {/* Manual Add customized job modal prompt forms */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl border border-gray-150 overflow-hidden max-w-lg w-full max-h-[90vh] overflow-y-auto animate-zoom-in text-xs md:text-sm">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-150 flex justify-between items-center">
              <h3 className="font-sans font-bold text-gray-900">Manually File Custom Target</h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold text-lg"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitCustom} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Company name</label>
                  <input
                    type="text"
                    required
                    value={newCompany}
                    onChange={(e) => setNewCompany(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Stripe, Inc."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Job Designation</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Software Architect"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Locations tag</label>
                  <input
                    type="text"
                    required
                    value={newLocation}
                    onChange={(e) => setNewLocation(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="Remote, NY"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Salary Range</label>
                  <input
                    type="text"
                    value={newSalary}
                    onChange={(e) => setNewSalary(e.target.value)}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                    placeholder="$140k - $175k"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Portal Platform Source</label>
                  <select
                    value={newPortal}
                    onChange={(e) => setNewPortal(e.target.value as any)}
                    className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="Manual">Manual Entry</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Naukri">Naukri</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">ATS suitability Match %</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={newMatch}
                    onChange={(e) => setNewMatch(Number(e.target.value))}
                    className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Internal notes</label>
                <textarea
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  rows={2}
                  placeholder="Need to connect with developer referral..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Bespoke resume cover-letter</label>
                <textarea
                  value={newCover}
                  onChange={(e) => setNewCover(e.target.value)}
                  className="w-full font-mono text-xs border border-gray-200 rounded-lg p-2 focus:ring-2 focus:ring-indigo-500 bg-white"
                  rows={4}
                  placeholder="Optional cover letter words..."
                />
              </div>

              <div className="pt-3 border-t border-gray-150 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold text-xs py-2 px-4 rounded-lg transition-colors"
                >
                  Dismiss
                </button>
                <button
                  id="add-custom-job-btn"
                  type="submit"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-5 rounded-lg shadow transition-all"
                >
                  File Job Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
