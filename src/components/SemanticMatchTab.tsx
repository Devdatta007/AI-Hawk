import React, { useState, useEffect } from "react";
import { UserProfile, JobApplication } from "../types";
import { Sparkles, Trophy, CheckCircle, AlertCircle, FileText, Activity, Lightbulb, Save, Check, RefreshCw, Star, Layers, Cpu, Search } from "lucide-react";

interface SemanticMatchResult {
  overallScore: number;
  atsScore: number;
  semanticScore: number;
  semanticReasoning: string;
  matchingKeywords: string[];
  missingKeywords: string[];
  tailoredSummary: string;
  actionableRevises: string[];
  _demo?: boolean;
}

interface SemanticMatchTabProps {
  userProfile: UserProfile;
  applications: JobApplication[];
  onUpdateApplication: (id: string, updatedFields: Partial<JobApplication>) => void;
  onAddCustomApplication: (app: Partial<JobApplication>) => void;
  secureFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function SemanticMatchTab({
  userProfile,
  applications,
  onUpdateApplication,
  onAddCustomApplication,
  secureFetch
}: SemanticMatchTabProps) {
  // Config state
  const [selectedAppId, setSelectedAppId] = useState<string>("custom");
  const [jobTitle, setJobTitle] = useState("");
  const [company, setCompany] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [resumeText, setResumeText] = useState(userProfile.resumeText || "");
  
  // Interaction outcomes
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<SemanticMatchResult | null>(null);
  const [isSavingToApp, setIsSavingToApp] = useState(false);
  const [saveSuccessMessage, setSaveSuccessMessage] = useState("");

  // Sync candidate resume if profile updates in-memory
  useEffect(() => {
    if (userProfile.resumeText && !resumeText) {
      setResumeText(userProfile.resumeText);
    }
  }, [userProfile]);

  // Sync form parameters if an existing application is picked
  useEffect(() => {
    if (selectedAppId === "custom") {
      setJobTitle("");
      setCompany("");
      setJobDescription("");
      setMatchResult(null);
    } else {
      const selectedApp = applications.find(app => app.id === selectedAppId);
      if (selectedApp) {
        setJobTitle(selectedApp.title);
        setCompany(selectedApp.company);
        setJobDescription(selectedApp.notes || "Paste their detailed job description here to extract semantic metrics.");
        setMatchResult(null);
      }
    }
    setSaveSuccessMessage("");
  }, [selectedAppId, applications]);

  // Execute matching call
  const handleExecuteSemanticMatch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jobTitle.trim() || !jobDescription.trim()) return;

