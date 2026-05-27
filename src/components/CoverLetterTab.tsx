import React, { useState } from "react";
import { Sparkles, FileText, Copy, Check, Download, Send, RefreshCw, Layers } from "lucide-react";
import { UserProfile } from "../types";

interface CoverLetterTabProps {
  userProfile: UserProfile;
  onAddCustomApplication: (app: any) => void;
  setActiveTab: (t: string) => void;
  secureFetch?: (url: string, options?: RequestInit) => Promise<Response>;
}

export default function CoverLetterTab({
  userProfile,
  onAddCustomApplication,
  setActiveTab,
  secureFetch
}: CoverLetterTabProps) {
  const [jobTitle, setJobTitle] = useState("Staff Frontend Engineer (React Foundations)");
  const [company, setCompany] = useState("Vercel");
  const [jobDescription, setJobDescription] = useState(`We are looking for a Staff Frontend Engineer to own frontend framework UI layout architectures.
Key requirements:
- 5+ years building highly interactive web dashboards in Next.js & React
- Strong expertise in design tailoring with Tailwind CSS
- Deep technical knowledge of background scraping or state caching pipelines`);
  const [profileOverride, setProfileOverride] = useState(userProfile.resumeText);

  const [generatedLetter, setGeneratedLetter] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isAddedToTracker, setIsAddedToTracker] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setIsAddedToTracker(false);
    try {
      const response = await fetch("/api/generator/cover-letter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          jobTitle,
          company,
          jobDescription,
          profileContext: profileOverride
        })
      });
      if (response.ok) {
        const data = await response.json();
        setGeneratedLetter(data.coverLetter);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedLetter);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveToTracker = () => {
    onAddCustomApplication({
      company,
      title: jobTitle,
      location: "Remote",
      salary: "Unspecified",
      portal: "Manual",
      matchRate: 92,
      status: "saved",
      notes: "Bespoke Cover Letter generated using career analyzer.",
      coverLetter: generatedLetter
    });
    setIsAddedToTracker(true);
    // Switch tab to tracker of applications
    setTimeout(() => {
      setActiveTab("tracker");
    }, 1200);
  };

  return (
    <div id="coverletter-tab-container" className="space-y-6">
      
      {/* Upper description / banner */}
      <div className="bg-gradient-to-r from-indigo-900 to-indigo-800 text-white rounded-xl p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 translate-x-12 translate-y-[-12px] opacity-10">
          <FileText className="h-44 w-44" />
        </div>
        <div className="max-w-2xl relative">
          <h2 className="text-lg font-bold">bespoke Tailored AI Cover Letter Workspace</h2>
          <p className="text-xs text-indigo-200 mt-1 leading-relaxed">
            Standard generic cover letters are discarded immediately by modern automated filtering pools. This workspace pairs your experience timeline directly against corporate descriptions, forming a highly tailored cover letter layout.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left inputs layout (2 cols) */}
        <form onSubmit={handleGenerate} className="lg:col-span-2 space-y-4 bg-white rounded-xl border border-gray-150 p-5 shadow-2xs">
          <h3 className="text-xs font-bold text-gray-700 tracking-wide uppercase font-mono border-b border-gray-100 pb-2">Target Position Metrics</h3>
          
          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Position / Designation Title</label>
            <input
              type="text"
              required
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="e.g. Lead React Developer"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Target Corporate Employer</label>
            <input
              type="text"
              required
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="w-full text-xs font-semibold border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
              placeholder="e.g. OpenAI / Stripe"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 mb-1">Target Job Specification / Summary</label>
            <textarea
              required
              rows={5}
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full text-xs border border-gray-200 rounded-lg p-2.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-gray-800 font-sans leading-relaxed"
              placeholder="Paste specific job post paragraphs to tailor against..."
            />
          </div>

          <div className="pt-2">
            <button
              id="generate-cover-btn"
              type="submit"
              disabled={isGenerating}
              className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] disabled:bg-indigo-300 text-white font-semibold text-xs py-3 rounded-lg shadow-sm transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-200" />
                  <span>Generating Bespoke Letter...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-amber-300 fill-current" />
                  <span>Build Contextual Cover Letter</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Right Output workspace letter preview (3 cols) */}
        <div className="lg:col-span-3">
          {generatedLetter ? (
            <div className="bg-white rounded-xl border border-gray-150 overflow-hidden shadow-md flex flex-col h-full min-h-[500px]">
              
              {/* Header Action menu */}
              <div className="bg-gray-50 border-b border-gray-150 px-5 py-3.5 flex flex-wrap gap-2 items-center justify-between">
                <span className="text-[10px] font-mono tracking-wider text-gray-400 uppercase font-bold flex items-center space-x-1">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  <span>Document Workspace</span>
                </span>

                <div className="flex space-x-2">
                  <button
                    onClick={handleCopy}
                    className="bg-white hover:bg-gray-100 text-gray-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-gray-250 inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {copied ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Copied Context</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5" />
                        <span>Copy Clipboard</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={handleSaveToTracker}
                    disabled={isAddedToTracker}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs py-1.5 px-3 rounded-lg border border-indigo-200 inline-flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    {isAddedToTracker ? (
                      <>
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Saved as Record!</span>
                      </>
                    ) : (
                      <>
                        <Layers className="h-3.5 w-3.5" />
                        <span>File into Tracker</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Physical paper layout */}
              <div className="p-6 flex-1 bg-white font-sans text-xs md:text-sm text-gray-800 leading-relaxed overflow-y-auto whitespace-pre-wrap max-h-[460px] select-text">
                {generatedLetter}
              </div>

              {/* Legal disclaimer */}
              <div className="bg-slate-50 border-t border-gray-100 px-6 py-3 text-[10px] text-gray-400 font-mono text-center">
                AIHawk Core Document Analyzer • Instantly verified matching credentials
              </div>

            </div>
          ) : (
            <div className="bg-gray-50/50 rounded-xl border border-dashed border-gray-300 p-12 text-center text-gray-400 h-full flex flex-col items-center justify-center space-y-3 min-h-[500px]">
              <FileText className="h-10 w-10 text-gray-300" />
              <p className="text-xs font-semibold">Document Workspace Blank</p>
              <p className="text-[10px] text-gray-400 max-w-sm leading-relaxed mx-auto">
                Configure target corporate employer details, and tap the generator button to compile a tailored, persuasive professional letter layout instantly.
              </p>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
