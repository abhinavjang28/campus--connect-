
export enum Role {
  STUDENT = 'student',
  CLIENT = 'client',
}

export enum ApplicationStatus {
  PENDING = 'Pending',
  SHORTLISTED = 'Shortlisted',
  ACCEPTED = 'Accepted',
  REJECTED = 'Rejected',
}

export enum NotificationType {
  SUCCESS = 'success',
  ERROR = 'error',
  INFO = 'info',
}

export interface AppNotification {
  id: number;
  userId: number;
  message: string;
  type: NotificationType;
  read: boolean;
  createdAt: string;
  metadata?: {
    meetingId?: number;
    testAttemptId?: number;
  };
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: Role;
  password?: string; // Added for authentication
}

export interface Education {
  level: string;
  institute: string;
  board?: string;
  percentage?: number;
  gpa?: number;
  year: number;
}

export interface StudentProfile {
  userId: number;
  major: string;
  education: {
    secondary: Education;
    higherSecondary: Education;
    college: Education;
  };
  skills: string[];
  projects: { name: string; description: string }[];
  workExperience: { role: string; company: string; duration: string }[];
  certifications: string[];
  resumeUrl?: string;
  profilePictureUrl?: string;
  jobAlertsEnabled?: boolean; // New feature
}

export interface ClientProfile {
    userId: number;
    company: string;
}

export interface Post {
  id: number;
  clientId: number;
  company: string;
  title: string;
  type: 'Placement' | 'Club';
  description: string;
  requirements: string[];
  applicationDeadline?: string;
  numberOfSeats?: number;
  minimumCriteria?: {
    gpa?: number;
    secondaryPercentage?: number;
    higherSecondaryPercentage?: number;
  }
}

export interface Application {
  id: number;
  studentId: number;
  postId: number;
  status: ApplicationStatus;
  appliedAt: string;
  testAttemptId?: number;
}

export interface Meeting {
  id: number;
  applicationId: number;
  postId: number;
  clientId: number;
  studentId: number;
  title: string;
  scheduledAt: string; // ISO string
  status: 'Scheduled' | 'InProgress' | 'Completed';
}

// --- New Aptitude Test Interfaces ---

export interface Question {
  id: number;
  testId: number;
  text: string;
  category: string;
  options: string[];
  correctAnswerIndex: number;
}

export interface AptitudeTest {
  id: number;
  postId: number;
  clientId: number;
  title: string;
  durationMinutes: number;
  questions: Question[];
  shortlistingCriteria?: number;
}

export interface TestAttempt {
  id: number;
  testId: number;
  studentId: number;
  status: 'Assigned' | 'InProgress' | 'Completed';
  startedAt?: string;
  completedAt?: string;
  score: number; // Percentage score
  categoryScores: Record<string, { score: number, total: number }>;
  answers: Record<number, number>; // { [questionId]: selectedOptionIndex }
}
