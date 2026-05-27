import React, { useState } from "react";
import { 
  JobApplication 
} from "../types";
import { 
  Briefcase, 
  MapPin, 
  DollarSign, 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  ExternalLink, 
  FileText, 
  Check, 
  Clock, 
  FileCheck, 
  X, 
  ChevronRight, 
  Edit3,
  Calendar
} from "lucide-react";

interface ApplicationsTabProps {
  applications: JobApplication[];
  onAddApplication: (app: Partial<JobApplication>) => void;
  onUpdateApplication: (id: string, updates: Partial<JobApplication>) => void;
  onDeleteApplication: (id: string) => void;
  onSelectAppForLetter: (app: JobApplication) => void;
}

export default function ApplicationsTab({
  applications,
  onAddApplication,
  onUpdateApplication,
  onDeleteApplication,
  onSelectAppForLetter
}: ApplicationsTabProps) {
  // Filters and manual insertion forms states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedNotesApp, setSelectedNotesApp] = useState<JobApplication | null>(null);

  // New application input holding states
  const [newCompany, setNewCompany] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newLocation, setNewLocation] = useState("");
  const [newSalary, setNewSalary] = useState("");
  const [newPortal, setNewPortal] = useState<'LinkedIn' | 'Indeed' | 'Naukri' | 'Manual'>("LinkedIn");
  const [newLink, setNewLink] = useState("");
  const [newMatchRate, setNewMatchRate] = useState(85);
  const [newNotes, setNewNotes] = useState("");

  const handleCreateApp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCompany || !newTitle) return;
    onAddApplication({
      company: newCompany,
      title: newTitle,
      location: newLocation || "Remote",
      salary: newSalary || "Negotiable",
      portal: newPortal,
      link: newLink,
      matchRate: Number(newMatchRate) || 85,
      notes: newNotes,
      status: "saved"
    });
    
    // Clear inputs
    setNewCompany("");
    setNewTitle("");
    setNewLocation("");
    setNewSalary("");
    setNewPortal("LinkedIn");
    setNewLink("");
    setNewMatchRate(85);
    setNewNotes("");
    setShowAddForm(false);
  };

  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.location.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics banner
  const totalApps = applications.length;
  const interviewingApps = applications.filter(a => a.status === 'interviewing').length;
  const appliedApps = applications.filter(a => a.status === 'applied' || a.status === 'interviewing' || a.status === 'offered').length;
  const averageMatchRate = totalApps > 0 
    ? Math.round(applications.reduce((acc, a) => acc + a.matchRate, 0) / totalApps)
    : 0;

  const getMatchStyles = (rate: number) => {
    if (rate >= 90) return { bg: "bg-emerald-50 border-emerald-200 text-emerald-700", fill: "bg-emerald-500" };
    if (rate >= 80) return { bg: "bg-blue-50 border-blue-200 text-blue-700", fill: "bg-blue-500" };
    if (rate >= 70) return { bg: "bg-amber-50 border-amber-200 text-amber-700", fill: "bg-amber-500" };
    return { bg: "bg-gray-50 border-gray-200 text-gray-700", fill: "bg-gray-400" };
  };

  const statusIcons: Record<string, React.ReactNode> = {
    applied: <Clock className="h-3.5 w-3.5 text-blue-500" />,
    interviewing: <Calendar className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />,
    offered: <FileCheck className="h-3.5 w-3.5 text-emerald-500" />,
    rejected: <X className="h-3.5 w-3.5 text-rose-500" />,
    saved: <Check className="h-3.5 w-3.5 text-gray-400" />,
    queued: <Clock className="h-3.5 w-3.5 text-amber-500" />
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards Banner */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Briefcase className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Total Evaluated</p>
            <p className="text-2xl font-bold text-gray-900">{totalApps}</p>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center space-x-4">
          <div className="bg-blue-50 p-3 rounded-xl text-blue-600">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Total Applied</p>
            <p className="text-2xl font-bold text-gray-900">{appliedApps}</p>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center space-x-4">
          <div className="bg-indigo-50 p-3 rounded-xl text-indigo-600">
            <Calendar className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Interviewing</p>
            <p className="text-2xl font-bold text-gray-900 text-indigo-600">{interviewingApps}</p>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-xs flex items-center space-x-4">
          <div className="bg-emerald-50 p-3 rounded-xl text-emerald-600">
            <FileCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-mono uppercase tracking-wider">Average Match Core</p>
            <p className="text-2xl font-bold text-emerald-600">{averageMatchRate}%</p>
          </div>
        </div>
      </div>

      {/* Grid: Search, Filters & Application Main list */}
      <div className="bg-white rounded-2xl border border-gray-150 overflow-hidden">
        {/* Filters Top Bar */}
        <div className="p-4 sm:p-5 border-b border-gray-100 bg-gray-50/50 flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:justify-between items-center gap-3">
          <div className="flex flex-1 w-full sm:w-auto items-center space-x-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="Search jobs, companies, locations..."
                className="pl-9 pr-4 py-2 w-full text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-gray-800"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                id="app-search-input"
              />
            </div>

            {/* Status Filter */}
            <div className="relative">
              <select
                className="appearance-none pl-3 pr-8 py-2 text-sm bg-white border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 text-gray-700 font-medium cursor-pointer"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                id="app-status-filter"
              >
                <option value="all">All Statuses</option>
                <option value="saved">Saved / Evaluated</option>
                <option value="queued">Queued Automation</option>
                <option value="applied">Applied</option>
                <option value="interviewing">Interviewing</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
              <span className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                <Filter className="h-3.5 w-3.5" />
              </span>
            </div>
          </div>

          {/* Add Job Trigger */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm px-4 py-2 rounded-xl shadow-xs transition-colors"
            id="add-app-button"
          >
            <Plus className="h-4 w-4" />
            <span>Manual Track Entry</span>
          </button>
        </div>

        {/* Quick Drawer Input Form - manual entries */}
        {showAddForm && (
          <div className="bg-indigo-50/40 p-5 border-b border-gray-100 transition-all duration-300">
            <h3 className="font-semibold text-gray-900 text-sm mb-4 flex items-center space-x-2">
              <Briefcase className="h-4 w-4 text-indigo-600" />
              <span>Track Standard Application Manually</span>
            </h3>
            <form onSubmit={handleCreateApp} className="grid grid-cols-1 md:grid-cols-3 gap-4" id="add-app-form">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Company Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. OpenAI"
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newCompany}
                  onChange={(e) => setNewCompany(e.target.value)}
                  id="new-company-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Role Designation *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fullstack Engineer"
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  id="new-title-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Location Details</label>
                <input
                  type="text"
                  placeholder="e.g. Remote (SF / New York)"
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  id="new-location-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Annual Compensation</label>
                <input
                  type="text"
                  placeholder="e.g. $140,000 - $170,000"
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newSalary}
                  onChange={(e) => setNewSalary(e.target.value)}
                  id="new-salary-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Lead Capture Source (Portal)</label>
                <select
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-700"
                  value={newPortal}
                  onChange={(e) => setNewPortal(e.target.value as any)}
                  id="new-portal-select"
                >
                  <option value="LinkedIn">LinkedIn Easy Apply</option>
                  <option value="Indeed">Indeed Portal</option>
                  <option value="Naukri">Naukri Careers</option>
                  <option value="Manual">Manual Referral / Website</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Integration Match Score (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 85"
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newMatchRate}
                  onChange={(e) => setNewMatchRate(Number(e.target.value))}
                  id="new-match-rate-input"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Job Link URL</label>
                <input
                  type="url"
                  placeholder="https://careers.openai.com/jobs/..."
                  className="w-full p-2.5 text-sm bg-white border border-gray-200 rounded-lg focus:outline-hidden focus:border-indigo-500 text-gray-800"
                  value={newLink}
                  onChange={(e) => setNewLink(e.target.value)}
                  id="new-link-input"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 mb-1 opacity-0">Actions</label>
                <div className="flex space-x-2">
                  <button
                    type="submit"
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-sm py-2.5 rounded-lg shadow-2xs transition-all"
                  >
                    Save Record
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* Table representation */}
        <div className="overflow-x-auto">
          {filteredApps.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <span className="inline-block bg-gray-50 p-4 rounded-full border border-gray-100 mb-3 text-gray-400">
                <Briefcase className="h-8 w-8" />
              </span>
              <p className="text-sm font-semibold text-gray-700">No applications matched criteria</p>
              <p className="text-xs text-gray-400 mt-1">Try resetting the keyword filter or add a standard profile manual log.</p>
            </div>
          ) : (
            <table className="w-full min-w-[800px] text-left border-collapse" id="applications-data-table">
              <thead>
                <tr className="bg-gray-100/70 border-b border-gray-150 text-[11px] font-mono text-gray-500 tracking-wider">
                  <th className="py-3 px-5">POSITION & COMPANY</th>
                  <th className="py-3 px-5">SOURCE</th>
                  <th className="py-3 px-5 text-center font-mono">ATS MATCH RATE</th>
                  <th className="py-3 px-5">DATE ADDED</th>
                  <th className="py-3 px-5">TRACK STAGE</th>
                  <th className="py-3 px-5 text-right pr-6">INTERACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-sm">
                {filteredApps.map((app) => {
                  const suitability = getMatchStyles(app.matchRate);
                  return (
                    <tr key={app.id} className="hover:bg-gray-50/70 transition-colors">
                      {/* Name & Title */}
                      <td className="py-4 px-5">
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                            {app.title}
                          </p>
                          <div className="flex items-center space-x-3 text-xs text-gray-500 mt-1 font-sans">
                            <span className="font-medium text-indigo-600 bg-indigo-50/50 px-1.5 py-0.5 rounded">
                              {app.company}
                            </span>
                            <span className="flex items-center text-gray-400">
                              <MapPin className="h-3 w-3 mr-1" />
                              {app.location}
                            </span>
                            <span className="flex items-center text-gray-400">
                              <DollarSign className="h-3 w-3 mr-0.5" />
                              {app.salary}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Portal Badge */}
                      <td className="py-4 px-5">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium font-sans border ${
                          app.portal === 'LinkedIn' 
                            ? 'bg-blue-50 border-blue-100 text-blue-700' 
                            : app.portal === 'Indeed' 
                            ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                            : app.portal === 'Naukri'
                            ? 'bg-orange-50 border-orange-100 text-orange-700'
                            : 'bg-indigo-50 border-indigo-100 text-indigo-700'
                        }`}>
                          {app.portal}
                        </span>
                      </td>

                      {/* Suitability Index */}
                      <td className="py-4 px-5 text-center">
                        <div className="inline-flex flex-col items-center">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${suitability.bg}`}>
                            <span className={`h-2 w-2 rounded-full ${suitability.fill}`}></span>
                            {app.matchRate}%
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-4 px-5 text-xs text-gray-500 font-mono">
                        {app.appliedDate}
                      </td>

                      {/* Current Status Form Select */}
                      <td className="py-4 px-5">
                        <div className="relative inline-block w-40">
                          <select
                            className="w-full text-xs font-medium pl-8 pr-2 py-1.5 border border-gray-200 bg-white rounded-lg focus:outline-hidden text-gray-700 cursor-pointer hover:bg-gray-50 transition-colors"
                            value={app.status}
                            onChange={(e) => onUpdateApplication(app.id, { status: e.target.value as any })}
                          >
                            <option value="saved">Saved & Evaluated</option>
                            <option value="queued">Queued Scraper</option>
                            <option value="applied">Applied Submision</option>
                            <option value="interviewing">Interview Stage</option>
                            <option value="offered">Offered Contract</option>
                            <option value="rejected">Rejected Outcome</option>
                          </select>
                          <span className="absolute left-2.5 top-1/2 -translate-y-1/2">
                            {statusIcons[app.status]}
                          </span>
                        </div>
                      </td>

                      {/* Action Triggers */}
                      <td className="py-4 px-4 text-right pr-6">
                        <div className="flex items-center justify-end space-x-2">
                          {/* Run Cover Letter Writer relative to application */}
                          <button
                            onClick={() => onSelectAppForLetter(app)}
                            title="Generate/View Tailored Cover Letter"
                            className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-150"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          {/* Inspect specific Application Notes */}
                          <button
                            onClick={() => setSelectedNotesApp(app)}
                            title="Review Pipeline Notes"
                            className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-150"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          {app.link && (
                            <a
                              href={app.link}
                              target="_blank"
                              referrerPolicy="no-referrer"
                              title="Navigate to Job Source Link"
                              className="p-1.5 text-gray-500 hover:text-indigo-600 bg-gray-100 hover:bg-indigo-50 rounded-lg transition-colors border border-gray-150"
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          )}

                          {/* Delete */}
                          <button
                            onClick={() => onDeleteApplication(app.id)}
                            title="Remove Application from tracking system"
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors border border-transparent"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Slide-out modal dialog for job notes / feedback review */}
      {selectedNotesApp && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl border border-gray-200 w-full max-w-xl shadow-2xl overflow-hidden transition-all transform scale-100">
            <div className="p-5 border-b border-gray-150 flex justify-between items-center bg-gray-50">
              <div>
                <h4 className="font-bold text-gray-950 font-sans text-sm">{selectedNotesApp.company} Notes Room</h4>
                <p className="text-xs text-indigo-600 font-sans font-medium mt-0.5">{selectedNotesApp.title}</p>
              </div>
              <button 
                onClick={() => setSelectedNotesApp(null)}
                className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-mono font-bold text-gray-500 uppercase tracking-widest mb-1">
                  INTERACTIVE LOGS / INTERVIEW PROGRESS NOTES
                </label>
                <textarea
                  className="w-full text-sm p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-hidden focus:border-indigo-500 font-sans text-gray-800"
                  rows={6}
                  value={selectedNotesApp.notes || ""}
                  onChange={(e) => {
                    const updatedNotes = e.target.value;
                    onUpdateApplication(selectedNotesApp.id, { notes: updatedNotes });
                    setSelectedNotesApp({ ...selectedNotesApp, notes: updatedNotes });
                  }}
                  placeholder="Record specific interview links, follow-up timelines, HR contact emails, or technical notes..."
                  id="application-notes-textarea"
                />
              </div>

              <div className="flex bg-amber-50 rounded-lg p-3 text-xs border border-amber-200 text-amber-800 space-x-2">
                <span className="font-bold text-sm">💡</span>
                <p>AIHawk automatically logs Easy Apply logs or answers into this panel to preserve interview continuity during automated runs.</p>
              </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setSelectedNotesApp(null)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-lg"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
