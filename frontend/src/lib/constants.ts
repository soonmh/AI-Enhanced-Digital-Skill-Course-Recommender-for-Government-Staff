export const COMPETENCIES = {
  C1: { code: "C1", weight: 15, maxScore: 75, nameEn: "Digital Literacy", nameMs: "Literasi Digital" },
  C2: { code: "C2", weight: 15, maxScore: 75, nameEn: "Digital Skills", nameMs: "Kemahiran Digital" },
  C3: { code: "C3", weight: 10, maxScore: 50, nameEn: "Communication & Collaboration", nameMs: "Komunikasi & Kolaborasi" },
  C4: { code: "C4", weight: 10, maxScore: 50, nameEn: "Problem-Solving & Critical Thinking", nameMs: "Penyelesaian Masalah & Pemikiran Kritis" },
  C5: { code: "C5", weight: 10, maxScore: 50, nameEn: "Digital Safety & Security", nameMs: "Keselamatan & Sekuriti Digital" },
  C6: { code: "C6", weight: 10, maxScore: 50, nameEn: "Professional Development & Engagement", nameMs: "Pembangunan & Penglibatan Profesional" },
  C7: { code: "C7", weight: 11, maxScore: 55, nameEn: "Digital Transformation & Governance", nameMs: "Transformasi & Tadbir Urus Digital" },
  C8: { code: "C8", weight: 4, maxScore: 20, nameEn: "Digital Creation & Innovation", nameMs: "Penciptaan & Inovasi Digital" },
  C9: { code: "C9", weight: 5, maxScore: 25, nameEn: "Digital Ethics & Inclusion", nameMs: "Etika & Inklusi Digital" },
  C10: { code: "C10", weight: 10, maxScore: 50, nameEn: "Functional Skills & Applications", nameMs: "Kemahiran & Aplikasi Fungsian" },
} as const;

export type CompetencyCode = keyof typeof COMPETENCIES;

export const ROLE_LABELS: Record<string, string> = {
  Admin: "Admin",
  Staff: "Staff",
  "Top Management": "Top Management",
  Trainer: "Trainer",
};

export const PERMISSION_LABELS: Record<string, string> = {
  "user-management": "User Management",
  "course-management": "Course Management",
  "take-assessment": "Take Assessment",
  "user-reporting": "User Reporting",
  "course-reporting": "Course Reporting",
};
