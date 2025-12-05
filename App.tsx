
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { Role, User, StudentProfile, ClientProfile, Post, Application, ApplicationStatus, Education, AppNotification, NotificationType, Meeting, AptitudeTest, Question, TestAttempt } from './types';
import { BriefcaseIcon, LogoutIcon, UserIcon, PencilIcon, XMarkIcon, PlusCircleIcon, UploadCloudIcon, CalendarDaysIcon, ArrowUpIcon, CheckIcon, ClipboardListIcon, BellIcon, VideoCameraIcon, MicrophoneIcon, MicrophoneSlashIcon, VideoCameraSlashIcon, PhoneXMarkIcon, DocumentTextIcon, EyeIcon, EyeSlashIcon, ArrowRightIcon, UsersIcon, Bars3Icon, CameraIcon, AcademicCapIcon } from './components/Icons';
import { GoogleGenAI } from "@google/genai";

type Page = 'dashboard' | 'applications' | 'profile';

// --- CONSTANTS ---
// Using a reliable Unsplash image of a red brick university building that resembles the theme
const BACKGROUND_IMAGE_URL = "https://images.unsplash.com/photo-1592280771190-3e2e4d50c30f?q=80&w=2000&auto=format&fit=crop";

// --- MOCK DATABASE AND API ---

interface MockDB {
    users: User[];
    studentProfiles: StudentProfile[];
    clientProfiles: ClientProfile[];
    posts: Post[];
    applications: Application[];
    notifications: AppNotification[];
    meetings: Meeting[];
    aptitudeTests: AptitudeTest[];
    testAttempts: TestAttempt[];
}

const INITIAL_DB: MockDB = {
    users: [
        { id: 1, email: 'student@test.com', name: 'Alex Johnson', role: Role.STUDENT, password: 'password' },
        { id: 2, email: 'client@test.com', name: 'Jane Smith', role: Role.CLIENT, password: 'password' },
        { id: 3, email: 'student2@test.com', name: 'Maria Garcia', role: Role.STUDENT, password: 'password' },
    ],
    studentProfiles: [
        {
            userId: 1,
            major: 'Computer Science',
            education: {
                secondary: { level: 'Secondary (10th)', institute: 'City High School', board: 'CBSE', percentage: 92, year: 2018 },
                higherSecondary: { level: 'Higher Secondary (12th)', institute: 'City High School', board: 'CBSE', percentage: 88, year: 2020 },
                college: { level: 'B.Tech', institute: 'State University', gpa: 8.5, year: 2024 }
            },
            skills: ['React', 'Node.js', 'TypeScript', 'Python', 'SQL'],
            projects: [{ name: 'E-commerce Website', description: 'Built a full-stack e-commerce platform using the MERN stack.' }],
            workExperience: [{ role: 'Intern', company: 'Tech Solutions Inc.', duration: '3 months' }],
            certifications: ['Certified React Developer'],
            profilePictureUrl: `https://i.pravatar.cc/150?u=alex`,
            resumeUrl: '#',
            jobAlertsEnabled: true
        },
        {
            userId: 3,
            major: 'Marketing',
            education: {
                secondary: { level: 'Secondary (10th)', institute: 'Marketing High', board: 'ICSE', percentage: 85, year: 2018 },
                higherSecondary: { level: 'Higher Secondary (12th)', institute: 'Marketing High', board: 'ICSE', percentage: 91, year: 2020 },
                college: { level: 'BBA', institute: 'Business College', gpa: 9.1, year: 2024 }
            },
            skills: ['SEO', 'Content Marketing', 'Social Media', 'Google Analytics'],
            projects: [{ name: 'Brand Campaign', description: 'Developed a successful marketing campaign for a local startup.' }],
            workExperience: [],
            certifications: [],
            profilePictureUrl: `https://i.pravatar.cc/150?u=maria`,
            jobAlertsEnabled: true
        }
    ],
    clientProfiles: [
        { userId: 2, company: 'Innovate Corp' }
    ],
    posts: [
        { id: 1, clientId: 2, company: 'Innovate Corp', title: 'Frontend Developer', type: 'Placement', description: 'Looking for a skilled React developer.', requirements: ['React', 'TypeScript'], applicationDeadline: '2025-12-31', numberOfSeats: 5, minimumCriteria: { gpa: 8.0, secondaryPercentage: 80, higherSecondaryPercentage: 80 } },
        { id: 2, clientId: 2, company: 'Innovate Corp', title: 'Marketing Intern', type: 'Placement', description: 'Join our marketing team.', requirements: ['SEO', 'Communication'], applicationDeadline: '2025-11-30', numberOfSeats: 2, minimumCriteria: { gpa: 8.5 } },
        { id: 3, clientId: 2, company: 'Innovate Corp', title: 'Coding Club Lead', type: 'Club', description: 'Lead our college coding club.', requirements: ['Leadership', 'Node.js'] },
    ],
    applications: [
        { id: 1, studentId: 1, postId: 1, status: ApplicationStatus.PENDING, appliedAt: '2024-10-01' },
        { id: 2, studentId: 3, postId: 2, status: ApplicationStatus.PENDING, appliedAt: '2024-10-02' },
    ],
    notifications: [],
    meetings: [],
    aptitudeTests: [],
    testAttempts: [],
};

// Initialize DB from localStorage or use INITIAL_DB
const loadDB = (): MockDB => {
    const stored = localStorage.getItem('mockDB');
    if (stored) {
        return JSON.parse(stored);
    }
    return INITIAL_DB;
};

const saveDB = (db: MockDB) => {
    try {
        localStorage.setItem('mockDB', JSON.stringify(db));
    } catch (e) {
        console.error("Failed to save to localStorage (likely quota exceeded)", e);
        alert("Warning: Local storage is full. Some data (like large files) may not be saved.");
    }
};

const MOCK_DB = loadDB();

