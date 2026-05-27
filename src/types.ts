export interface InterviewStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'completed';
  date?: string;
  notes?: string;
}

export interface JobApplication {
  id: string;
  company: string;
  title: string;
  location: string;
  salary: string;
  status: 'applied' | 'interviewing' | 'offered' | 'rejected' | 'queued' | 'saved';
  matchRate: number; // percentage
  appliedDate: string;
  portal: 'LinkedIn' | 'Indeed' | 'Naukri' | 'Manual';
  link: string;
  coverLetter?: string;
  notes?: string;
  interviewSteps?: InterviewStep[];
}

export interface ResumeAnalysis {
  score: number;
  grammarScore: number;
  atsScore: number;
  detectedSkills: string[];
  missingSkills: string[];
  revelations: string[]; // impact improvements
  critiques: string[]; // specific critique items
}

export interface AutomationLog {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warning' | 'error' | 'agent';
  message: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
}

export interface AIHawkConfig {
  linkedinEnabled: boolean;
  indeedEnabled: boolean;
  naukriEnabled: boolean;
  searchKeywords: string[];
  locations: string[];
  maxDailyApplies: number;
  openaiModel: string;
  enableSeleniumHeadless: boolean;
  autoSolveCaptcha: boolean;
}

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  skills: string[];
  resumeText: string;
  experienceLevel: string; // 'Junior' | 'Mid' | 'Senior' | 'Lead'
  githubUrl: string;
  linkedinUrl: string;
}
