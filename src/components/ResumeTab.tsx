import React, { useState, useEffect } from "react";
import { UserProfile, ResumeAnalysis } from "../types";
import { Save, Sparkles, AlertCircle, CheckCircle2, FileText, TrendingUp, HelpCircle, Activity, Lightbulb, User, Upload, FileCheck, RefreshCw, History, X } from "lucide-react";

interface ResumeTabProps {
  userProfile: UserProfile;
  setUserProfile: React.Dispatch<React.SetStateAction<UserProfile>>;
  onRefreshProfile: () => void;
  secureFetch: (url: string, options?: RequestInit) => Promise<Response>;
  authToken: string | null;
}

interface HistoricUpload {
  id: string;
  filename: string;
  uploadedAt: string;
  fileSize: number;
  mimeType: string;
}

export default function ResumeTab({
  userProfile,
  setUserProfile,
  onRefreshProfile,
  secureFetch,
  authToken
}: ResumeTabProps) {
  const [targetKeywords, setTargetKeywords] = useState("Full Stack Engineer, Next.js, FastAPI, Node.js");
  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [isAuditing, setIsAuditing] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [skillsInput, setSkillsInput] = useState("");

  // File Upload states
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [uploadHistory, setUploadHistory] = useState<HistoricUpload[]>([]);

  // Load history on boot
  useEffect(() => {
    fetchUploadHistory();
  }, [authToken]);

  const fetchUploadHistory = async () => {
    try {
      const res = await secureFetch("/api/resume/list");
      if (res.ok) {
        const data = await res.json();
        setUploadHistory(data);
      }
    } catch (err) {
      console.warn("Failed loading resume dossiers", err);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const response = await secureFetch("/api/profile", {
        method: "POST",
        body: JSON.stringify(userProfile)
      });
      if (response.ok) {
        onRefreshProfile();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setTimeout(() => setIsSavingProfile(false), 800);
    }
  };

  const handleExecuteAudit = async () => {
    setIsAuditing(true);
    try {
      const response = await secureFetch("/api/resume/analyze", {
        method: "POST",
        body: JSON.stringify({
          resumeText: userProfile.resumeText,
          targetKeywords: targetKeywords
        })
      });
      if (response.ok) {
        const data = await response.json();
        setAnalysis(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsAuditing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await uploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await uploadFile(e.target.files[0]);
    }
  };

  const uploadFile = async (file: File) => {
    setUploadError(null);
    setUploadSuccess(null);
    setUploadLoading(true);

    const formData = new FormData();
    formData.append("resume", file);

    try {
      // Dynamic header mapping to prevent server boundaries clashes
      const headers = {} as Record<string, string>;
      if (authToken) {
        headers["Authorization"] = `Bearer ${authToken}`;
      } else {
        headers["x-user-id"] = "user-default";
      }

      const res = await fetch("/api/resume/upload", {
        method: "POST",
        headers,
        body: formData
      });

      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(`"${file.name}" uploaded, parsed with OCR and synced seamlessly!`);
        setUserProfile(prev => ({
          ...prev,
          resumeText: data.extractedText
        }));
        await fetchUploadHistory();
        onRefreshProfile();
      } else {
        setUploadError(data.error || "Document uploading failed.");
      }
    } catch (err) {
      setUploadError("Gateway communication timeout. Check file system constraints.");
    } finally {
      setUploadLoading(false);
    }
  };

  const addSkillTag = () => {
    if (skillsInput.trim() && !userProfile.skills.includes(skillsInput.trim())) {
      const updatedSkills = [...userProfile.skills, skillsInput.trim()];
      setUserProfile({ ...userProfile, skills: updatedSkills });
      setSkillsInput("");
    }
  };

  const removeSkillsTag = (sk: string) => {
    setUserProfile({
      ...userProfile,
      skills: userProfile.skills.filter(s => s !== sk)
    });
  };

  return (
    <div id="resume-tab-container" className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      
      {/* Left Columns (3 cols): Resume & Profile Data Fields */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Dynamic Drag-and-Drop file uploader */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-5 shadow-2xs">
          <div className="flex items-center space-x-2.5 mb-3">
            <div className="bg-indigo-50 dark:bg-indigo-950/40 p-1.5 rounded-lg text-indigo-600">
              <Upload className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Resume Storage Manager</h3>
              <p className="text-sm font-bold text-gray-950 dark:text-slate-100">Upload PDF or Document Templates</p>
            </div>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-6 text-center transition-all cursor-pointer select-none flex flex-col items-center justify-center space-y-2 py-8 ${
              dragActive 
                ? "border-indigo-500 bg-indigo-50/20" 
                : "border-gray-200 dark:border-slate-850 hover:border-gray-300 dark:hover:border-slate-800 bg-gray-50/40 dark:bg-slate-950/10"
            }`}
          >
            <input
              type="file"
              id="resume-file-input"
              className="hidden"
              onChange={handleFileInput}
              accept=".pdf,.txt,.docx,.doc"
            />
            
            <label htmlFor="resume-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-2">
              <div className="bg-indigo-600 p-3 rounded-full text-white shadow-sm inline-flex items-center justify-center">
                {uploadLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Upload className="h-5 w-5" />
                )}
              </div>
              <div>
                <p className="text-xs font-bold text-gray-800 dark:text-slate-200">
                  {uploadLoading ? "Reading document with OCR..." : "Drag & Drop Resume attachment here"}
                </p>
                <p className="text-[10px] text-gray-400 dark:text-slate-500 font-mono mt-1">
                  Supported formats: PDF, TXT, DOCX up to 10MB
                </p>
              </div>
            </label>
          </div>

          {uploadError && (
            <div className="bg-rose-950/25 border border-rose-900/60 rounded-lg p-3 text-xs text-rose-500 font-mono flex items-start space-x-2 mt-3 animate-fade-in">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{uploadError}</span>
            </div>
          )}

          {uploadSuccess && (
            <div className="bg-emerald-900/25 border border-emerald-800/80 rounded-lg p-3 text-xs text-emerald-500 font-mono flex items-start space-x-2 mt-3 animate-fade-in">
              <FileCheck className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{uploadSuccess}</span>
            </div>
          )}
        </div>

        {/* PROFILE CRUNCHER FORM */}
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 overflow-hidden shadow-2xs">
          <div className="bg-gray-50/50 dark:bg-slate-850/80 border-b border-gray-150 dark:border-slate-800 px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-gray-800 dark:text-slate-200">Candidate Professional Dossier</h2>
            </div>
            <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 uppercase tracking-wide">UUID Profile Cache</span>
          </div>

          <form onSubmit={handleSaveProfile} className="p-6 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-650 dark:text-slate-350 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  value={userProfile.name}
                  onChange={(e) => setUserProfile({ ...userProfile, name: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-205 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-905 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-650 dark:text-slate-350 mb-1">Email Coordinates</label>
                <input
                  type="email"
                  value={userProfile.email}
                  disabled
                  title="Registered Account Email"
                  className="w-full text-xs font-semibold border border-gray-150 dark:border-slate-850 rounded-lg p-2.5 bg-gray-50 dark:bg-slate-950/40 text-gray-450 dark:text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-655 dark:text-slate-355 mb-1">Contact Dial Phone</label>
                <input
                  type="text"
                  value={userProfile.phone || ""}
                  onChange={(e) => setUserProfile({ ...userProfile, phone: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-205 dark:border-slate-805 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-905 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-655 dark:text-slate-355 mb-1">Experience Designation Level</label>
                <select
                  value={userProfile.experienceLevel}
                  onChange={(e) => setUserProfile({ ...userProfile, experienceLevel: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-205 dark:border-slate-805 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-905 dark:text-slate-205 focus:outline-none focus:ring-1 focus:ring-indigo-505"
                >
                  <option value="Entry-Level">Entry-Level Associate (0-2 Yrs)</option>
                  <option value="Mid-Level">Mid-Level Engineer (2-5 Yrs)</option>
                  <option value="Senior-Level">Senior Team Specialist (5-8 Yrs)</option>
                  <option value="Executive-Level">Staff / Director Tech Lead (8+ Yrs)</option>
                </select>
              </div>
            </div>

            {/* Social profiles urls */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-350 mb-1">Github URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/yourhandle"
                  value={userProfile.githubUrl || ""}
                  onChange={(e) => setUserProfile({ ...userProfile, githubUrl: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 dark:text-slate-350 mb-1">LinkedIn Profile link</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/yourprofile"
                  value={userProfile.linkedinUrl || ""}
                  onChange={(e) => setUserProfile({ ...userProfile, linkedinUrl: e.target.value })}
                  className="w-full text-xs font-semibold border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            {/* Skills Tags input */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-gray-650 dark:text-slate-350">ATS Indexed Focus Skills</label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="Add skill tag (e.g. Kubernetes)"
                  value={skillsInput}
                  onChange={(e) => setSkillsInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkillTag(); }}}
                  className="flex-1 text-xs border border-gray-200 dark:border-slate-800 rounded-lg px-3 py-2 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-550"
                />
                <button
                  type="button"
                  onClick={addSkillTag}
                  className="bg-indigo-50 text-indigo-600 hover:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-400 font-bold px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Insert Tag
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1.5 min-h-[40px] border border-gray-100 dark:border-slate-800/60 p-2.5 rounded-lg bg-gray-50/20 dark:bg-slate-950/10">
                {userProfile.skills.length === 0 ? (
                  <span className="text-[10px] text-gray-400 font-mono italic">No skills listed yet.</span>
                ) : (
                  userProfile.skills.map((sk) => (
                    <span
                      key={sk}
                      className="inline-flex items-center space-x-1 font-mono text-[9px] bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 px-2 py-0.5 rounded-sm border border-slate-200/50 dark:border-slate-700"
                    >
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => removeSkillsTag(sk)}
                        className="hover:bg-slate-200 text-slate-500 dark:hover:bg-slate-705 rounded px-0.5 cursor-pointer"
                      >
                        <X className="h-2 w-2" />
                      </button>
                    </span>
                  ))
                )}
              </div>
            </div>

            {/* Profile Raw Document Text and parsed indicators */}
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-gray-650 dark:text-slate-350">Raw Resume text value</label>
              <textarea
                rows={12}
                value={userProfile.resumeText}
                onChange={(e) => setUserProfile({ ...userProfile, resumeText: e.target.value })}
                className="w-full text-xs border border-gray-205 dark:border-slate-800 rounded-lg p-3 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 font-mono focus:outline-none focus:ring-1 focus:ring-indigo-505"
                placeholder="Paste your executive parsed highlights or drop PDF document above to register auto-OCR."
              />
            </div>

            {/* Save Form button */}
            <div className="pt-2 border-t border-gray-105 dark:border-slate-800 flex justify-end">
              <button
                type="submit"
                disabled={isSavingProfile}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2.5 px-6 rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer disabled:bg-slate-850"
              >
                {isSavingProfile ? (
                  <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                ) : (
                  <>
                    <Save className="h-4.5 w-4.5" />
                    <span>Save Application Profile Details</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

        {/* Historical Upload dossiers */}
        {uploadHistory.length > 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-5 shadow-2xs">
            <div className="flex items-center space-x-2.5 mb-3 pb-2 border-b border-gray-100 dark:border-slate-800">
              <History className="h-4 w-4 text-indigo-500 animate-pulse" />
              <h4 className="font-bold text-xs text-gray-400 font-mono tracking-wider uppercase">Resume Sync Dossier History</h4>
            </div>
            
            <div className="space-y-2 overflow-y-auto max-h-[180px] pr-2">
              {uploadHistory.map((item) => (
                <div 
                  key={item.id} 
                  className="flex items-center justify-between p-2.5 bg-gray-50 dark:bg-slate-950/60 border border-gray-150 dark:border-slate-850 rounded-lg text-xs"
                >
                  <div className="flex items-center space-x-2">
                    <FileText className="h-4 w-4 text-slate-400 shrink-0" />
                    <div>
                      <p className="font-bold text-gray-900 dark:text-slate-100 truncate max-w-sm">{item.filename}</p>
                      <p className="text-[9px] text-gray-400 font-mono">{(item.fileSize / 1024).toFixed(1)} KB • {item.mimeType}</p>
                    </div>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold font-mono whitespace-nowrap">
                    {new Date(item.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* Right Column (2 cols): Recruiter Auditing Engine Panel */}
      <div className="lg:col-span-2 space-y-6">
        
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-6 shadow-2xs space-y-5">
          <div className="flex items-center space-x-2.5 pb-2.5 border-b border-gray-100 dark:border-slate-800">
            <div className="bg-indigo-50 dark:bg-indigo-950 p-2 rounded-lg text-indigo-600">
              <Sparkles className="h-5 w-5 text-indigo-500 shrink-0" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-400 font-mono tracking-wider uppercase">Scoring Audit Gate</h3>
              <h2 className="text-[15px] font-extrabold text-gray-900 dark:text-slate-100">ATS Scorecard and Evaluator</h2>
            </div>
          </div>

          <p className="text-xs text-gray-550 dark:text-slate-400 leading-relaxed">
            Specify customized search benchmarks below to trigger the Google Gemini model. It evaluates vocabulary alignment, grammatical pacing, skill matrices, and produces actionable recruitment suggestions.
          </p>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-gray-700 dark:text-slate-200">Target Keywords (Filter Benchmarks)</label>
            <input
              type="text"
              value={targetKeywords}
              onChange={(e) => setTargetKeywords(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 dark:border-slate-800 rounded-lg p-2.5 bg-white dark:bg-slate-900 text-gray-900 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. Senior Software Architect, AWS ECS, Microservices"
            />
          </div>

          <button
            onClick={handleExecuteAudit}
            disabled={isAuditing || !userProfile.resumeText.trim()}
            className="w-full bg-indigo-650 hover:bg-indigo-600 disabled:opacity-40 text-indigo-50 dark:text-indigo-100 font-bold text-xs tracking-wider py-3 px-4 rounded-xl shadow-sm hover:shadow active:scale-98 transition-all flex items-center justify-center space-x-2 cursor-pointer border border-indigo-700 bg-indigo-600"
          >
            {isAuditing ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-100" />
                <span>Auditing profile highlights...</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 text-indigo-150" />
                <span>Run Gemini Recruiter Audit</span>
              </>
            )}
          </button>
        </div>

        {/* Audit Response scorecard Display */}
        {analysis ? (
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-gray-150 dark:border-slate-800 p-6 shadow-2xs space-y-5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-gray-800 dark:text-slate-200">ATS Critic Report</span>
              <span className="text-[10px] text-gray-400 dark:text-slate-500 font-mono uppercase tracking-wider">AI Scorecard OK</span>
            </div>

            {/* Score grids */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-center">
                <p className="text-[10px] text-gray-400 font-mono mb-1 uppercase">ATS Parse</p>
                <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{analysis.atsScore}<span className="text-xs text-gray-400 font-normal">/100</span></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-center">
                <p className="text-[10px] text-gray-400 font-mono mb-1 uppercase">Grammar</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{analysis.grammarScore}<span className="text-xs text-gray-400 font-normal">/100</span></p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 p-3 rounded-lg text-center">
                <p className="text-[10px] text-gray-400 font-mono mb-1 uppercase font-semibold">Suitability</p>
                <p className="text-2xl font-bold text-indigo-850 dark:text-indigo-300">{analysis.score}<span className="text-xs text-gray-400 font-normal">/100</span></p>
              </div>
            </div>

            {/* Progress Gauges / Status Bar */}
            <div className="space-y-1 pb-1">
              <div className="flex justify-between text-[11px] text-gray-600 dark:text-slate-400">
                <span>Overall ATS Optimization Threshold</span>
                <span className="font-bold text-gray-900 dark:text-slate-200">{analysis.score}%</span>
              </div>
              <div className="h-2 w-full bg-gray-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${analysis.score >= 80 ? 'bg-emerald-500' : analysis.score >= 70 ? 'bg-indigo-500' : 'bg-amber-500'}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>
            </div>

            {/* Analysis details lists */}
            <div className="space-y-4 text-xs">
              
              {/* Missing Core Keywords */}
              {analysis.missingSkills && analysis.missingSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-800 dark:text-slate-250 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                    <span>Missing Industry Keywords</span>
                  </span>
                  <div className="flex flex-wrap gap-1 p-2 bg-rose-50/50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/65 rounded-lg">
                    {analysis.missingSkills.map((sk) => (
                      <span key={sk} className="font-mono text-[9px] bg-white dark:bg-slate-900 text-rose-700 dark:text-rose-300 border border-rose-100 dark:border-rose-900/80 px-1.5 py-0.5 rounded-sm">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Detected Skills */}
              {analysis.detectedSkills && analysis.detectedSkills.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-800 dark:text-slate-250 flex items-center space-x-1">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    <span>Successfully Loaded Skills ({analysis.detectedSkills.length})</span>
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1.5 border border-gray-100 dark:border-slate-800 rounded-lg">
                    {analysis.detectedSkills.map((sk) => (
                      <span key={sk} className="font-mono text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-100 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900 px-1.5 py-0.5 rounded-sm">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Revelations: Metrics and verb recommendations */}
              {analysis.revelations && analysis.revelations.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-800 dark:text-slate-250 flex items-center space-x-1">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                    <span>Actionable Revision Recommenders</span>
                  </span>
                  <ul className="space-y-1 bg-yellow-50/30 dark:bg-yellow-950/10 p-2.5 rounded-lg border border-yellow-105/50 dark:border-yellow-900/40 text-[11px] leading-relaxed text-gray-600 dark:text-slate-400 list-disc list-inside">
                    {analysis.revelations.map((rec, idx) => (
                      <li key={idx} className="pb-1 last:pb-0">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Critique comments */}
              {analysis.critiques && analysis.critiques.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-gray-800 dark:text-slate-250 flex items-center space-x-1">
                    <User className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                    <span>Recruiter Strategy critique</span>
                  </span>
                  <ul className="space-y-1 text-[11px] leading-relaxed text-gray-650 dark:text-slate-455 p-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-lg list-disc list-inside">
                    {analysis.critiques.map((crit, idx) => (
                      <li key={idx} className="pb-1 last:pb-0">{crit}</li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          </div>
        ) : (
          <div className="bg-gray-50/50 dark:bg-slate-900 rounded-xl border border-dashed border-gray-300 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500 flex flex-col items-center justify-center space-y-2">
            <Activity className="h-8 w-8 text-gray-350" />
            <p className="text-xs font-semibold text-gray-700 dark:text-slate-200">Ready for Recruiter Audit</p>
            <p className="text-[10px] text-gray-400 dark:text-slate-550 max-w-xs leading-relaxed">
              Define target keywords, trigger audit, and receive precise AI critiques.
            </p>
          </div>
        )}

      </div>

    </div>
  );
}