const api = {
    login: async (email: string, password: string, role: Role): Promise<User | null> => {
        await new Promise(res => setTimeout(res, 500));
        const user = MOCK_DB.users.find(u => u.email === email && u.role === role && u.password === password);
        if (!user) {
            throw new Error('Invalid credentials. Please check your email, password, and role.');
        }
        return user;
    },
    signup: async (name: string, email: string, password: string, role: Role): Promise<User> => {
        await new Promise(res => setTimeout(res, 500));
        if (MOCK_DB.users.some(u => u.email === email)) {
            throw new Error("User already exists");
        }
        const newUser: User = { id: Date.now(), name, email, role, password };
        MOCK_DB.users.push(newUser);
        
        if (role === Role.STUDENT) {
            MOCK_DB.studentProfiles.push({
                userId: newUser.id,
                major: '', // This signifies an incomplete profile
                education: {
                    secondary: { level: 'Secondary (10th)', institute: '', board: '', percentage: 0, year: 0 },
                    higherSecondary: { level: 'Higher Secondary (12th)', institute: '', board: '', percentage: 0, year: 0 },
                    college: { level: 'College', institute: '', gpa: 0, year: 0 }
                },
                skills: [], projects: [], workExperience: [], certifications: [],
                jobAlertsEnabled: true
            });
        } else if (role === Role.CLIENT) {
            MOCK_DB.clientProfiles.push({ userId: newUser.id, company: 'New Company' });
        }
        saveDB(MOCK_DB);
        return newUser;
    },
    getStudentProfile: async (userId: number): Promise<StudentProfile | null> => {
        await new Promise(res => setTimeout(res, 300));
        return MOCK_DB.studentProfiles.find(p => p.userId === userId) || null;
    },
    updateStudentProfile: async (userId: number, profileData: Partial<StudentProfile>): Promise<StudentProfile> => {
        await new Promise(res => setTimeout(res, 500));
        const profileIndex = MOCK_DB.studentProfiles.findIndex(p => p.userId === userId);
        if (profileIndex === -1) throw new Error("Profile not found");
        MOCK_DB.studentProfiles[profileIndex] = { ...MOCK_DB.studentProfiles[profileIndex], ...profileData };
        saveDB(MOCK_DB);
        return MOCK_DB.studentProfiles[profileIndex];
    },
    getClientProfile: async (userId: number): Promise<ClientProfile | null> => {
        await new Promise(res => setTimeout(res, 300));
        return MOCK_DB.clientProfiles.find(p => p.userId === userId) || null;
    },
    updateClientProfile: async (userId: number, data: Partial<ClientProfile>): Promise<ClientProfile> => {
        await new Promise(res => setTimeout(res, 500));
        const index = MOCK_DB.clientProfiles.findIndex(p => p.userId === userId);
        if (index === -1) throw new Error("Client profile not found");
        MOCK_DB.clientProfiles[index] = { ...MOCK_DB.clientProfiles[index], ...data };
        saveDB(MOCK_DB);
        return MOCK_DB.clientProfiles[index];
    },
    getPosts: async (studentId: number): Promise<(Post & { applied: boolean, seatsLeft?: number })[]> => {
        await new Promise(res => setTimeout(res, 500));
        const studentApplications = MOCK_DB.applications.filter(a => a.studentId === studentId);
        return MOCK_DB.posts.map(post => {
            let seatsLeft: number | undefined = undefined;
            if (post.numberOfSeats) {
                const acceptedCount = MOCK_DB.applications.filter(a => a.postId === post.id && a.status === ApplicationStatus.ACCEPTED).length;
                seatsLeft = post.numberOfSeats - acceptedCount;
            }
            return {
                ...post,
                applied: studentApplications.some(a => a.postId === post.id),
                seatsLeft,
            };
        });
    },
    getStudentApplications: async (studentId: number): Promise<(Application & { post: Post, meeting?: Meeting, testAttempt?: TestAttempt & { test: AptitudeTest } })[]> => {
        await new Promise(res => setTimeout(res, 400));
        const studentApps = MOCK_DB.applications.filter(a => a.studentId === studentId);
        return studentApps.map(app => {
            const post = MOCK_DB.posts.find(p => p.id === app.postId)!;
            const meeting = MOCK_DB.meetings.find(m => m.applicationId === app.id);
            const testAttempt = MOCK_DB.testAttempts.find(ta => ta.id === app.testAttemptId);
            const test = testAttempt ? MOCK_DB.aptitudeTests.find(t => t.id === testAttempt.testId) : undefined;
            return { 
                ...app, 
                post,
                meeting,
                testAttempt: testAttempt && test ? {...testAttempt, test} : undefined
            };
        }).reverse();
    },
    getClientPosts: async (clientId: number): Promise<(Post & { applicantCount: number, seatsLeft?: number })[]> => {
        await new Promise(res => setTimeout(res, 500));
        const clientPosts = MOCK_DB.posts.filter(p => p.clientId === clientId);
        return clientPosts.map(post => {
             let seatsLeft: number | undefined = undefined;
            if (post.numberOfSeats) {
                const acceptedCount = MOCK_DB.applications.filter(a => a.postId === post.id && a.status === ApplicationStatus.ACCEPTED).length;
                seatsLeft = post.numberOfSeats - acceptedCount;
            }
            return {
                ...post,
                applicantCount: MOCK_DB.applications.filter(a => a.postId === post.id).length,
                seatsLeft,
            };
        });
    },
    createPost: async (clientId: number, postData: Omit<Post, 'id' | 'clientId' | 'company'>): Promise<Post> => {
        await new Promise(res => setTimeout(res, 800));
        const clientProfile = MOCK_DB.clientProfiles.find(p => p.userId === clientId);
        if(!clientProfile) throw new Error("Client profile not found");

        const newPost: Post = {
            id: Date.now(),
            clientId,
            company: clientProfile.company,
            ...postData
        };
        MOCK_DB.posts.push(newPost);

        // JOB ALERT LOGIC
        // Notify students whose skills match the requirements if they have enabled alerts
        MOCK_DB.studentProfiles.forEach(profile => {
            if (profile.jobAlertsEnabled !== false) { // Default to true if undefined
                const hasMatchingSkill = newPost.requirements.some(req => 
                    profile.skills.some(skill => skill.toLowerCase().includes(req.toLowerCase()))
                );

                if (hasMatchingSkill) {
                     MOCK_DB.notifications.push({
                        id: Date.now() + Math.random(),
                        userId: profile.userId,
                        message: `New Opportunity Alert: "${newPost.title}" at ${newPost.company} matches your profile!`,
                        type: NotificationType.INFO,
                        read: false,
                        createdAt: new Date().toISOString()
                    });
                }
            }
        });

        saveDB(MOCK_DB);
        return newPost;
    },
    applyForPost: async (studentId: number, postId: number): Promise<Application> => {
        await new Promise(res => setTimeout(res, 500));
        if(MOCK_DB.applications.some(a => a.studentId === studentId && a.postId === postId)) {
            throw new Error("Already applied");
        }
        const newApp: Application = { id: Date.now(), studentId, postId, status: ApplicationStatus.PENDING, appliedAt: new Date().toISOString().split('T')[0] };
        MOCK_DB.applications.push(newApp);
        saveDB(MOCK_DB);
        return newApp;
    },
    getPostWithApplicants: async (postId: number): Promise<(Post & { applicants: (StudentProfile & { name: string, email: string, application: Application & {testAttempt?: TestAttempt, meeting?: Meeting} })[] }) | null> => {
        await new Promise(res => setTimeout(res, 500));
        const post = MOCK_DB.posts.find(p => p.id === postId);
        if (!post) return null;
        const applications = MOCK_DB.applications.filter(a => a.postId === postId);
        const applicants = applications.map(app => {
            const studentProfile = MOCK_DB.studentProfiles.find(sp => sp.userId === app.studentId);
            const user = MOCK_DB.users.find(u => u.id === app.studentId);
            const testAttempt = MOCK_DB.testAttempts.find(ta => ta.id === app.testAttemptId);
            const meeting = MOCK_DB.meetings.find(m => m.applicationId === app.id);
            if (!studentProfile || !user) return null;
            return { ...studentProfile, name: user.name, email: user.email, application: {...app, testAttempt, meeting} };
        }).filter(Boolean) as (StudentProfile & { name: string, email: string, application: Application & {testAttempt?: TestAttempt, meeting?: Meeting} })[];
        return { ...post, applicants };
    },
    updateApplicationStatus: async (applicationId: number, status: ApplicationStatus): Promise<Application> => {
        await new Promise(res => setTimeout(res, 300));
        const appIndex = MOCK_DB.applications.findIndex(a => a.id === applicationId);
        if (appIndex === -1) throw new Error("Application not found");
        
        const application = MOCK_DB.applications[appIndex];
        const post = MOCK_DB.posts.find(p => p.id === application.postId);

        application.status = status;

        let message = `Your application for "${post?.title}" has been updated to: ${status}.`;
        let type = NotificationType.INFO;

        if (status === ApplicationStatus.ACCEPTED) {
            message = `Congratulations! Your application for "${post?.title}" has been accepted. The recruiter may contact you with next steps.`;
            type = NotificationType.SUCCESS;
        } else if (status === ApplicationStatus.REJECTED) {
            message = `Regarding your application for "${post?.title}", the company has decided to move forward with other candidates.`;
        } else if (status === ApplicationStatus.SHORTLISTED) {
            message = `You've been shortlisted for "${post?.title}"! The recruiter may schedule an interview soon.`;
            type = NotificationType.SUCCESS;
        } else if (status === ApplicationStatus.PENDING) {
             message = `Your application status for "${post?.title}" has been reverted to Pending.`;
        }


        const newNotification: AppNotification = {
            id: Date.now(),
            userId: application.studentId,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString(),
        };
        MOCK_DB.notifications.push(newNotification);

        saveDB(MOCK_DB);
        return application;
    },
    getStudentNotifications: async (studentId: number): Promise<AppNotification[]> => {
        await new Promise(res => setTimeout(res, 100));
        return MOCK_DB.notifications.filter(n => n.userId === studentId).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    },
    scheduleMeeting: async (applicationId: number, title: string, scheduledAt: string): Promise<Meeting> => {
        await new Promise(res => setTimeout(res, 500));
        const application = MOCK_DB.applications.find(a => a.id === applicationId);
        if (!application) throw new Error("Application not found");
        const post = MOCK_DB.posts.find(p => p.id === application.postId);
        if (!post) throw new Error("Post not found");

        const newMeeting: Meeting = {
            id: Date.now(),
            applicationId,
            postId: post.id,
            clientId: post.clientId,
            studentId: application.studentId,
            title,
            scheduledAt,
            status: 'Scheduled',
        };
        MOCK_DB.meetings.push(newMeeting);

        const meetingTime = new Date(scheduledAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' });
        const newNotification: AppNotification = {
            id: Date.now() + 1,
            userId: application.studentId,
            message: `New Meeting: "${title}" for ${post.title} is scheduled for ${meetingTime}.`,
            type: NotificationType.INFO,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: { meetingId: newMeeting.id }
        };
        MOCK_DB.notifications.push(newNotification);
        saveDB(MOCK_DB);
        return newMeeting;
    },
    // New Aptitude Test API
    createAptitudeTest: async (testData: Omit<AptitudeTest, 'id' | 'questions'> & { questions: Omit<Question, 'id' | 'testId'>[] }): Promise<AptitudeTest> => {
        await new Promise(res => setTimeout(res, 500));
        const testId = Date.now();
        const newTest: AptitudeTest = {
            ...testData,
            id: testId,
            questions: testData.questions.map((q, i) => ({ ...q, id: Date.now() + i, testId })),
        };
        MOCK_DB.aptitudeTests.push(newTest);
        saveDB(MOCK_DB);
        return newTest;
    },
    getTestForPost: async (postId: number): Promise<AptitudeTest | null> => {
        await new Promise(res => setTimeout(res, 100));
        return MOCK_DB.aptitudeTests.find(t => t.postId === postId) || null;
    },
    assignTestToApplicant: async (applicationId: number, testId: number): Promise<TestAttempt> => {
        await new Promise(res => setTimeout(res, 300));
        const appIndex = MOCK_DB.applications.findIndex(a => a.id === applicationId);
        if (appIndex === -1) throw new Error("Application not found");
        
        const application = MOCK_DB.applications[appIndex];
        const post = MOCK_DB.posts.find(p => p.id === application.postId)!;
        
        const newAttempt: TestAttempt = {
            id: Date.now(),
            testId,
            studentId: application.studentId,
            status: 'Assigned',
            score: 0,
            categoryScores: {},
            answers: {},
        };
        MOCK_DB.testAttempts.push(newAttempt);
        application.testAttemptId = newAttempt.id;

        const newNotification: AppNotification = {
            id: Date.now() + 1,
            userId: application.studentId,
            message: `You have been invited to take an aptitude test for your application to "${post.title}".`,
            type: NotificationType.INFO,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: { testAttemptId: newAttempt.id }
        };
        MOCK_DB.notifications.push(newNotification);

        saveDB(MOCK_DB);
        return newAttempt;
    },
    submitTest: async (attemptId: number, answers: Record<number, number>): Promise<TestAttempt> => {
        await new Promise(res => setTimeout(res, 1000));
        const attempt = MOCK_DB.testAttempts.find(a => a.id === attemptId);
        if (!attempt) throw new Error("Test attempt not found");

        const test = MOCK_DB.aptitudeTests.find(t => t.id === attempt.testId);
        if (!test) throw new Error("Test not found");

        let correctAnswers = 0;
        const categoryScores: Record<string, { score: number, total: number }> = {};
        
        test.questions.forEach(q => {
            if (!categoryScores[q.category]) {
                categoryScores[q.category] = { score: 0, total: 0 };
            }
            categoryScores[q.category].total += 1;

            if (answers[q.id] === q.correctAnswerIndex) {
                correctAnswers++;
                categoryScores[q.category].score += 1;
            }
        });

        attempt.answers = answers;
        attempt.status = 'Completed';
        attempt.completedAt = new Date().toISOString();
        attempt.score = Math.round((correctAnswers / test.questions.length) * 100);
        attempt.categoryScores = categoryScores;

        const post = MOCK_DB.posts.find(p => p.id === test.postId)!;
        const newNotification: AppNotification = {
            id: Date.now(),
            userId: attempt.studentId,
            message: `Your aptitude test for "${post.title}" has been submitted. Your score is ${attempt.score}%.`,
            type: NotificationType.SUCCESS,
            read: false,
            createdAt: new Date().toISOString(),
            metadata: { testAttemptId: attempt.id }
        };
        MOCK_DB.notifications.push(newNotification);

        saveDB(MOCK_DB);
        return attempt;
    },
    recoverPassword: async (email: string): Promise<void> => {
        await new Promise(res => setTimeout(res, 1200));
        // Simulate checking email exists
        const exists = MOCK_DB.users.some(u => u.email === email);
        if(!exists) throw new Error("Email not found");
        // Success
    }
};

// --- AUTHENTICATION ---
// ... (Auth Context remains unchanged)
const AuthContext = React.createContext<{
    user: User | null;
    login: (email: string, password: string, role: Role) => Promise<void>;
    signup: (name: string, email: string, password: string, role: Role) => Promise<void>;
    logout: () => void;
} | null>(null);

const useAuth = () => React.useContext(AuthContext)!;

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(async (email: string, password: string, role: Role) => {
        const loggedInUser = await api.login(email, password, role);
        if (loggedInUser) {
            setUser(loggedInUser);
            localStorage.setItem('user', JSON.stringify(loggedInUser));
        }
    }, []);

    const signup = useCallback(async (name: string, email: string, password: string, role: Role) => {
        const newUser = await api.signup(name, email, password, role);
        setUser(newUser);
        localStorage.setItem('user', JSON.stringify(newUser));
    }, []);

    const logout = useCallback(() => {
        setUser(null);
        localStorage.removeItem('user');
    }, []);

    useEffect(() => {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
    }, []);

    return (
        <AuthContext.Provider value={{ user, login, signup, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// --- NOTIFICATION SYSTEM ---
// ... (Notification Context remains unchanged)
interface Toast extends AppNotification { localId: number }

const NotificationContext = React.createContext<{
  addNotification: (message: string, type: NotificationType) => void;
} | null>(null);

const useNotifier = () => React.useContext(NotificationContext)!;

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addNotification = useCallback((message: string, type: NotificationType) => {
        const newToast: Toast = {
            localId: Date.now(),
            id: 0,
            userId: 0,
            message,
            type,
            read: false,
            createdAt: new Date().toISOString(),
        };
        setToasts(currentToasts => [...currentToasts, newToast]);
        setTimeout(() => {
            setToasts(currentToasts => currentToasts.filter(t => t.localId !== newToast.localId));
        }, 5000);
    }, []);

    return (
        <NotificationContext.Provider value={{ addNotification }}>
            {children}
            <div className="fixed top-4 right-4 z-[100] w-full max-w-sm space-y-2 px-4 sm:px-0">
                {toasts.map(toast => <ToastNotification key={toast.localId} toast={toast} />)}
            </div>
        </NotificationContext.Provider>
    );
};

const ToastNotification: React.FC<{ toast: Toast }> = ({ toast }) => {
    const bgColor = {
        [NotificationType.SUCCESS]: 'bg-green-500',
        [NotificationType.ERROR]: 'bg-red-500',
        [NotificationType.INFO]: 'bg-blue-500',
    }[toast.type];

    return (
        <div className={`flex items-center text-white p-4 rounded-lg shadow-lg animate-fade-in ${bgColor}`}>
            <p className="flex-1 text-sm font-medium">{toast.message}</p>
        </div>
    );
};

// --- PAGES & COMPONENTS ---
// ... (NumberInput, EducationDetailView, EducationEditForm, ProfileDetailSections, StudentProfileModal remain unchanged)
const NumberInput: React.FC<{ value: number | undefined, onChange: (val: number | undefined) => void, className?: string, step?: string, placeholder?: string }> = ({ value, onChange, className, step = "1", placeholder }) => {
    const [localVal, setLocalVal] = useState(value?.toString() ?? '');

    // Sync from parent if values differ numerically
    useEffect(() => {
        const parsedLocal = parseFloat(localVal);
        if (value === undefined && localVal !== '') {
            setLocalVal('');
        } else if (value !== undefined && value !== parsedLocal) {
            setLocalVal(value.toString());
        }
    }, [value, localVal]); 

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const v = e.target.value;
        setLocalVal(v);
        if (v === '') {
            onChange(undefined);
        } else {
            const parsed = parseFloat(v);
            if (!isNaN(parsed)) {
                onChange(parsed);
            }
        }
    };

    return <input type="number" step={step} value={localVal} onChange={handleChange} className={className} placeholder={placeholder}/>;
};

const EducationDetailView: React.FC<{ edu: Education }> = ({ edu }) => {
    if (!edu) return <div className="p-4 text-gray-400 italic">Education details not added.</div>;
    return (
        <div className="p-4 border rounded-md bg-gray-50">
            <p className="font-bold">{edu.level}</p>
            <p>{edu.institute || 'Not provided'}{edu.board && `, ${edu.board}`}</p>
            <p className="text-sm text-gray-600">
                {edu.percentage !== undefined && edu.percentage > 0 && `Percentage: ${edu.percentage}% | `}
                {edu.gpa !== undefined && edu.gpa > 0 && `GPA: ${edu.gpa} | `}
                Year: {edu.year > 0 ? edu.year : 'N/A'}
            </p>
        </div>
    );
};

const EducationEditForm: React.FC<{ 
    data: Education; 
    onChange: (field: keyof Education, value: any) => void;
}> = ({ data, onChange }) => {
    if (!data) return null;
    return (
        <div className="p-4 border rounded-md space-y-3 bg-white">
            <h4 className="font-semibold text-gray-700">{data.level}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Institute</label>
                    <input 
                        type="text" 
                        value={data.institute || ''} 
                        onChange={e => onChange('institute', e.target.value)} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Board/University</label>
                    <input 
                        type="text" 
                        value={data.board || ''} 
                        onChange={e => onChange('board', e.target.value)} 
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Percentage (%)</label>
                    <NumberInput
                        value={data.percentage}
                        onChange={val => onChange('percentage', val)}
                        step="0.01"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">GPA</label>
                    <NumberInput
                        value={data.gpa}
                        onChange={val => onChange('gpa', val)}
                        step="0.1"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700">Year</label>
                    <NumberInput
                        value={data.year}
                        onChange={val => onChange('year', val || 0)}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm focus:border-primary-500 focus:ring-primary-500"
                    />
                </div>
            </div>
        </div>
    );
};

const ProfileDetailSections: React.FC<{ profile: StudentProfile }> = ({ profile }) => (
    <div className="space-y-8">
        <div className="flex justify-between items-center border-b pb-2">
            <h2 className="text-xl font-semibold text-gray-700">Job Alerts</h2>
            <div className="flex items-center">
                 <span className={`text-sm font-medium mr-2 ${profile.jobAlertsEnabled ? 'text-green-600' : 'text-gray-500'}`}>
                     {profile.jobAlertsEnabled ? 'Enabled' : 'Disabled'}
                 </span>
            </div>
        </div>

        {profile.resumeUrl && (
            <div>
                 <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Resume</h2>
                 <div className="flex items-center space-x-4">
                    <a href={profile.resumeUrl} download="resume" target="_blank" rel="noopener noreferrer" className="inline-flex items-center bg-primary-600 text-white px-5 py-2 rounded-md hover:bg-primary-700 transition-transform hover:scale-105 text-sm font-semibold shadow-sm">
                        <DocumentTextIcon className="w-4 h-4 mr-2"/>
                        View / Download Resume
                    </a>
                 </div>
            </div>
        )}

        <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Education</h2>
            <div className="space-y-4">
                {profile.education ? (
                    <>
                        <EducationDetailView edu={profile.education.college} />
                        <EducationDetailView edu={profile.education.higherSecondary} />
                        <EducationDetailView edu={profile.education.secondary} />
                    </>
                ) : <p>Education details missing.</p>}
            </div>
        </div>

        <div>
            <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Skills</h2>
            <div className="flex flex-wrap gap-2">
                {profile.skills.length > 0 ? profile.skills.map(skill => (
                    <span key={skill} className="bg-primary-100 text-primary-800 text-sm font-medium px-3 py-1 rounded-full">{skill}</span>
                )) : <span className="text-gray-500 italic">No skills added yet.</span>}
            </div>
        </div>

        {profile.workExperience.length > 0 && (
             <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Work Experience</h2>
                <div className="space-y-4">
                    {profile.workExperience.map((exp, i) => (
                        <div key={i} className="pl-4 border-l-2 border-primary-200">
                            <p className="font-semibold">{exp.role} at {exp.company}</p>
                            <p className="text-sm text-gray-500">{exp.duration}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {profile.projects.length > 0 && (
            <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Projects</h2>
                <div className="space-y-4">
                    {profile.projects.map((proj, i) => (
                        <div key={i} className="pl-4 border-l-2 border-primary-200">
                            <p className="font-semibold">{proj.name}</p>
                            <p className="text-sm text-gray-600">{proj.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        )}
        
        {profile.certifications.length > 0 && (
             <div>
                <h2 className="text-xl font-semibold mb-4 border-b pb-2 text-gray-700">Certifications</h2>
                <ul className="list-disc list-inside space-y-1">
                    {profile.certifications.map((cert, i) => <li key={i}>{cert}</li>)}
                </ul>
            </div>
        )}
    </div>
);

const StudentProfileModal: React.FC<{ profile: StudentProfile & { name: string, email: string }, onClose: () => void }> = ({ profile, onClose }) => {
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-slide-in-up">
                <div className="flex justify-between items-start p-4 sm:p-6 border-b bg-gray-50">
                    <div className="flex items-center space-x-4">
                        <img src={profile.profilePictureUrl || `https://i.pravatar.cc/150?u=${profile.userId}`} alt={profile.name} className="w-12 h-12 sm:w-16 sm:h-16 rounded-full object-cover border-4 border-white shadow-md" />
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{profile.name}</h2>
                            <p className="text-gray-500 text-xs sm:text-sm flex items-center"><UserIcon className="w-3 h-3 mr-1"/>{profile.email}</p>
                            <p className="text-primary-600 font-medium text-xs sm:text-sm mt-1">{profile.major}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors bg-white rounded-full p-1 shadow-sm"><XMarkIcon className="w-6 h-6" /></button>
                </div>
                
                <div className="p-4 sm:p-6 overflow-y-auto space-y-6 bg-white">
                    <ProfileDetailSections profile={profile} /> 
                </div>

                <div className="p-4 border-t bg-gray-50 flex justify-end">
                    <button onClick={onClose} className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 font-medium transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

// ... (TakeTestModal, StudentDashboard, MyApplicationsPage, CreatePostModal, ClientDashboard, CreateProfilePage, StudentProfilePage remain unchanged)

const TakeTestModal: React.FC<{ testAttempt: TestAttempt & { test: AptitudeTest }, onClose: () => void }> = ({ testAttempt, onClose }) => {
    const [answers, setAnswers] = useState<Record<number, number>>(testAttempt.answers || {});
    const [submitting, setSubmitting] = useState(false);
    const { addNotification } = useNotifier();

    const handleOptionSelect = (questionId: number, optionIndex: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            await api.submitTest(testAttempt.id, answers);
            addNotification("Test submitted successfully!", NotificationType.SUCCESS);
            onClose();
        } catch (e) {
            addNotification("Failed to submit test", NotificationType.ERROR);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b flex justify-between items-center">
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{testAttempt.test.title}</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
                </div>
                <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-8">
                    {testAttempt.test.questions.map((q, idx) => (
                        <div key={q.id} className="space-y-3">
                            <p className="font-medium text-lg text-gray-800">{idx + 1}. {q.text}</p>
                            <div className="space-y-2 pl-4">
                                {q.options.map((opt, optIdx) => (
                                    <label key={optIdx} className="flex items-center space-x-3 cursor-pointer p-2 rounded hover:bg-gray-50">
                                        <input 
                                            type="radio" 
                                            name={`q-${q.id}`} 
                                            checked={answers[q.id] === optIdx}
                                            onChange={() => handleOptionSelect(q.id, optIdx)}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                                        />
                                        <span className="text-gray-700">{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end">
                    <button 
                        onClick={handleSubmit} 
                        disabled={submitting}
                        className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-semibold shadow-sm disabled:opacity-50"
                    >
                        {submitting ? 'Submitting...' : 'Submit Test'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentDashboard: React.FC<{ isProfileComplete: boolean }> = ({ isProfileComplete }) => {
    const { user } = useAuth();
    const [allPosts, setAllPosts] = useState<(Post & { applied: boolean, seatsLeft?: number })[]>([]);
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const { addNotification } = useNotifier();

    const [filterType, setFilterType] = useState<'All' | 'Placement' | 'Club'>('All');
    const [filterCompany, setFilterCompany] = useState('');
    const [filterSkills, setFilterSkills] = useState('');

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const [fetchedPosts, fetchedProfile] = await Promise.all([
                api.getPosts(user.id),
                api.getStudentProfile(user.id)
            ]);
            setAllPosts(fetchedPosts);
            setProfile(fetchedProfile);
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
            addNotification("Failed to load opportunities", NotificationType.ERROR);
        } finally {
            setLoading(false);
        }
    }, [user, addNotification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleApply = async (postId: number) => {
        if (!user) return;
        try {
            await api.applyForPost(user.id, postId);
            addNotification("Application submitted successfully!", NotificationType.SUCCESS);
            await fetchData();
        } catch (error) {
            console.error(error);
            addNotification((error as Error).message, NotificationType.ERROR);
        }
    };

    const getEligibility = (post: Post): { eligible: boolean; reasons: string[] } => {
        if (!profile) return { eligible: true, reasons: [] }; 
        if (!post.minimumCriteria) return { eligible: true, reasons: [] };
    
        const reasons: string[] = [];
        const { gpa, secondaryPercentage, higherSecondaryPercentage } = post.minimumCriteria;
        
        // Safety check if education object is missing (e.g. fresh signup before profile complete)
        if (!profile.education) return { eligible: false, reasons: ["Profile incomplete"] };

        const { college, secondary, higherSecondary } = profile.education;
    
        if (gpa && college && college.gpa !== undefined && college.gpa < gpa) {
            reasons.push(`Your GPA (${college.gpa}) is below the required minimum of ${gpa}.`);
        }
        if (secondaryPercentage && secondary && secondary.percentage !== undefined && secondary.percentage < secondaryPercentage) {
            reasons.push(`Your 10th grade percentage (${secondary.percentage}%) is below the required minimum of ${secondaryPercentage}%.`);
        }
        if (higherSecondaryPercentage && higherSecondary && higherSecondary.percentage !== undefined && higherSecondary.percentage < higherSecondaryPercentage) {
            reasons.push(`Your 12th grade percentage (${higherSecondary.percentage}%) is below the required minimum of ${higherSecondaryPercentage}%.`);
        }
    
        return { eligible: reasons.length === 0, reasons };
    };

    const filteredPosts = useMemo(() => {
        return allPosts.filter(post => {
            if (filterType !== 'All' && post.type !== filterType) {
                return false;
            }
            if (filterCompany && !post.company.toLowerCase().includes(filterCompany.toLowerCase())) {
                return false;
            }
            if (filterSkills && !post.requirements.some(req => req.toLowerCase().includes(filterSkills.toLowerCase()))) {
                return false;
            }
            return true;
        });
    }, [allPosts, filterType, filterCompany, filterSkills]);


    if (loading) {
        return <div className="text-center text-white font-bold text-xl">Loading posts...</div>;
    }

    return (
        <div className="space-y-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 drop-shadow-sm">Available Opportunities</h1>

            <div className="p-4 bg-white/95 backdrop-blur-md rounded-lg shadow-sm space-y-4 sm:space-y-0 sm:flex sm:flex-wrap sm:items-end sm:gap-4 border border-white/50">
                <div className="flex-grow min-w-[150px]">
                    <label htmlFor="filter-type" className="block text-sm font-medium text-gray-700">Type</label>
                    <select id="filter-type" value={filterType} onChange={e => setFilterType(e.target.value as any)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm">
                        <option value="All">All</option>
                        <option value="Placement">Placement</option>
                        <option value="Club">Club</option>
                    </select>
                </div>
                <div className="flex-grow min-w-[200px]">
                    <label htmlFor="filter-company" className="block text-sm font-medium text-gray-700">Company</label>
                    <input type="text" id="filter-company" value={filterCompany} onChange={e => setFilterCompany(e.target.value)} placeholder="Search by company..." className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                </div>
                <div className="flex-grow min-w-[200px]">
                    <label htmlFor="filter-skills" className="block text-sm font-medium text-gray-700">Skills</label>
                    <input type="text" id="filter-skills" value={filterSkills} onChange={e => setFilterSkills(e.target.value)} placeholder="e.g., React, Python" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm sm:text-sm" />
                </div>
            </div>
            
            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map(post => {
                        const { eligible, reasons } = getEligibility(post);
                        const isApplyDisabled = post.applied || !eligible || !isProfileComplete;
                        let buttonTitle = post.applied ? 'You have already applied' : 'Apply for this post';
                        if (!isProfileComplete) {
                            buttonTitle = 'Please complete your profile before applying.';
                        } else if (!eligible) {
                            buttonTitle = reasons.join(' ');
                        }

                        return (
                            <div key={post.id} className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 flex flex-col hover:shadow-xl transition-shadow border border-white/20">
                                <div className="flex-grow">
                                    <div className="flex justify-between items-start">
                                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full mb-2 ${post.type === 'Placement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{post.type}</span>
                                        {post.seatsLeft !== undefined && (
                                            <span className="text-xs font-medium text-gray-600">
                                                {post.seatsLeft > 0 ? `${post.seatsLeft} seats left` : 'No seats left'}
                                            </span>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-bold text-gray-900">{post.title}</h2>
                                    <p className="text-sm font-medium text-gray-600">{post.company}</p>
                                    <p className="text-gray-700 mt-2 text-sm">{post.description}</p>
                                    <div className="mt-4">
                                        <h4 className="font-semibold text-sm">Requirements:</h4>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {post.requirements.map(req => <span key={req} className="bg-gray-200 text-gray-800 text-xs font-mono px-2 py-1 rounded">{req}</span>)}
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-6 flex justify-between items-center">
                                    {post.applicationDeadline && (
                                        <div className="text-xs text-gray-500 flex items-center">
                                            <CalendarDaysIcon className="w-4 h-4 mr-1"/>
                                            Apply by: {post.applicationDeadline}
                                        </div>
                                    )}
                                    <button
                                        onClick={() => handleApply(post.id)}
                                        disabled={isApplyDisabled}
                                        title={buttonTitle}
                                        className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:cursor-not-allowed ${
                                            !eligible || !isProfileComplete
                                                ? 'bg-red-200 text-red-700'
                                                : post.applied
                                                    ? 'bg-gray-300'
                                                    : 'bg-primary-600 text-white hover:bg-primary-700'
                                        }`}
                                    >
                                        {post.applied ? 'Applied' : (eligible ? 'Apply' : 'Not Eligible')}
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
             ) : (
                <div className="text-center py-12 bg-white/80 rounded-lg shadow-sm backdrop-blur-sm">
                    <p className="text-gray-600 font-medium">No opportunities match your criteria.</p>
                    <p className="text-sm text-gray-500 mt-1">Try adjusting your filters.</p>
                </div>
            )}
        </div>
    );
};

const MyApplicationsPage: React.FC<{setActiveMeeting: (meeting: Meeting, withUser: User) => void}> = ({setActiveMeeting}) => {
    const { user } = useAuth();
    const [applications, setApplications] = useState<(Application & { post: Post, meeting?: Meeting, testAttempt?: TestAttempt & { test: AptitudeTest } })[]>([]);
    const [loading, setLoading] = useState(true);
    const [takingTest, setTakingTest] = useState<(TestAttempt & { test: AptitudeTest }) | null>(null);

    const fetchApps = useCallback(async () => {
        if (user) {
            setLoading(true);
            const apps = await api.getStudentApplications(user.id);
            setApplications(apps);
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchApps(); }, [fetchApps]);

    const handleJoinMeeting = (meeting: Meeting) => {
        // Find the recruiter (Client) to pass to the meeting interface
        const clientUser = MOCK_DB.users.find(u => u.id === meeting.clientId);
        if (clientUser) {
            setActiveMeeting(meeting, clientUser);
        }
    }
    
    const statusColor: Record<ApplicationStatus, string> = {
        [ApplicationStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
        [ApplicationStatus.SHORTLISTED]: 'bg-purple-100 text-purple-800',
        [ApplicationStatus.ACCEPTED]: 'bg-green-100 text-green-800',
        [ApplicationStatus.REJECTED]: 'bg-red-100 text-red-800',
    };

    if (loading) return <div>Loading your applications...</div>;

    return (
        <div className="space-y-6">
            {takingTest && <TakeTestModal testAttempt={takingTest} onClose={() => { setTakingTest(null); fetchApps(); }} />}
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 drop-shadow-sm">My Applications</h1>
            <div className="bg-white/95 backdrop-blur-md shadow overflow-hidden sm:rounded-md border border-white/20">
                <ul className="divide-y divide-gray-200">
                    {applications.length > 0 ? applications.map(app => (
                        <li key={app.id} className="px-4 py-4 sm:px-6 hover:bg-gray-50/50">
                           <div className="flex justify-between items-start flex-wrap gap-4">
                                <div>
                                    <p className="text-lg font-medium text-primary-600 truncate">{app.post.title}</p>
                                    <p className="text-sm text-gray-600">{app.post.company}</p>
                                    <p className="text-xs text-gray-400 mt-1">Applied on: {app.appliedAt}</p>
                                </div>
                                <span className={`self-center px-3 py-1 text-sm font-semibold rounded-full ${statusColor[app.status]}`}>
                                    {app.status}
                                </span>
                            </div>
                            {(app.meeting || app.testAttempt) && (
                                <div className="mt-4 p-4 bg-gray-50 rounded-md border border-gray-200 space-y-3">
                                    {app.meeting && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800">Scheduled Meeting:</h4>
                                            <p className="text-sm text-gray-600">{app.meeting.title} - {new Date(app.meeting.scheduledAt).toLocaleString()}</p>
                                            
                                            {app.meeting.status === 'InProgress' ? (
                                                <button 
                                                    onClick={() => handleJoinMeeting(app.meeting!)}
                                                    className="mt-2 text-xs font-semibold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-md flex items-center justify-center space-x-2 shadow-sm"
                                                >
                                                    <VideoCameraIcon className="w-3 h-3" />
                                                    <span>Join Meeting</span>
                                                </button>
                                            ) : (
                                                <span className="inline-block mt-2 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                                                    Status: {app.meeting.status}
                                                </span>
                                            )}
                                        </div>
                                    )}
                                     {app.testAttempt && (
                                        <div>
                                            <h4 className="font-semibold text-gray-800">Aptitude Test:</h4>
                                            {app.testAttempt.status === 'Assigned' && (
                                                <button onClick={() => setTakingTest(app.testAttempt!)} className="mt-2 text-xs font-semibold text-white bg-primary-600 hover:bg-primary-700 px-3 py-1.5 rounded-md flex items-center justify-center space-x-2">
                                                    <DocumentTextIcon className="w-3 h-3" />
                                                    <span>Take Aptitude Test</span>
                                                </button>
                                            )}
                                            {app.testAttempt.status === 'InProgress' && <p className="text-sm text-yellow-600">Test in progress...</p>}
                                            {app.testAttempt.status === 'Completed' && <p className="text-sm text-green-700 font-medium">Test Completed - Score: {app.testAttempt.score}%</p>}
                                        </div>
                                    )}
                                </div>
                            )}
                        </li>
                    )) : (
                        <li className="p-6 text-center text-gray-500">You haven't applied to any opportunities yet.</li>
                    )}
                </ul>
            </div>
        </div>
    );
};

const CreatePostModal: React.FC<{ onClose: () => void, onSuccess: () => void }> = ({ onClose, onSuccess }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifier();
    const [formData, setFormData] = useState<Partial<Post>>({
        title: '',
        type: 'Placement',
        description: '',
        requirements: [],
        numberOfSeats: 1,
        minimumCriteria: { gpa: 0, secondaryPercentage: 0, higherSecondaryPercentage: 0 }
    });
    const [reqInput, setReqInput] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setLoading(true);
        try {
            await api.createPost(user.id, {
                ...formData as any,
                requirements: formData.requirements || [],
            });
            addNotification("Post created successfully", NotificationType.SUCCESS);
            onSuccess();
        } catch (e) {
            addNotification("Failed to create post", NotificationType.ERROR);
        } finally {
            setLoading(false);
        }
    };

    const addRequirement = () => {
        if (reqInput.trim()) {
            setFormData(prev => ({ ...prev, requirements: [...(prev.requirements || []), reqInput.trim()] }));
            setReqInput('');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
                <div className="p-4 sm:p-6 border-b flex justify-between items-center bg-gray-50">
                    <h2 className="text-xl font-bold text-gray-800">Create New Opportunity</h2>
                    <button onClick={onClose}><XMarkIcon className="w-6 h-6 text-gray-500 hover:text-gray-700" /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Title</label>
                            <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Type</label>
                            <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2">
                                <option value="Placement">Placement</option>
                                <option value="Club">Club</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Description</label>
                        <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" rows={3}></textarea>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Requirements</label>
                        <div className="flex gap-2 mt-1">
                            <input type="text" value={reqInput} onChange={e => setReqInput(e.target.value)} className="flex-1 rounded-md border-gray-300 shadow-sm border p-2" placeholder="Add a skill..." />
                            <button type="button" onClick={addRequirement} className="bg-gray-200 px-4 rounded-md hover:bg-gray-300"><PlusCircleIcon/></button>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {formData.requirements?.map((req, i) => (
                                <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full flex items-center">
                                    {req} <button type="button" onClick={() => setFormData(prev => ({...prev, requirements: prev.requirements?.filter((_, idx) => idx !== i)}))} className="ml-1"><XMarkIcon className="w-3 h-3"/></button>
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Number of Seats</label>
                            <NumberInput value={formData.numberOfSeats} onChange={v => setFormData({...formData, numberOfSeats: v})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Application Deadline</label>
                            <input type="date" value={formData.applicationDeadline || ''} onChange={e => setFormData({...formData, applicationDeadline: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" />
                        </div>
                    </div>

                    <div className="border-t pt-4 mt-4">
                        <h4 className="font-medium text-gray-700 mb-2">Minimum Criteria (Optional)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Min GPA</label>
                                <NumberInput step="0.1" value={formData.minimumCriteria?.gpa} onChange={v => setFormData(p => ({...p, minimumCriteria: {...p.minimumCriteria, gpa: v}}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Min 10th %</label>
                                <NumberInput value={formData.minimumCriteria?.secondaryPercentage} onChange={v => setFormData(p => ({...p, minimumCriteria: {...p.minimumCriteria, secondaryPercentage: v}}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500">Min 12th %</label>
                                <NumberInput value={formData.minimumCriteria?.higherSecondaryPercentage} onChange={v => setFormData(p => ({...p, minimumCriteria: {...p.minimumCriteria, higherSecondaryPercentage: v}}))} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2 text-sm" />
                            </div>
                        </div>
                    </div>

                </form>
                <div className="p-4 sm:p-6 border-t bg-gray-50 flex justify-end">
                    <button onClick={handleSubmit} disabled={loading} className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700 font-semibold shadow-sm disabled:opacity-50">
                        {loading ? 'Creating...' : 'Create Post'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const ClientDashboard: React.FC<{ viewApplicants: (postId: number) => void }> = ({ viewApplicants }) => {
    const { user } = useAuth();
    const [posts, setPosts] = useState<(Post & { applicantCount: number, seatsLeft?: number })[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);

    const fetchPosts = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        const data = await api.getClientPosts(user.id);
        setPosts(data);
        setLoading(false);
    }, [user]);

    useEffect(() => { fetchPosts(); }, [fetchPosts]);

    return (
        <div className="space-y-6">
            {isCreating && <CreatePostModal onClose={() => setIsCreating(false)} onSuccess={() => { setIsCreating(false); fetchPosts(); }} />}
            <div className="flex justify-between items-center">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 drop-shadow-sm">Recruitment Dashboard</h1>
                <button onClick={() => setIsCreating(true)} className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 flex items-center shadow-lg transform transition hover:scale-105 text-sm sm:text-base">
                    <PlusCircleIcon className="w-5 h-5 mr-2" /> <span className="hidden sm:inline">Create New Post</span> <span className="sm:hidden">New Post</span>
                </button>
            </div>

            {loading ? <div>Loading...</div> : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {posts.map(post => (
                        <div key={post.id} className="bg-white/95 backdrop-blur-sm rounded-lg shadow-md p-6 border border-white/20 hover:shadow-xl transition-all">
                            <div className="flex justify-between items-start">
                                <h3 className="text-xl font-bold text-gray-900">{post.title}</h3>
                                <span className={`text-xs px-2 py-1 rounded-full ${post.type === 'Placement' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>{post.type}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-2 mb-4 line-clamp-2">{post.description}</p>
                            
                            <div className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 p-3 rounded-md mb-4">
                                <div className="flex items-center">
                                    <UsersIcon className="w-4 h-4 mr-1"/>
                                    <span className="font-semibold">{post.applicantCount}</span> Applicants
                                </div>
                                {post.seatsLeft !== undefined && (
                                    <div className="flex items-center">
                                        <BriefcaseIcon className="w-4 h-4 mr-1"/>
                                        <span className="font-semibold">{post.seatsLeft}</span> Seats Left
                                    </div>
                                )}
                            </div>

                            <button onClick={() => viewApplicants(post.id)} className="w-full text-center text-primary-600 font-medium hover:text-primary-800 border border-primary-200 hover:bg-primary-50 rounded-md py-2 transition-colors">
                                View Applicants & Manage
                            </button>
                        </div>
                    ))}
                </div>
            )}
            {!loading && posts.length === 0 && (
                <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-lg border border-dashed border-gray-300">
                    <p className="text-gray-500">You haven't posted any opportunities yet.</p>
                </div>
            )}
        </div>
    );
};

const CreateProfilePage: React.FC<{ onProfileComplete: () => void }> = ({ onProfileComplete }) => {
    const { user } = useAuth();
    const { addNotification } = useNotifier();
    // Initialize with a minimal structure to avoid null checks on every field access
    const [profile, setProfile] = useState<StudentProfile>({
        userId: user?.id || 0,
        major: '',
        education: {
            secondary: { level: 'Secondary (10th)', institute: '', board: '', percentage: 0, year: 0 },
            higherSecondary: { level: 'Higher Secondary (12th)', institute: '', board: '', percentage: 0, year: 0 },
            college: { level: 'College', institute: '', gpa: 0, year: 0 }
        },
        skills: [],
        projects: [],
        workExperience: [],
        certifications: [],
        jobAlertsEnabled: true
    });
    const [skillInput, setSkillInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [resumeName, setResumeName] = useState<string | null>(null);

    // AI Resume Parser
    const fileInputRef = useRef<HTMLInputElement>(null);
    const profilePicInputRef = useRef<HTMLInputElement>(null);
    const [parsingResume, setParsingResume] = useState(false);

    useEffect(() => {
        if (user) {
            api.getStudentProfile(user.id).then(existing => {
                if (existing && existing.major) { // Check if it's a real profile or just initial
                    setProfile(existing);
                    if (existing.resumeUrl) setResumeName("Current Resume");
                }
            });
        }
    }, [user]);

    const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Check file size (max 2MB) to prevent localStorage quota issues
        if (file.size > 2 * 1024 * 1024) {
             addNotification("File too large. Please upload a resume under 2MB.", NotificationType.ERROR);
             return;
        }

        setResumeName(file.name);

        // Convert file to Data URI to persist the file itself
        const reader = new FileReader();
        reader.onload = async (event) => {
            const dataUrl = event.target?.result as string;
            // 1. Save the file dataUrl to the profile so clients can view/download it
            setProfile(prev => ({ ...prev, resumeUrl: dataUrl }));

            // 2. AI Parsing logic
            if (!process.env.API_KEY) {
                addNotification("Resume uploaded. AI parsing skipped (API Key missing).", NotificationType.INFO);
                return;
            }

            setParsingResume(true);
            try {
                // Get raw base64 for Gemini
                const base64 = dataUrl.split(',')[1];
                const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
                
                const prompt = `Extract the following information from the resume in JSON format:
                - major (string)
                - education (object with keys: secondary, higherSecondary, college. Each containing: institute, board (if applicable), percentage (number), gpa (number), year (number))
                - skills (array of strings)
                - projects (array of objects with name, description)
                - workExperience (array of objects with role, company, duration)
                - certifications (array of strings)
                
                Ensure the JSON structure matches the StudentProfile interface.
                Return ONLY the JSON.`;

                const response = await ai.models.generateContent({
                    model: 'gemini-2.5-flash',
                    contents: {
                        parts: [
                            { text: prompt },
                            {
                                inlineData: {
                                    mimeType: file.type,
                                    data: base64
                                }
                            }
                        ]
                    },
                    config: {
                        responseMimeType: 'application/json'
                    }
                });
                
                const responseText = response.text;
                const jsonMatch = responseText ? responseText.match(/\{[\s\S]*\}/) : null;
                if (jsonMatch) {
                    const parsedData = JSON.parse(jsonMatch[0]);
                    // Merge parsed data with current profile structure
                    setProfile(prev => ({
                        ...prev,
                        ...parsedData,
                        resumeUrl: dataUrl, // Ensure resumeUrl is preserved
                        // Ensure nested objects are merged correctly if AI misses some fields
                        education: {
                            secondary: { ...prev.education.secondary, ...parsedData.education?.secondary },
                            higherSecondary: { ...prev.education.higherSecondary, ...parsedData.education?.higherSecondary },
                            college: { ...prev.education.college, ...parsedData.education?.college }
                        }
                    }));
                    addNotification("Resume parsed successfully!", NotificationType.SUCCESS);
                }
            } catch (error) {
                console.error("Resume parsing error:", error);
                addNotification("Resume uploaded, but auto-fill failed. Please fill details manually.", NotificationType.INFO);
            } finally {
                setParsingResume(false);
            }
        };
        reader.readAsDataURL(file);
    };

    const handleProfilePicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

         if (file.size > 2 * 1024 * 1024) {
             addNotification("Image too large. Please upload under 2MB.", NotificationType.ERROR);
             return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            setProfile(prev => ({ ...prev, profilePictureUrl: dataUrl }));
        };
        reader.readAsDataURL(file);
    };

    const handleSave = async () => {
        if (!user) return;
        if (!profile.major) {
            addNotification("Major is required", NotificationType.ERROR);
            return;
        }
        setLoading(true);
        try {
            await api.updateStudentProfile(user.id, profile);
            addNotification("Profile saved successfully!", NotificationType.SUCCESS);
            onProfileComplete();
        } catch (e) {
            addNotification("Failed to save profile", NotificationType.ERROR);
        } finally {
            setLoading(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
            setProfile(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput('');
        }
    };

    const removeSkill = (skill: string) => {
        setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const updateEducation = (level: keyof typeof profile.education, field: keyof Education, value: any) => {
        setProfile(prev => ({
            ...prev,
            education: {
                ...prev.education,
                [level]: { ...prev.education[level], [field]: value }
            }
        }));
    };

    return (
        <div className="max-w-4xl mx-auto p-4 sm:p-6 bg-white shadow-xl rounded-lg my-10 animate-fade-in">
            <h1 className="text-2xl sm:text-3xl font-bold mb-6 text-gray-800 border-b pb-4">Edit Profile</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                 {/* Resume Section */}
                <div className="p-6 bg-blue-50 border border-blue-100 rounded-lg flex flex-col items-center text-center">
                    <UploadCloudIcon className="w-12 h-12 text-blue-500 mb-2"/>
                    <h3 className="text-lg font-semibold text-blue-900">Resume / CV</h3>
                    <p className="text-sm text-blue-700 mb-4">Upload PDF to auto-fill details & save file.</p>
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        accept=".pdf,.jpg,.jpeg,.png" 
                        className="hidden" 
                        onChange={handleResumeUpload} 
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()} 
                        disabled={parsingResume}
                        className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 font-medium shadow-sm transition-all disabled:bg-blue-400 mb-2"
                    >
                        {parsingResume ? 'Analyzing...' : 'Upload Resume'}
                    </button>
                    {resumeName && <p className="text-xs text-gray-600 truncate max-w-xs">{resumeName}</p>}
                    {profile.resumeUrl && <p className="text-xs text-green-600 font-medium flex items-center mt-1"><CheckIcon className="w-3 h-3 mr-1"/> File Saved</p>}
                </div>

                {/* Profile Picture Section */}
                 <div className="p-6 bg-gray-50 border border-gray-100 rounded-lg flex flex-col items-center text-center">
                    <div className="relative mb-3">
                        <img 
                            src={profile.profilePictureUrl || `https://i.pravatar.cc/150?u=${user?.id}`} 
                            alt="Profile" 
                            className="w-20 h-20 rounded-full object-cover border-4 border-white shadow"
                        />
                        <button 
                            onClick={() => profilePicInputRef.current?.click()}
                            className="absolute bottom-0 right-0 bg-primary-600 text-white p-1 rounded-full hover:bg-primary-700"
                        >
                            <CameraIcon className="w-4 h-4"/>
                        </button>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Profile Picture</h3>
                     <p className="text-sm text-gray-500 mb-4">Click camera icon to change.</p>
                    <input 
                        type="file" 
                        ref={profilePicInputRef} 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleProfilePicUpload} 
                    />
                </div>
            </div>

            <div className="space-y-8">
                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Basic Details</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Major / Branch</label>
                            <input type="text" value={profile.major} onChange={e => setProfile({...profile, major: e.target.value})} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm border p-2" placeholder="e.g. Computer Science" />
                        </div>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Education</h2>
                    <div className="space-y-4">
                        <EducationEditForm data={profile.education.college} onChange={(f, v) => updateEducation('college', f, v)} />
                        <EducationEditForm data={profile.education.higherSecondary} onChange={(f, v) => updateEducation('higherSecondary', f, v)} />
                        <EducationEditForm data={profile.education.secondary} onChange={(f, v) => updateEducation('secondary', f, v)} />
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-semibold mb-4 text-gray-700">Skills</h2>
                    <div className="flex gap-2 mb-2">
                        <input type="text" value={skillInput} onChange={e => setSkillInput(e.target.value)} className="flex-1 rounded-md border-gray-300 shadow-sm border p-2" placeholder="Add a skill (e.g. Java, Leadership)" />
                        <button onClick={addSkill} className="bg-gray-200 px-4 rounded-md hover:bg-gray-300 font-bold text-gray-600"><PlusCircleIcon /></button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {profile.skills.map(skill => (
                            <span key={skill} className="bg-gray-200 text-gray-800 text-sm px-3 py-1 rounded-full flex items-center">
                                {skill} <button onClick={() => removeSkill(skill)} className="ml-2 text-gray-500 hover:text-red-500"><XMarkIcon className="w-4 h-4"/></button>
                            </span>
                        ))}
                    </div>
                </div>

                {/* Projects Section - Simplified for brevity in this fix */}
                <div>
                     <h2 className="text-xl font-semibold mb-4 text-gray-700">Projects</h2>
                     <button className="text-sm text-primary-600 font-medium flex items-center" onClick={() => {
                         const newProject = { name: 'New Project', description: 'Description' };
                         setProfile(prev => ({ ...prev, projects: [...prev.projects, newProject] }));
                     }}><PlusCircleIcon className="w-4 h-4 mr-1"/> Add Project</button>
                     <div className="space-y-4 mt-2">
                         {profile.projects.map((proj, i) => (
                             <div key={i} className="p-4 border rounded-md bg-gray-50">
                                 <input className="block w-full mb-2 p-1 border rounded" value={proj.name} onChange={e => {
                                     const newProjects = [...profile.projects];
                                     newProjects[i].name = e.target.value;
                                     setProfile({...profile, projects: newProjects});
                                 }} />
                                 <textarea className="block w-full p-1 border rounded" value={proj.description} onChange={e => {
                                     const newProjects = [...profile.projects];
                                     newProjects[i].description = e.target.value;
                                     setProfile({...profile, projects: newProjects});
                                 }} />
                             </div>
                         ))}
                     </div>
                </div>

                <div className="flex justify-end pt-6 border-t">
                    <button onClick={handleSave} disabled={loading} className="bg-primary-600 text-white px-8 py-3 rounded-md hover:bg-primary-700 font-bold shadow-md transition-transform transform hover:-translate-y-0.5 disabled:opacity-70">
                        {loading ? 'Saving Profile...' : 'Save & Continue'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentProfilePage: React.FC = () => {
    const { user } = useAuth();
    const [profile, setProfile] = useState<StudentProfile | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    useEffect(() => {
        if (user) {
            api.getStudentProfile(user.id).then(p => {
                if(p) setProfile(p);
            });
        }
    }, [user, isEditing]);

    if (!profile) return <div>Loading...</div>;

    if (isEditing) {
        return <CreateProfilePage onProfileComplete={() => setIsEditing(false)} />;
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                <div className="h-32 bg-primary-600"></div>
                <div className="px-6 pb-6">
                    <div className="flex justify-between items-end -mt-12 mb-6">
                        <img src={profile.profilePictureUrl || `https://i.pravatar.cc/150?u=${user?.id}`} alt="Profile" className="w-24 h-24 rounded-full border-4 border-white shadow-md bg-white object-cover" />
                        <button onClick={() => setIsEditing(true)} className="bg-gray-100 hover:bg-gray-200 text-gray-800 px-4 py-2 rounded-md font-medium text-sm flex items-center shadow-sm">
                            <PencilIcon className="w-4 h-4 mr-2" /> Edit Profile
                        </button>
                    </div>
                    
                    <h1 className="text-3xl font-bold text-gray-900">{user?.name}</h1>
                    <p className="text-gray-600 flex items-center"><UserIcon className="w-4 h-4 mr-1"/> {user?.email}</p>
                    <p className="text-primary-700 font-medium mt-1">{profile.major}</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
                <ProfileDetailSections profile={profile} />
            </div>
        </div>
    );
};

const PostApplicants: React.FC<{ postId: number, backToDashboard: () => void, setActiveMeeting: (meeting: Meeting, withUser: User) => void }> = ({ postId, backToDashboard, setActiveMeeting }) => {
    const { addNotification } = useNotifier();
    const [postData, setPostData] = useState<(Post & { applicants: (StudentProfile & { name: string, email: string, application: Application & {testAttempt?: TestAttempt, meeting?: Meeting} })[] }) | null>(null);
    const [loading, setLoading] = useState(true);
    const [viewingApplicant, setViewingApplicant] = useState<(StudentProfile & { name: string, email: string }) | null>(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await api.getPostWithApplicants(postId);
            setPostData(data);
        } catch (e) {
            addNotification("Failed to load applicants", NotificationType.ERROR);
        } finally {
            setLoading(false);
        }
    }, [postId, addNotification]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleStatusUpdate = async (appId: number, status: ApplicationStatus) => {
        try {
            await api.updateApplicationStatus(appId, status);
            addNotification("Status updated", NotificationType.SUCCESS);
            fetchData();
        } catch (e) {
            addNotification("Failed to update status", NotificationType.ERROR);
        }
    };

    const assignTest = async (appId: number) => {
         try {
            let test = await api.getTestForPost(postId);
            if (!test) {
                 test = await api.createAptitudeTest({
                     postId,
                     clientId: postData?.clientId || 0,
                     title: "General Aptitude Test",
                     durationMinutes: 30,
                     questions: [
                         { text: "What comes next in the sequence: 2, 4, 8, 16...?", category: "Logic", options: ["18", "24", "32", "64"], correctAnswerIndex: 2 },
                         { text: "Which is the largest planet?", category: "GK", options: ["Earth", "Mars", "Jupiter", "Saturn"], correctAnswerIndex: 2 }
                     ]
                 });
            }
            await api.assignTestToApplicant(appId, test.id);
            return true;
        } catch(e) {
            console.error(e);
            return false;
        }
    };

    const handleAssignTest = async (appId: number) => {
        const success = await assignTest(appId);
        if(success) {
             addNotification("Aptitude test assigned", NotificationType.SUCCESS);
             fetchData();
        } else {
             addNotification("Failed to assign test", NotificationType.ERROR);
        }
    };

    const handleBulkAssignTest = async () => {
        if (!postData) return;
        const shortlistedApps = postData.applicants.filter(app => app.application.status === ApplicationStatus.SHORTLISTED && !app.application.testAttempt);
        
        if (shortlistedApps.length === 0) return;

        let successCount = 0;
        for (const app of shortlistedApps) {
            const success = await assignTest(app.application.id);
            if(success) successCount++;
        }
        addNotification(`Assigned test to ${successCount} applicants.`, NotificationType.SUCCESS);
        fetchData();
    };

    const handleScheduleMeeting = async (appId: number, studentName: string) => {
        // For simplicity, schedule for tomorrow at 10 AM
        const date = new Date();
        date.setDate(date.getDate() + 1);
        date.setHours(10, 0, 0, 0);
        try {
            await api.scheduleMeeting(appId, "Interview", date.toISOString());
            addNotification("Meeting scheduled for tomorrow 10 AM", NotificationType.SUCCESS);
            fetchData();
        } catch (e) {
            addNotification("Failed to schedule meeting", NotificationType.ERROR);
        }
    };

    const handleCreateMeetingLink = async (appId: number) => {
        try {
            const date = new Date();
            // Create meeting that starts immediately (In Progress)
            await api.scheduleMeeting(appId, "Quick Meeting", date.toISOString());
            await api.updateApplicationStatus(appId, ApplicationStatus.SHORTLISTED); // Ensure still shortlisted
            // Note: status update above is redundant but safe. scheduleMeeting sets meeting status 'Scheduled'.
            // In a real app we might update meeting status to 'InProgress' immediately.
            addNotification("Instant meeting link generated", NotificationType.SUCCESS);
            fetchData();
        } catch (e) {
            addNotification("Failed to generate meeting link", NotificationType.ERROR);
        }
    };

    if (loading) return <div>Loading applicants...</div>;
    if (!postData) return <div>Post not found</div>;

    const shortlistedCount = postData.applicants.filter(a => a.application.status === ApplicationStatus.SHORTLISTED && !a.application.testAttempt).length;

    return (
        <div className="space-y-6">
            {viewingApplicant && <StudentProfileModal profile={viewingApplicant} onClose={() => setViewingApplicant(null)} />}
            
            <button onClick={backToDashboard} className="flex items-center text-gray-600 hover:text-gray-900 mb-4 bg-white/80 px-3 py-1 rounded-md backdrop-blur-sm shadow-sm transition-colors hover:bg-white">
                 <ArrowUpIcon className="w-4 h-4 transform -rotate-90 mr-1"/> Back to Dashboard
            </button>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                 <h1 className="text-2xl font-bold text-gray-800">Applicants for {postData.title}</h1>
                 <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm font-medium">{postData.applicants.length} Total</span>
            </div>
            
            {/* Bulk Actions Bar */}
            {shortlistedCount > 0 && (
                <div className="bg-purple-50 border border-purple-200 p-4 rounded-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <p className="text-purple-800 font-medium">You have {shortlistedCount} shortlisted candidates ready for testing.</p>
                    <button 
                        onClick={handleBulkAssignTest}
                        className="bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 text-sm font-semibold shadow-sm flex items-center w-full sm:w-auto justify-center"
                    >
                        <DocumentTextIcon className="w-4 h-4 mr-2"/>
                        Assign Test to All Shortlisted
                    </button>
                </div>
            )}

            <div className="bg-white/95 backdrop-blur-md shadow overflow-hidden rounded-lg border border-white/20">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Candidate</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Test Score</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="bg-transparent divide-y divide-gray-200">
                            {postData.applicants.map(app => (
                                <tr key={app.application.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{app.name}</div>
                                        <div className="text-sm text-gray-500">{app.major}</div>
                                        <button onClick={() => setViewingApplicant(app)} className="text-xs text-primary-600 hover:text-primary-800 font-medium hover:underline mt-1 flex items-center">
                                            View Full Profile <ArrowRightIcon className="w-3 h-3 ml-1"/>
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                         <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${app.application.status === ApplicationStatus.PENDING ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${app.application.status === ApplicationStatus.SHORTLISTED ? 'bg-purple-100 text-purple-800' : ''}
                                            ${app.application.status === ApplicationStatus.ACCEPTED ? 'bg-green-100 text-green-800' : ''}
                                            ${app.application.status === ApplicationStatus.REJECTED ? 'bg-red-100 text-red-800' : ''}
                                         `}>
                                            {app.application.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                        {app.application.testAttempt ? (
                                            app.application.testAttempt.status === 'Completed' ? (
                                                <span className="font-semibold text-green-700">{app.application.testAttempt.score}%</span>
                                            ) : 'Pending'
                                        ) : 'Not Assigned'}
                                    </td>
                                    <td className="px-6 py-4 text-sm font-medium min-w-[200px]">
                                        <div className="flex flex-col space-y-2">
                                            {app.application.status === ApplicationStatus.PENDING && (
                                                <div className="flex gap-2">
                                                    <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.SHORTLISTED)} className="text-blue-600 hover:text-blue-900">Shortlist</button>
                                                    <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.REJECTED)} className="text-red-600 hover:text-red-900">Reject</button>
                                                </div>
                                            )}
                                            {app.application.status === ApplicationStatus.SHORTLISTED && (
                                                <>
                                                    <div className="flex gap-2 text-xs">
                                                        {!app.application.testAttempt && <button onClick={() => handleAssignTest(app.application.id)} className="text-purple-600 hover:text-purple-900 font-semibold">Assign Test</button>}
                                                        <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.ACCEPTED)} className="text-green-600 hover:text-green-900 font-semibold">Accept</button>
                                                        <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.REJECTED)} className="text-red-600 hover:text-red-900">Reject</button>
                                                    </div>
                                                    
                                                    {app.application.meeting ? (
                                                        <div className="mt-2 p-2 bg-blue-50 rounded border border-blue-100 text-xs">
                                                            <p className="font-semibold text-blue-800 mb-1">Meeting Link Generated</p>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <input 
                                                                    readOnly 
                                                                    value={`${window.location.origin}/meet/${app.application.meeting.id}`} 
                                                                    className="flex-1 p-1 border rounded bg-white text-gray-600 select-all"
                                                                />
                                                                <button onClick={() => navigator.clipboard.writeText(`${window.location.origin}/meet/${app.application.meeting.id}`)} title="Copy" className="text-blue-600 hover:text-blue-800"><ClipboardListIcon className="w-4 h-4"/></button>
                                                            </div>
                                                            <button 
                                                                onClick={() => setActiveMeeting(app.application.meeting!, {name: app.name} as User)} 
                                                                className="w-full bg-blue-600 text-white py-1.5 rounded hover:bg-blue-700 flex items-center justify-center font-bold shadow-sm"
                                                            >
                                                                <VideoCameraIcon className="w-3 h-3 mr-1"/> Join Now
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button onClick={() => handleCreateMeetingLink(app.application.id)} className="text-left text-xs text-indigo-600 hover:text-indigo-900 font-semibold border border-indigo-200 px-2 py-1.5 rounded bg-indigo-50 hover:bg-indigo-100 text-center shadow-sm w-fit">
                                                            Generate Meeting Link
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                            {app.application.status === ApplicationStatus.ACCEPTED && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-green-500 font-bold flex items-center text-xs"><CheckIcon className="w-4 h-4 mr-1"/> Hired</span>
                                                    <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.SHORTLISTED)} className="text-xs text-gray-500 hover:text-gray-700 underline">Revoke</button>
                                                </div>
                                            )}
                                            {app.application.status === ApplicationStatus.REJECTED && (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-red-500 text-xs">Rejected</span>
                                                    <button onClick={() => handleStatusUpdate(app.application.id, ApplicationStatus.PENDING)} className="text-xs text-blue-600 hover:text-blue-800 underline">Reconsider</button>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                 {postData.applicants.length === 0 && (
                     <div className="p-8 text-center text-gray-500">No applicants for this position yet.</div>
                 )}
            </div>
        </div>
    );
}

// ... [VideoFeed, MeetingInterfaceModal, NotificationBell, ForgotPasswordView, AuthPage remain same]
const VideoFeed: React.FC<{ label: string, isMuted?: boolean }> = ({ label, isMuted }) => (
    <div className="relative bg-gray-800 rounded-lg overflow-hidden h-full border border-gray-700 shadow-inner flex items-center justify-center">
        <div className="flex flex-col items-center justify-center">
            <UserIcon className="w-20 h-20 text-gray-600" />
            <span className="text-gray-500 text-sm mt-2">{label} (Video Off)</span>
        </div>
        <div className="absolute bottom-4 left-4 bg-black/50 px-2 py-1 rounded text-xs text-white backdrop-blur-sm flex items-center">
             {isMuted ? <MicrophoneSlashIcon className="w-3 h-3 text-red-500 mr-1" /> : <MicrophoneIcon className="w-3 h-3 text-green-500 mr-1"/>}
             {label}
        </div>
    </div>
);

const MeetingInterfaceModal: React.FC<{ meeting: Meeting, currentUser: User, withUser: User, onClose: () => void }> = ({ meeting, currentUser, withUser, onClose }) => {
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    return (
        <div className="fixed inset-0 z-[60] bg-gray-900 text-white flex flex-col animate-fade-in">
            <div className="h-14 bg-gray-800 flex items-center justify-between px-4 sm:px-6 border-b border-gray-700">
                <div className="flex items-center space-x-2 truncate">
                    <VideoCameraIcon className="w-5 h-5 text-red-500 flex-shrink-0" />
                    <span className="font-semibold truncate">{meeting.title}</span>
                </div>
                <div className="text-sm text-gray-400 hidden sm:block">00:15:32</div>
            </div>
            
            <div className="flex-1 p-2 sm:p-4 grid grid-cols-1 md:grid-cols-2 gap-2 sm:gap-4 bg-black">
                <VideoFeed label={withUser.name} />
                <div className="relative hidden md:block">
                     <VideoFeed label={`${currentUser.name} (You)`} isMuted={isMuted} />
                </div>
            </div>

            <div className="h-20 bg-gray-800 flex items-center justify-center space-x-4 sm:space-x-6 border-t border-gray-700">
                <button 
                    onClick={() => setIsMuted(!isMuted)} 
                    className={`p-3 sm:p-4 rounded-full transition-colors ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isMuted ? <MicrophoneSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicrophoneIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button 
                    onClick={() => setIsVideoOff(!isVideoOff)}
                    className={`p-3 sm:p-4 rounded-full transition-colors ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    {isVideoOff ? <VideoCameraSlashIcon className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoCameraIcon className="w-5 h-5 sm:w-6 sm:h-6" />}
                </button>
                <button onClick={onClose} className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 px-6 sm:px-8 flex items-center space-x-2">
                    <PhoneXMarkIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span className="font-semibold hidden sm:inline">End Call</span>
                </button>
            </div>
        </div>
    );
};

const NotificationBell: React.FC<{ setActiveMeeting: (meeting: Meeting, withUser: User) => void }> = ({ setActiveMeeting }) => {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<AppNotification[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    
    useEffect(() => {
        if(user) {
            api.getStudentNotifications(user.id).then(setNotifications);
        }
    }, [user, showDropdown]);

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="relative p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700">
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>

            {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 z-50 ring-1 ring-black ring-opacity-5 max-h-96 overflow-y-auto">
                    {notifications.length === 0 ? (
                         <div className="px-4 py-2 text-sm text-gray-500">No notifications</div>
                    ) : (
                        notifications.map(notification => (
                            <div key={notification.id} className={`px-4 py-3 border-b hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                                <p className="text-sm text-gray-900">{notification.message}</p>
                                <p className="text-xs text-gray-500 mt-1">{new Date(notification.createdAt).toLocaleDateString()}</p>
                            </div>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

const ForgotPasswordView: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const [email, setEmail] = useState('');
    const [submitted, setSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            await api.recoverPassword(email);
            setSubmitted(true);
        } catch (e) {
            setError((e as Error).message);
        } finally {
            setLoading(false);
        }
    };

    if (submitted) {
        return (
            <div className="text-center animate-fade-in">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                    <CheckIcon className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg leading-6 font-medium text-gray-900">Check your email</h3>
                <p className="mt-2 text-sm text-gray-500">We sent a password reset link to {email}.</p>
                <div className="mt-6">
                    <button onClick={onBack} className="text-primary-600 hover:text-primary-500 font-medium text-sm">
                        Back to Login
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-fade-in">
            <h2 className="text-3xl font-bold text-center mb-4 text-gray-800">Reset Password</h2>
            <p className="text-center text-gray-500 mb-8 text-sm">Enter your email and we'll send you a link to get back into your account.</p>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700">Email Address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border" required />
                </div>
                {error && <p className="text-red-500 text-sm">{error}</p>}
                <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 font-medium transition-colors shadow-sm disabled:opacity-70">
                    {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
                <div className="text-center">
                    <button type="button" onClick={onBack} className="text-sm text-gray-600 hover:text-gray-900">
                        Cancel
                    </button>
                </div>
            </form>
        </div>
    );
};

const AuthPage: React.FC<{ initialMode: 'login' | 'signup', closeAuth: () => void }> = ({ initialMode, closeAuth }) => {
     const { login, signup } = useAuth();
     const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>(initialMode);
     const [role, setRole] = useState<Role>(Role.STUDENT);
     const [email, setEmail] = useState('');
     const [password, setPassword] = useState('');
     const [name, setName] = useState('');
     const [error, setError] = useState('');
     const [loading, setLoading] = useState(false);
     const [showPassword, setShowPassword] = useState(false);

     const handleSubmit = async (e: React.FormEvent) => {
         e.preventDefault();
         setError('');
         setLoading(true);
         try {
             if (mode === 'login') {
                 await login(email, password, role);
             } else {
                 await signup(name, email, password, role);
             }
             closeAuth();
         } catch (err) {
             setError((err as Error).message);
         } finally {
             setLoading(false);
         }
     };

     return (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
             <div className="bg-white rounded-lg shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
                 <button onClick={closeAuth} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                     <XMarkIcon className="w-6 h-6" />
                 </button>
                 
                 {mode === 'forgot' ? (
                     <ForgotPasswordView onBack={() => setMode('login')} />
                 ) : (
                     <>
                        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-8 text-gray-800">{mode === 'login' ? 'Welcome Back' : 'Create Account'}</h2>
                        
                        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
                            <button onClick={() => setRole(Role.STUDENT)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === Role.STUDENT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Student</button>
                            <button onClick={() => setRole(Role.CLIENT)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${role === Role.CLIENT ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>Recruiter</button>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {mode === 'signup' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border" required />
                                </div>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Email Address</label>
                                <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Password</label>
                                <div className="relative mt-1">
                                    <input 
                                        type={showPassword ? "text" : "password"} 
                                        value={password} 
                                        onChange={e => setPassword(e.target.value)} 
                                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border pr-10" 
                                        required 
                                    />
                                    <button 
                                        type="button" 
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeSlashIcon className="h-5 w-5"/> : <EyeIcon className="h-5 w-5"/>}
                                    </button>
                                </div>
                            </div>
                            
                            {mode === 'login' && (
                                <div className="flex justify-end">
                                    <button type="button" onClick={() => setMode('forgot')} className="text-sm font-medium text-primary-600 hover:text-primary-500">
                                        Forgot Password?
                                    </button>
                                </div>
                            )}

                            {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                            <button type="submit" disabled={loading} className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 font-medium transition-colors shadow-sm disabled:opacity-70">
                                {loading ? 'Processing...' : (mode === 'login' ? 'Login' : 'Sign Up')}
                            </button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-gray-600">{mode === 'login' ? "Don't have an account? " : "Already have an account? "}</span>
                            <button onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError(''); }} className="text-primary-600 font-semibold hover:underline">
                                {mode === 'login' ? 'Sign Up' : 'Login'}
                            </button>
                        </div>
                     </>
                 )}
             </div>
         </div>
     );
};

const AppRouter: React.FC = () => {
    const { user, logout } = useAuth();
    const [page, setPage] = useState<Page>('dashboard');
    const [clientPage, setClientPage] = useState<'dashboard' | 'applicants'>('dashboard');
    const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
    const [studentProfile, setStudentProfile] = useState<StudentProfile | null>(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [activeMeeting, setActiveMeetingState] = useState<{ meeting: Meeting, withUser: User } | null>(null);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const fetchStudentProfile = useCallback(async () => {
        if (user && user.role === Role.STUDENT) {
            setProfileLoading(true);
            const profile = await api.getStudentProfile(user.id);
            setStudentProfile(profile);
            setProfileLoading(false);
        } else {
            setProfileLoading(false);
        }
    }, [user]);

     useEffect(() => {
        fetchStudentProfile();
    }, [user, fetchStudentProfile]);

    if (!user) {
        return <LandingPage />;
    }

    const isProfileComplete = studentProfile ? studentProfile.major !== '' : false;

    const goToApplicants = (postId: number) => {
        setSelectedPostId(postId);
        setClientPage('applicants');
    };
    
    const setActiveMeeting = (meeting: Meeting, withUser: User) => {
        setActiveMeetingState({ meeting, withUser });
    }

    const handleMeetingClose = () => {
        setActiveMeetingState(null);
        // Force refresh of the current view if needed
        if (clientPage === 'applicants') {
            setClientPage('dashboard');
            setTimeout(() => setClientPage('applicants'), 10);
        }
    };

    const studentNav = [
        { name: 'Dashboard', icon: BriefcaseIcon, page: 'dashboard' as Page },
        { name: 'My Applications', icon: ClipboardListIcon, page: 'applications' as Page },
        { name: 'My Profile', icon: UserIcon, page: 'profile' as Page },
    ];
    const clientNav = [
        { name: 'Dashboard', icon: BriefcaseIcon, page: 'dashboard' as Page },
    ];
    const navItems = user.role === Role.STUDENT ? studentNav : clientNav;
    const currentPage = user.role === Role.STUDENT ? page : clientPage;

    const handleNavClick = (pageName: Page) => {
        if (user.role === Role.CLIENT) {
             setClientPage('dashboard');
        } else {
            setPage(pageName);
        }
        setMobileMenuOpen(false);
    }

    const renderPage = () => {
        if (user.role === Role.STUDENT) {
            switch (page) {
                case 'dashboard': return <StudentDashboard isProfileComplete={isProfileComplete || false} />;
                case 'profile': return <StudentProfilePage />;
                case 'applications': return <MyApplicationsPage setActiveMeeting={setActiveMeeting} />;
                default: return <StudentDashboard isProfileComplete={isProfileComplete || false} />;
            }
        }
        if (user.role === Role.CLIENT) {
            switch (clientPage) {
                case 'dashboard': return <ClientDashboard viewApplicants={goToApplicants} />;
                case 'applicants': return selectedPostId ? <PostApplicants postId={selectedPostId} backToDashboard={() => setClientPage('dashboard')} setActiveMeeting={setActiveMeeting} /> : <ClientDashboard viewApplicants={goToApplicants} />;
                default: return <ClientDashboard viewApplicants={goToApplicants} />;
            }
        }
        return null;
    };

    let content;
    if (profileLoading) {
        content = <div className="min-h-screen flex items-center justify-center text-white font-bold text-xl">Loading Profile...</div>;
    } else if (user.role === Role.STUDENT && !isProfileComplete) {
         content = <CreateProfilePage onProfileComplete={fetchStudentProfile} />;
    } else {
         content = renderPage();
    }

    return (
        <div className="min-h-screen relative font-sans text-gray-900">
             {/* Global Background Image with Fixed Position */}
            <div className="fixed inset-0 -z-50">
                <img 
                    src={BACKGROUND_IMAGE_URL} 
                    alt="Background" 
                    className="w-full h-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                 {/* Updated Overlay: bg-red-50/80 for better visibility */}
                <div className="absolute inset-0 bg-red-50/80 backdrop-blur-md"></div> 
            </div>

            {activeMeeting && <MeetingInterfaceModal meeting={activeMeeting.meeting} currentUser={user} withUser={activeMeeting.withUser} onClose={handleMeetingClose} />}
            <header className="bg-white/95 backdrop-blur-md shadow-sm sticky top-0 z-20 border-b border-white/20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center space-x-3">
                            <div className="bg-primary-50 p-2 rounded-lg">
                                <AcademicCapIcon className="w-6 h-6 text-primary-700" />
                            </div>
                            <span className="text-xl font-bold text-primary-700">College Connect</span>
                        </div>
                        
                        {/* Desktop Navigation - Always show for logged in users */}
                        <nav className="hidden sm:flex items-center space-x-2">
                            {navItems.map(item => (
                                <button key={item.name} onClick={() => handleNavClick(item.page)} className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentPage === item.page ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                                    <item.icon className="w-4 h-4" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                        </nav>
                        
                        <div className="flex items-center space-x-4">
                            <span className="text-gray-700 hidden sm:block font-medium text-sm">Welcome, {user?.name}</span>
                            {user.role === Role.STUDENT && isProfileComplete && <NotificationBell setActiveMeeting={setActiveMeeting} />}
                            
                            {/* Mobile Menu Button */}
                            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="sm:hidden p-2 text-gray-500 hover:text-gray-700">
                                {mobileMenuOpen ? <XMarkIcon className="w-6 h-6"/> : <Bars3Icon className="w-6 h-6"/>}
                            </button>

                            <button onClick={logout} className="p-2 rounded-full text-gray-500 hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 hidden sm:block" title="Logout">
                                <LogoutIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile Navigation Dropdown */}
                {mobileMenuOpen && (
                    <div className="sm:hidden bg-white/95 backdrop-blur-md border-t border-gray-200">
                        <div className="px-2 pt-2 pb-3 space-y-1">
                             {navItems.map(item => (
                                <button key={item.name} onClick={() => handleNavClick(item.page)} className={`flex items-center w-full space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${currentPage === item.page ? 'bg-primary-100 text-primary-700' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'}`}>
                                    <item.icon className="w-5 h-5" />
                                    <span>{item.name}</span>
                                </button>
                            ))}
                            <button onClick={logout} className="flex items-center w-full space-x-2 px-3 py-2 rounded-md text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-900">
                                <LogoutIcon className="w-5 h-5" />
                                <span>Logout</span>
                            </button>
                        </div>
                    </div>
                )}
            </header>
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {content}
            </main>
        </div>
    );
};

const LandingPage: React.FC = () => {
    const [authMode, setAuthMode] = useState<'login' | 'signup' | null>(null);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-4 relative isolate overflow-hidden">
             {/* Background Image - JECRC University Theme */}
            <div className="absolute inset-0 -z-20">
                 <img 
                    src={BACKGROUND_IMAGE_URL}
                    alt="JECRC University" 
                    className="h-full w-full object-cover"
                    onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
            </div>
            {/* Gradient Overlay for readability - Matching the Red Theme */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-primary-900/70 to-black/50 mix-blend-multiply" />

            {/* Top Logo Bar for Landing Page */}
            <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center">
                 <div className="flex items-center space-x-3">
                     <div className="bg-white/10 backdrop-blur-md p-2 rounded-xl border border-white/20 shadow-lg">
                        <AcademicCapIcon className="w-8 h-8 text-white" />
                     </div>
                     <span className="text-2xl font-bold text-white drop-shadow-md tracking-wide">College Connect</span>
                 </div>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight animate-fade-in drop-shadow-lg px-2">Welcome to College Connect</h1>
            <p className="mt-4 max-w-2xl text-base md:text-lg text-gray-100 animate-fade-in shadow-black drop-shadow-md px-4" style={{ animationDelay: '0.2s' }}>Your bridge between campus life and career opportunities. Find placements, join clubs, and build your professional profile.</p>
            <div className="mt-8 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 animate-fade-in w-full sm:w-auto px-6" style={{ animationDelay: '0.4s' }}>
                <button onClick={() => setAuthMode('login')} className="w-full sm:w-auto px-8 py-3 border border-transparent text-base font-medium rounded-md text-primary-900 bg-white hover:bg-gray-100 shadow-lg hover:shadow-xl transition-all animate-subtle-pulse">
                    Login
                </button>
                 <button onClick={() => setAuthMode('signup')} className="w-full sm:w-auto px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white bg-transparent hover:bg-white/10 transition-all">
                    Sign Up
                </button>
            </div>

            {authMode && <AuthPage initialMode={authMode} closeAuth={() => setAuthMode(null)} />}
        </div>
    );
};

function App() {
    return (
        <AuthProvider>
            <NotificationProvider>
                <AppRouter />
            </NotificationProvider>
        </AuthProvider>
    );
}

export default App;