    setIsMatching(true);
    setSaveSuccessMessage("");
    try {
      const response = await fetch("/api/semantic/match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resumeText,
          jobTitle,
          company,
          jobDescription
        })
      });

      if (response.ok) {
        const data = await response.json();
        setMatchResult(data);
      } else {
        console.error("Match call failed");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsMatching(false);
    }
  };

  // Sync match outcome back into application state (updates the percentage score)
  const handleSaveResultToApplication = async () => {
    if (!matchResult) return;
    setIsSavingToApp(true);
    
    try {
      if (selectedAppId !== "custom") {
        // Update existing application metric
        await onUpdateApplication(selectedAppId, {
          matchRate: matchResult.overallScore,
          notes: (jobDescription + `\n\n[AI MATCH RATINGS]:\nOverall Alignment: ${matchResult.overallScore}%\nATS Keyword Score: ${matchResult.atsScore}%\nSemantic Suitability: ${matchResult.semanticScore}%\n\n${matchResult.tailoredSummary}`).trim()
        });
        setSaveSuccessMessage("Successfully synchronized ATS score metrics to your Job tracker card!");
      } else {
        // Create new application
        const newAppId = "app-sem-" + Date.now();
        await onAddCustomApplication({
          company: company || "Corporate Partner",
          title: jobTitle,
          location: "Silicon Valley / Remote",
          salary: "DOE",
          status: "saved",
          matchRate: matchResult.overallScore,
          portal: "Manual",
          notes: `[AI MATCH REPORT / ATS INSIGHTS]\n- Overall Index: ${matchResult.overallScore}%\n- Key Present Matchers: ${matchResult.matchingKeywords.slice(0, 5).join(", ")}\n\nOriginal Description:\n` + jobDescription
        });
        setSaveSuccessMessage("Created new pipeline position tracked at " + matchResult.overallScore + "% overall alignment score!");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingToApp(false);
      setTimeout(() => setSaveSuccessMessage(""), 5000);
    }
  };

  // Simple progress rating colors
  const getRatingColor = (score: number) => {
    if (score >= 85) return "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900";
    if (score >= 70) return "text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900";
    return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900";
  };

  const getPercentageBarClass = (score: number) => {
    if (score >= 85) return "bg-emerald-500";
    if (score >= 70) return "bg-indigo-500";
    return "bg-amber-500";
  };

  return (
    <div id="semantic-match-tab" className="space-y-6">
      
      {/* Upper header section */}
      <div className="bg-gradient-to-r from-indigo-900 to-slate-900 text-white rounded-xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 translate-x-5 translate-y-5 opacity-10">
          <Sparkles className="h-44 w-44 text-white" />
        </div>
        <div className="max-w-3xl">
          <div className="flex items-center space-x-2 bg-indigo-800/40 border border-indigo-700/50 rounded-full px-3 py-1 w-fit text-[11px] font-semibold text-indigo-200 uppercase tracking-wide mb-3 font-mono">
            <Cpu className="h-3 w-3 text-emerald-400 animate-pulse" />
            <span>Dual Semantic Parsing Core</span>
          </div>
          <h2 className="text-xl md:text-2xl font-bold font-sans tracking-tight">AI Semantic Matcher & ATS Score Engine</h2>
          <p className="text-xs md:text-sm text-indigo-150 leading-relaxed max-w-2xl mt-1 opacity-90">
            Execute professional matching simulations on corporate criteria. Optimize resume phrasing, detect keyword density mismatches, and review semantic suitability indices before submitting documents.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left pane: Job Spec Context Configuration Form (cols: 5) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 overflow-hidden shadow-2xs">
            <div className="bg-gray-50/50 dark:bg-slate-900/60 border-b border-gray-150 dark:border-slate-800 px-5 py-3.5 flex justify-between items-center">
              <span className="text-xs font-bold font-sans text-gray-800 dark:text-slate-200 flex items-center space-x-2">
                <FileText className="h-4 w-4 text-indigo-500" />
                <span>Matcher Input Workspace</span>
              </span>
              <span className="text-[10px] font-mono text-gray-400">Step 1: Params</span>
            </div>

            <form onSubmit={handleExecuteSemanticMatch} className="p-5 space-y-4">
              {/* Select target context */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">Position Focus</label>
                <select
                  value={selectedAppId}
                  onChange={(e) => setSelectedAppId(e.target.value)}
                  className="w-full text-xs font-medium border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="custom">-- Paste Custom Designation & Specs --</option>
                  {applications.map(app => (
                    <option key={app.id} value={app.id}>
                      {app.company} • {app.title} (Match Rate: {app.matchRate || 75}%)
                    </option>
                  ))}
                </select>
              </div>

              {/* Company & Designation */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono text-gray-400 dark:text-slate-500">Designation Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Lead React Engineer"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    className="w-full text-xs font-medium border border-gray-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono text-gray-400 dark:text-slate-500">Corporate Host</label>
                  <input
                    type="text"
                    placeholder="e.g. Stripe Inc."
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    className="w-full text-xs font-medium border border-gray-200 dark:border-slate-800 rounded-lg p-2 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 mt-1"
                  />
                </div>
              </div>

              {/* Resume Text (editable local override) */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">Target Resume Alignment Context</label>
                  <span className="text-[10px] text-gray-400">{resumeText.length} characters</span>
                </div>
                <textarea
                  rows={4}
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste candidate resume credentials or portfolio lists. Retains layout."
                  className="w-full text-[11px] font-mono border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 dark:bg-slate-950 text-gray-800 dark:text-slate-300 pointer-events-auto"
                />
              </div>

              {/* Job description input */}
              <div className="space-y-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-400">Target Corporate Job Description</label>
                <textarea
                  rows={8}
                  required
                  placeholder="Paste the target job description or detailed recruiter specifications here to execute alignment scans."
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  className="w-full text-xs font-medium border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white dark:bg-slate-950 text-gray-900 dark:text-slate-100 leading-relaxed"
                />
              </div>

              {/* Submission Button */}
              <button
                type="submit"
                disabled={isMatching || !jobTitle.trim() || !jobDescription.trim()}
                className="w-full bg-indigo-650 hover:bg-indigo-750 active:scale-[0.98] text-white font-bold text-xs py-3 rounded-lg shadow-md transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:bg-gray-400 dark:disabled:bg-slate-800 disabled:cursor-not-allowed disabled:scale-100"
              >
                {isMatching ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin text-emerald-400" />
                    <span>Gemini Running Neural Matcher...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 text-emerald-400" />
                    <span>Run AI Semantic Match</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right pane: Semantic Match Ratings and ATS Analytics Scores (cols: 7) */}
        <div className="lg:col-span-7 space-y-6">
          {matchResult ? (
            <div className="space-y-6 animate-fade-in text-gray-800 dark:text-slate-100">
              
              {/* Scorecard Box */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-6 shadow-2xs space-y-5">
                <div className="flex justify-between items-center border-b border-gray-100 dark:border-slate-850 pb-3">
                  <div className="flex items-center space-x-2">
                    <Trophy className="h-5 w-5 text-indigo-600" />
                    <h3 className="font-bold text-sm text-gray-800 dark:text-slate-200 uppercase tracking-tight">AI Semantic Fit Scorecard</h3>
                  </div>
                  {matchResult._demo && (
                    <span className="text-[10px] bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 rounded-full px-2.5 py-0.5 font-mono select-none">
                      PREVIEW ANALYSIS
                    </span>
                  )}
                </div>

                {/* Score Circular Rings row mimicking premium recruitment tools */}
                <div className="grid grid-cols-3 gap-4">
                  {/* Circle 1 */}
                  <div className={`p-3 rounded-xl border text-center ${getRatingColor(matchResult.overallScore)}`}>
                    <p className="text-[10px] font-mono tracking-wider mb-2 uppercase opacity-85">Semantic Match</p>
                    <div className="text-3xl font-extrabold flex items-baseline justify-center">
                      <span>{matchResult.overallScore}</span>
                      <span className="text-sm font-semibold opacity-70">%</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono font-bold tracking-tight mt-1 opacity-90">
                      Overall Alignment
                    </div>
                  </div>

                  {/* Circle 2 */}
                  <div className={`p-3 rounded-xl border text-center ${getRatingColor(matchResult.atsScore)}`}>
                    <p className="text-[10px] font-mono tracking-wider mb-2 uppercase opacity-85">ATS Keyword</p>
                    <div className="text-3xl font-extrabold flex items-baseline justify-center">
                      <span>{matchResult.atsScore}</span>
                      <span className="text-sm font-semibold opacity-70">%</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono font-bold tracking-tight mt-1 opacity-90">
                      Parse Engine Compliant
                    </div>
                  </div>

                  {/* Circle 3 */}
                  <div className={`p-3 rounded-xl border text-center ${getRatingColor(matchResult.semanticScore)}`}>
                    <p className="text-[10px] font-mono tracking-wider mb-2 uppercase opacity-85">Dossier Suitability</p>
                    <div className="text-3xl font-extrabold flex items-baseline justify-center">
                      <span>{matchResult.semanticScore}</span>
                      <span className="text-sm font-semibold opacity-70">%</span>
                    </div>
                    <div className="text-[9px] uppercase font-mono font-bold tracking-tight mt-1 opacity-90">
                      Seniority Match
                    </div>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-xs text-gray-500 select-none">
                    <span>AILS Suitability Scale Rating</span>
                    <span className="font-mono font-bold text-gray-700 dark:text-slate-300">{matchResult.overallScore >= 85 ? "Excellent Match Profile" : matchResult.overallScore >= 70 ? "Competent Alignment" : "Revision Advised"}</span>
                  </div>
                  <div className="h-2.5 w-full bg-gray-100 dark:bg-slate-850 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${getPercentageBarClass(matchResult.overallScore)}`}
                      style={{ width: `${matchResult.overallScore}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Semantic Analysis & Deep Assessment */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-6 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-gray-100 dark:border-slate-850">
                  <Activity className="h-4 w-4 text-indigo-650" />
                  <span>Semantic suitability assessment</span>
                </h4>
                
                <p className="text-xs text-gray-500 dark:text-slate-400 font-mono leading-relaxed bg-slate-50 dark:bg-slate-950 p-3 rounded-lg border border-slate-100 dark:border-slate-850">
                  {matchResult.tailoredSummary}
                </p>

                <div className="text-xs leading-relaxed text-gray-705 dark:text-slate-300 space-y-3 prose dark:prose-invert">
                  <div className="whitespace-pre-wrap">{matchResult.semanticReasoning}</div>
                </div>
              </div>

              {/* ATS Keyword density lists */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Present Matchers */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-gray-150 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center space-x-1">
                    <CheckCircle className="h-4 w-4 shrink-0" />
                    <span>Identified Matchers ({matchResult.matchingKeywords.length})</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    These key parameters were successfully matched within your application CV texts.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.matchingKeywords.map((kw, idx) => (
                      <span key={idx} className="inline-flex items-center space-x-1 text-[10px] font-mono bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/60 px-2.5 py-0.5 rounded-md font-medium select-none">
                        <span>✔</span>
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing Keywords */}
                <div className="bg-slate-50 dark:bg-slate-900/40 rounded-xl p-5 border border-gray-150 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center space-x-1">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Keyword Gaps ({matchResult.missingKeywords.length})</span>
                  </h4>
                  <p className="text-[10px] text-gray-400 leading-normal">
                    Insert these key phrases into your dossier coordinates to elevate your automatic robot alignment ranking.
                  </p>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {matchResult.missingKeywords.map((kw, idx) => (
                      <span key={idx} className="inline-flex items-center space-x-1 text-[10px] font-mono bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-100 dark:border-amber-900/60 px-2.5 py-0.5 rounded-md font-medium select-none">
                        <span>⚠</span>
                        <span>{kw}</span>
                      </span>
                    ))}
                  </div>
                </div>

              </div>

              {/* Actionable Revisions checklist */}
              <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-6 shadow-2xs space-y-4">
                <h4 className="text-xs font-bold font-mono text-gray-400 uppercase tracking-wider flex items-center space-x-1.5 pb-2 border-b border-gray-100 dark:border-slate-850">
                  <Lightbulb className="h-4 w-4 text-amber-500" />
                  <span>Actionable Document Optimizations</span>
                </h4>

                <div className="space-y-3 pt-1">
                  {matchResult.actionableRevises.map((revise, i) => (
                    <div key={i} className="flex items-start space-x-3.5 bg-gray-50 dark:bg-slate-950 p-3 rounded-lg border border-gray-100 dark:border-slate-850/60 hover:border-indigo-150 transition-colors">
                      <div className="h-5 w-5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center font-mono text-xs font-bold shrink-0 mt-0.5 border border-amber-200 dark:border-amber-900/60">
                        {i+1}
                      </div>
                      <p className="text-xs text-gray-700 dark:text-slate-300 leading-relaxed font-sans">{revise}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save result action footing */}
              <div className="bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-150 dark:border-indigo-900 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3.5 sm:space-y-0 shadow-3xs">
                <div>
                  <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-300">Synchronize Alignment Ratings</h4>
                  <p className="text-[11px] text-indigo-700 dark:text-indigo-400 leading-normal mt-0.5 max-w-md">
                    Apply this calculated {matchResult.overallScore}% score rate to your pipeline tracking list to highlight suitability metrics across boards.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  {saveSuccessMessage && (
                    <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-150 dark:border-emerald-900 py-1 px-3.5 rounded-lg mr-2 leading-tight">
                      {saveSuccessMessage}
                    </span>
                  )}
                  <button
                    onClick={handleSaveResultToApplication}
                    disabled={isSavingToApp}
                    className="bg-indigo-600 hover:bg-indigo-705 text-white py-2 px-5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center space-x-2 cursor-pointer disabled:scale-100 disabled:opacity-50"
                  >
                    {isSavingToApp ? (
                      <>
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        <span>Applying Score...</span>
                      </>
                    ) : (
                      <>
                        <Save className="h-3.5 w-3.5" />
                        <span>{selectedAppId === "custom" ? "Track as New Position" : "Sync Scorecard to Tracker"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="h-full bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-8 flex flex-col items-center justify-center text-center text-gray-500 space-y-4 shadow-3xs min-h-[460px]">
              <div className="bg-indigo-50 dark:bg-indigo-950/50 p-4 rounded-full text-indigo-500 dark:text-indigo-400">
                <Sparkles className="h-8 w-8 animate-pulse" />
              </div>
              <div className="space-y-1.5 max-w-md">
                <h3 className="font-bold text-gray-800 dark:text-slate-200">Assessment Standby</h3>
                <p className="text-xs text-gray-400 dark:text-slate-500 leading-normal">
                  Configure your Job Designation Title, Target Resume, and company Job description in the left editor, then execute parsing to view overall matches, keywords list, and compliance recommendations.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
