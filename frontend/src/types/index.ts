export interface User {
  id: number;
  name: string;
  email: string;
  working_field?: string;
  job_level?: string;
  experience_years?: string;
  locale?: string;
  permissions?: string[];
  role?: string;
}

export interface DashboardData {
  stats: {
    latest_score: number;
    total_assessments: number;
    average_score: number;
    courses_in_progress: number;
  };
  latestSectionScores?: Record<string, SectionScore>;
  assessmentHistory: AssessmentRecord[];
  courses?: CourseItem[];
}

export interface SectionScore {
  section_code: string;
  section_name: string;
  score: number;
  max_score: number;
  score_percentage: number;
}

export interface AssessmentRecord {
  id: number;
  submitted_at: string;
  dsri: number;
  c1_score: number;
  c2_score: number;
  c3_score: number;
  c4_score: number;
  c5_score: number;
  c6_score: number;
  c7_score: number;
  c8_score: number;
  c9_score: number;
  c10_score: number;
}

export interface AssessmentStartData {
  assessment: {
    id: number;
  };
  sections: AssessmentSection[];
}

export interface AssessmentSection {
  section_code: string;
  section_name: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  options: AssessmentOption[];
}

export interface AssessmentOption {
  value: number;
  label: string;
}

export interface CourseItem {
  id: number;
  title: string;
  level?: string;
  description?: string;
  url?: string;
}

export interface AssessmentResultsData {
  latest: {
    dsri: number;
    submitted_at?: string;
  };
  latestSectionScores?: Record<string, SectionScore>;
  history?: AssessmentRecord[];
  certificate?: {
    id: number;
    verification_code: string;
    maturity_level: number;
    maturity_label_en: string;
    issued_at: string;
    expires_at: string | null;
    is_expired: boolean;
    share_url: string;
  };
}

export interface NotificationItem {
  id: number;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, any> | null;
  read_at: string | null;
  created_at: string;
}

export interface CertificateVerification {
  valid: boolean;
  certificate: {
    id: number;
    type: string;
    dsri_score: number;
    maturity_level: number;
    maturity_code: string;
    maturity_label_en: string;
    maturity_label_ms: string;
    competency_scores: Record<string, number>;
    user_name: string;
    user_field?: string;
    issued_at: string;
    expires_at: string | null;
    is_expired: boolean;
  };
}

export interface BenchmarkData {
  has_data: boolean;
  sample_size: number;
  platform: {
    avg_dsri: number;
    competencies: Record<string, number>;
  };
  department: {
    name: string;
    avg_dsri: number;
    sample_size: number;
    competencies: Record<string, number>;
  } | null;
  percentile: number;
  percentile_label: string;
}
