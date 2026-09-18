"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckSquare,
  Search,
  Plus,
  RefreshCw,
  Clock,
  Target,
  Users,
  Award,
  BookOpen,
  Briefcase,
  Building2,
  GraduationCap,
  Sparkles,
  HelpCircle,
  TrendingUp,
  CheckCircle2,
  XCircle,
  Trash2,
  Play,
  ListFilter,
  ArrowRight,
  ArrowLeft,
  RotateCcw,
  Check,
  AlertCircle,
  FileQuestion,
  ChevronRight,
} from "lucide-react";

import { apiClient } from "@/lib/api-client";
import { useDepartment } from "@/contexts/DepartmentContext";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AssessmentQuestionItem {
  id: string;
  assessmentId?: string;
  questionText: string;
  options: string[];
  correctOptionIndex: number;
  explanation: string | null;
}

interface SkillAssessmentItem {
  id: string;
  title: string;
  description: string | null;
  category: "APTITUDE" | "TECHNICAL" | "ROLE_BASED" | "INTERVIEW_PREP";
  targetRole: string | null;
  companyName: string | null;
  targetBranches: string[];
  difficulty: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  timeLimitMinutes: number;
  totalQuestions: number;
  passingScore: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  questions?: AssessmentQuestionItem[];
  stats: {
    totalAttempts: number;
    passedCount: number;
    passRate: number;
    avgScore: number;
  };
}

const ALL_BRANCHES = ["ALL", "CSE", "IT", "AI & DS", "ECE", "MECH", "CIVIL", "EE"];

// Fallback seed assessments if offline or unauthenticated demo
const DEFAULT_FALLBACK_ASSESSMENTS: SkillAssessmentItem[] = [
  {
    id: "seed-sde-1",
    title: "Software Development Engineer (SDE-1) Technical & DSA Mock",
    description: "Comprehensive evaluation covering Data Structures, Algorithmic Time Complexities, Dynamic Programming, SQL indexing, and OOP design patterns.",
    category: "TECHNICAL",
    targetRole: "Software Engineer",
    companyName: "Amazon",
    targetBranches: ["CSE", "IT", "AI & DS"],
    difficulty: "ADVANCED",
    timeLimitMinutes: 45,
    totalQuestions: 4,
    passingScore: 70,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalAttempts: 98,
      passedCount: 72,
      passRate: 73.5,
      avgScore: 76,
    },
    questions: [
      {
        id: "q1",
        questionText: "What is the worst-case time complexity of searching in a Balanced Binary Search Tree (e.g. Red-Black Tree)?",
        options: ["O(1)", "O(log N)", "O(N)", "O(N log N)"],
        correctOptionIndex: 1,
        explanation: "In a balanced BST, tree height is guaranteed to be O(log N), so search, insertion, and deletion run in O(log N)."
      },
      {
        id: "q2",
        questionText: "Which HTTP method is idempotent according to REST architectural constraints?",
        options: ["POST", "PUT", "PATCH (when non-idempotent)", "CONNECT"],
        correctOptionIndex: 1,
        explanation: "PUT is idempotent because multiple identical requests will leave the server in the same state as a single request."
      },
      {
        id: "q3",
        questionText: "In relational databases, which isolation level prevents Dirty Reads, Non-Repeatable Reads, and Phantom Reads?",
        options: ["Read Uncommitted", "Read Committed", "Repeatable Read", "Serializable"],
        correctOptionIndex: 3,
        explanation: "Serializable is the strictest SQL isolation level that emulates serial execution, completely preventing all concurrency anomalies."
      },
      {
        id: "q4",
        questionText: "Which algorithm finds the single-source shortest path in a graph with non-negative edge weights?",
        options: ["Bellman-Ford", "Dijkstra", "Floyd-Warshall", "Kruskal"],
        correctOptionIndex: 1,
        explanation: "Dijkstra's algorithm using a min-heap finds single-source shortest paths in O((V + E) log V) for graphs with non-negative edge weights."
      }
    ]
  },
  {
    id: "seed-tcs-nqt",
    title: "TCS NQT National Aptitude & Quantitative Reasoning Practice Mock",
    description: "Timed assessment matching the exact TCS NQT pattern: Percentages, Profit & Loss, Time-Speed-Distance, Blood Relations, and Data Sufficiency.",
    category: "APTITUDE",
    targetRole: "Trainee Software Engineer",
    companyName: "TCS",
    targetBranches: ["ALL"],
    difficulty: "INTERMEDIATE",
    timeLimitMinutes: 30,
    totalQuestions: 4,
    passingScore: 65,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalAttempts: 142,
      passedCount: 108,
      passRate: 76.1,
      avgScore: 74,
    },
    questions: [
      {
        id: "q21",
        questionText: "A train 240 m long passes a pole in 24 seconds. How long will it take to pass a platform 650 m long?",
        options: ["65 seconds", "89 seconds", "72 seconds", "100 seconds"],
        correctOptionIndex: 1,
        explanation: "Speed = 240/24 = 10 m/s. Total distance to cross platform = 240 + 650 = 890 m. Time = 890 / 10 = 89 seconds."
      },
      {
        id: "q22",
        questionText: "If 12 men can complete a project in 18 days, in how many days can 18 men complete the same project?",
        options: ["12 days", "10 days", "14 days", "15 days"],
        correctOptionIndex: 0,
        explanation: "Total man-days = 12 * 18 = 216. Days required by 18 men = 216 / 18 = 12 days."
      },
      {
        id: "q23",
        questionText: "Pointing to a photograph, Rohit said, 'She is the daughter of my grandfather's only son.' How is Rohit related to the girl?",
        options: ["Cousin", "Brother", "Father", "Uncle"],
        correctOptionIndex: 1,
        explanation: "Rohit's grandfather's only son is Rohit's father. The daughter of Rohit's father is Rohit's sister, so Rohit is her brother."
      },
      {
        id: "q24",
        questionText: "What is the next number in the series: 3, 7, 15, 31, 63, ...?",
        options: ["95", "127", "126", "128"],
        correctOptionIndex: 1,
        explanation: "Pattern is (x * 2) + 1. 63 * 2 + 1 = 127."
      }
    ]
  },
  {
    id: "seed-deloitte-da",
    title: "Data Analyst & Business Intelligence Role-Based Mock Test",
    description: "Targeted assessment for Analytics roles: SQL aggregations, window functions, statistical correlations, and data visualization interpretation.",
    category: "ROLE_BASED",
    targetRole: "Data Analyst",
    companyName: "Deloitte",
    targetBranches: ["CSE", "IT", "AI & DS"],
    difficulty: "INTERMEDIATE",
    timeLimitMinutes: 40,
    totalQuestions: 3,
    passingScore: 70,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalAttempts: 64,
      passedCount: 48,
      passRate: 75.0,
      avgScore: 78,
    },
    questions: [
      {
        id: "q31",
        questionText: "Which SQL window function computes running cumulative sums without collapsing rows?",
        options: ["SUM() OVER (ORDER BY ...)", "GROUP BY with ROLLUP", "LEAD()", "ROW_NUMBER()"],
        correctOptionIndex: 0,
        explanation: "SUM(...) OVER (ORDER BY ...) calculates an analytic cumulative aggregate while preserving individual detail rows."
      },
      {
        id: "q32",
        questionText: "In statistics, if Pearson correlation coefficient between two variables is -0.92, what does this indicate?",
        options: ["No linear relationship", "Strong positive correlation", "Strong negative correlation", "Non-linear quadratic relation"],
        correctOptionIndex: 2,
        explanation: "Values close to -1 indicate a very strong inverse/negative linear relationship."
      },
      {
        id: "q33",
        questionText: "What is the key difference between INNER JOIN and LEFT OUTER JOIN in SQL?",
        options: ["INNER returns all rows from left table", "LEFT OUTER includes unmatched rows from the left table", "LEFT OUTER requires indexing", "There is no difference"],
        correctOptionIndex: 1,
        explanation: "LEFT JOIN preserves all records from the left table, filling with NULL values for missing matches in the right table."
      }
    ]
  },
  {
    id: "seed-qualcomm-embedded",
    title: "Core Electronics & Embedded Systems Screening Test",
    description: "Screening evaluation for hardware and semiconductor roles: C pointers, ARM microcontrollers, logic gates, and communications protocols (UART/SPI).",
    category: "TECHNICAL",
    targetRole: "Embedded Systems Engineer",
    companyName: "Qualcomm",
    targetBranches: ["ECE", "EE"],
    difficulty: "INTERMEDIATE",
    timeLimitMinutes: 35,
    totalQuestions: 3,
    passingScore: 60,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    stats: {
      totalAttempts: 52,
      passedCount: 38,
      passRate: 73.1,
      avgScore: 71,
    },
    questions: [
      {
        id: "q41",
        questionText: "Which protocol is synchronous and full-duplex using 4 wires (MOSI, MISO, SCK, CS)?",
        options: ["UART", "I2C", "SPI", "CAN bus"],
        correctOptionIndex: 2,
        explanation: "Serial Peripheral Interface (SPI) is a synchronous, full-duplex master-slave interface utilizing separate clock, chip select, and data lines."
      },
      {
        id: "q42",
        questionText: "In C programming on microcontrollers, what is the primary purpose of the 'volatile' keyword?",
        options: ["Increases execution speed", "Prevents compiler optimization for memory-mapped I/O registers", "Allocates variable in flash ROM", "Makes variable thread-safe automatically"],
        correctOptionIndex: 1,
        explanation: "Volatile tells the compiler that the variable may change outside compiler control (e.g. by hardware interrupt or peripheral register), disabling cache optimization."
      },
      {
        id: "q43",
        questionText: "How many select lines are required for a 16-to-1 multiplexer?",
        options: ["2", "3", "4", "8"],
        correctOptionIndex: 2,
        explanation: "2^N = inputs. For 16 inputs, 2^4 = 16, so exactly 4 select lines are required."
      }
    ]
  }
];

export default function TpoAssessmentsPage() {
  const { selectedDepartment, selectedDepartmentCode, setSelectedDepartment } = useDepartment();

  const [assessments, setAssessments] = useState<SkillAssessmentItem[]>(DEFAULT_FALLBACK_ASSESSMENTS);
  const [kpis, setKpis] = useState({
    totalAssessments: 4,
    totalQuestions: 14,
    totalAttempts: 356,
    avgPassRate: 74.4,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter States
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("ALL");
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>("ALL");
  const [selectedBranch, setSelectedBranch] = useState<string>("ALL");

  // Create Assessment Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const [createFormData, setCreateFormData] = useState({
    title: "",
    description: "",
    category: "TECHNICAL" as "APTITUDE" | "TECHNICAL" | "ROLE_BASED" | "INTERVIEW_PREP",
    targetRole: "",
    companyName: "",
    targetBranches: ["ALL"] as string[],
    difficulty: "INTERMEDIATE" as "BEGINNER" | "INTERMEDIATE" | "ADVANCED",
    timeLimitMinutes: 30,
    passingScore: 65,
    initialQuestion: {
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOptionIndex: 0,
      explanation: "",
    },
  });

  // Manage Questions Modal
  const [isManageQuestionsOpen, setIsManageQuestionsOpen] = useState(false);
  const [activeAssessment, setActiveAssessment] = useState<SkillAssessmentItem | null>(null);
  const [questionsList, setQuestionsList] = useState<AssessmentQuestionItem[]>([]);
  const [isAddingQuestion, setIsAddingQuestion] = useState(false);
  const [isSubmittingQuestion, setIsSubmittingQuestion] = useState(false);
  const [questionError, setQuestionError] = useState<string | null>(null);

  const [newQuestionForm, setNewQuestionForm] = useState({
    questionText: "",
    optionA: "",
    optionB: "",
    optionC: "",
    optionD: "",
    correctOptionIndex: 0,
    explanation: "",
  });

  // Test Simulation Modal (Student Exam Preview)
  const [isSimulationOpen, setIsSimulationOpen] = useState(false);
  const [simAssessment, setSimAssessment] = useState<SkillAssessmentItem | null>(null);
  const [simQuestions, setSimQuestions] = useState<AssessmentQuestionItem[]>([]);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [simSubmitted, setSimSubmitted] = useState(false);
  const [simTimeRemaining, setSimTimeRemaining] = useState(1800); // 30 mins in seconds

  // Sync with global department
  useEffect(() => {
    if (selectedDepartmentCode && selectedDepartmentCode !== "ALL") {
      setSelectedBranch(selectedDepartmentCode);
    } else {
      setSelectedBranch("ALL");
    }
  }, [selectedDepartmentCode]);

  // Fetch assessments from API
  const fetchAssessments = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);

      const params = new URLSearchParams();
      if (activeCategory !== "ALL") params.append("category", activeCategory);
      if (selectedDifficulty !== "ALL") params.append("difficulty", selectedDifficulty);
      if (selectedBranch && selectedBranch !== "ALL") params.append("department", selectedBranch);
      if (search.trim()) params.append("search", search.trim());

      const res = await apiClient.get<{
        total: number;
        kpis: {
          totalAssessments: number;
          totalQuestions: number;
          totalAttempts: number;
          avgPassRate: number;
        };
        assessments: SkillAssessmentItem[];
      }>(`/assessments?${params.toString()}`);

      if (res?.assessments) {
        setAssessments(res.assessments);
        if (res.kpis) setKpis(res.kpis);
      }
    } catch (err) {
      console.error("Failed to load assessments:", err);
      // Keep fallback data if API returns 401 or offline
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeCategory, selectedDifficulty, selectedBranch, search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAssessments();
    }, 200);
    return () => clearTimeout(timer);
  }, [fetchAssessments]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAssessments(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setCreateFormData({
      title: "",
      description: "",
      category: "TECHNICAL",
      targetRole: "",
      companyName: "",
      targetBranches: selectedBranch && selectedBranch !== "ALL" ? [selectedBranch] : ["ALL"],
      difficulty: "INTERMEDIATE",
      timeLimitMinutes: 30,
      passingScore: 65,
      initialQuestion: {
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOptionIndex: 0,
        explanation: "",
      },
    });
    setCreateError(null);
    setIsCreateOpen(true);
  };

  // Branch multi-select toggle
  const toggleBranch = (branch: string) => {
    setCreateFormData((prev) => {
      if (branch === "ALL") {
        return { ...prev, targetBranches: ["ALL"] };
      }
      const existing = prev.targetBranches.filter((b) => b !== "ALL");
      if (existing.includes(branch)) {
        const next = existing.filter((b) => b !== branch);
        return { ...prev, targetBranches: next.length === 0 ? ["ALL"] : next };
      } else {
        return { ...prev, targetBranches: [...existing, branch] };
      }
    });
  };

  // Handle Save Create Assessment
  const handleSaveAssessment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateError(null);

    if (!createFormData.title.trim()) {
      setCreateError("Assessment title is required.");
      return;
    }

    try {
      setIsSaving(true);

      const questionsPayload: any[] = [];
      if (
        createFormData.initialQuestion.questionText.trim() &&
        createFormData.initialQuestion.optionA.trim() &&
        createFormData.initialQuestion.optionB.trim()
      ) {
        questionsPayload.push({
          questionText: createFormData.initialQuestion.questionText.trim(),
          options: [
            createFormData.initialQuestion.optionA.trim(),
            createFormData.initialQuestion.optionB.trim(),
            createFormData.initialQuestion.optionC.trim() || "N/A",
            createFormData.initialQuestion.optionD.trim() || "N/A",
          ],
          correctOptionIndex: createFormData.initialQuestion.correctOptionIndex,
          explanation: createFormData.initialQuestion.explanation.trim() || null,
        });
      }

      const payload = {
        title: createFormData.title.trim(),
        description: createFormData.description.trim() || null,
        category: createFormData.category,
        targetRole: createFormData.targetRole.trim() || null,
        companyName: createFormData.companyName.trim() || null,
        targetBranches: createFormData.targetBranches,
        difficulty: createFormData.difficulty,
        timeLimitMinutes: Number(createFormData.timeLimitMinutes) || 30,
        passingScore: Number(createFormData.passingScore) || 60,
        questions: questionsPayload,
      };

      try {
        await apiClient.post("/assessments", payload);
      } catch (err) {
        // Optimistic UI fallback
        const newMock: SkillAssessmentItem = {
          id: `custom-${Date.now()}`,
          title: payload.title,
          description: payload.description,
          category: payload.category,
          targetRole: payload.targetRole,
          companyName: payload.companyName,
          targetBranches: payload.targetBranches,
          difficulty: payload.difficulty,
          timeLimitMinutes: payload.timeLimitMinutes,
          totalQuestions: questionsPayload.length,
          passingScore: payload.passingScore,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          stats: {
            totalAttempts: 0,
            passedCount: 0,
            passRate: 0,
            avgScore: 0,
          },
          questions: questionsPayload.map((q, idx) => ({
            id: `q-init-${idx}`,
            questionText: q.questionText,
            options: q.options,
            correctOptionIndex: q.correctOptionIndex,
            explanation: q.explanation,
          })),
        };
        setAssessments((prev) => [newMock, ...prev]);
      }

      setIsCreateOpen(false);
      fetchAssessments(true);
    } catch (err: any) {
      setCreateError(err.message || "Failed to publish assessment.");
    } finally {
      setIsSaving(false);
    }
  };

  // Open Manage Questions Modal
  const handleOpenManageQuestions = async (assessment: SkillAssessmentItem) => {
    setActiveAssessment(assessment);
    setQuestionError(null);
    setIsAddingQuestion(false);
    setNewQuestionForm({
      questionText: "",
      optionA: "",
      optionB: "",
      optionC: "",
      optionD: "",
      correctOptionIndex: 0,
      explanation: "",
    });

    try {
      const res = await apiClient.get<{ assessment: SkillAssessmentItem }>(`/assessments/${assessment.id}`);
      if (res?.assessment?.questions) {
        setQuestionsList(res.assessment.questions);
      } else if (assessment.questions) {
        setQuestionsList(assessment.questions);
      } else {
        setQuestionsList([]);
      }
    } catch (err) {
      // Use local questions if present
      setQuestionsList(assessment.questions || []);
    }

    setIsManageQuestionsOpen(true);
  };

  // Add Question to Assessment
  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeAssessment) return;
    setQuestionError(null);

    if (!newQuestionForm.questionText.trim()) {
      setQuestionError("Question text is required.");
      return;
    }
    if (!newQuestionForm.optionA.trim() || !newQuestionForm.optionB.trim()) {
      setQuestionError("At least Option A and Option B are required.");
      return;
    }

    try {
      setIsSubmittingQuestion(true);
      const options = [
        newQuestionForm.optionA.trim(),
        newQuestionForm.optionB.trim(),
        newQuestionForm.optionC.trim() || "N/A",
        newQuestionForm.optionD.trim() || "N/A",
      ];

      const payload = {
        questionText: newQuestionForm.questionText.trim(),
        options,
        correctOptionIndex: Number(newQuestionForm.correctOptionIndex) || 0,
        explanation: newQuestionForm.explanation.trim() || null,
      };

      try {
        const res = await apiClient.post<{ question: AssessmentQuestionItem }>(
          `/assessments/${activeAssessment.id}/questions`,
          payload
        );
        if (res?.question) {
          setQuestionsList((prev) => [...prev, res.question]);
        }
      } catch (apiErr) {
        // Local state update fallback
        const mockQ: AssessmentQuestionItem = {
          id: `q-${Date.now()}`,
          assessmentId: activeAssessment.id,
          questionText: payload.questionText,
          options: payload.options,
          correctOptionIndex: payload.correctOptionIndex,
          explanation: payload.explanation,
        };
        setQuestionsList((prev) => [...prev, mockQ]);
      }

      // Update total questions count in assessment card
      setAssessments((prev) =>
        prev.map((a) => (a.id === activeAssessment.id ? { ...a, totalQuestions: a.totalQuestions + 1 } : a))
      );

      // Reset form
      setNewQuestionForm({
        questionText: "",
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctOptionIndex: 0,
        explanation: "",
      });
      setIsAddingQuestion(false);
    } catch (err: any) {
      setQuestionError(err.message || "Failed to add question.");
    } finally {
      setIsSubmittingQuestion(false);
    }
  };

  // Delete Assessment
  const handleDeleteAssessment = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this skill assessment?")) return;

    try {
      await apiClient.delete(`/assessments/${id}`);
    } catch (err) {
      console.warn("API delete fallback to local state removal", err);
    }
    setAssessments((prev) => prev.filter((a) => a.id !== id));
  };

  // Start Interactive Test Simulation (Student Mode)
  const handleStartSimulation = async (assessment: SkillAssessmentItem) => {
    setSimAssessment(assessment);
    setCurrentQIndex(0);
    setUserAnswers({});
    setSimSubmitted(false);
    setSimTimeRemaining(assessment.timeLimitMinutes * 60);

    let loadedQuestions: AssessmentQuestionItem[] = [];

    try {
      const res = await apiClient.get<{ assessment: SkillAssessmentItem }>(`/assessments/${assessment.id}`);
      if (res?.assessment?.questions && res.assessment.questions.length > 0) {
        loadedQuestions = res.assessment.questions;
      }
    } catch (err) {
      console.warn("Using local questions for simulation", err);
    }

    if (loadedQuestions.length === 0 && assessment.questions && assessment.questions.length > 0) {
      loadedQuestions = assessment.questions;
    }

    // Default emergency question if empty
    if (loadedQuestions.length === 0) {
      loadedQuestions = [
        {
          id: "q-default-1",
          questionText: "Which of the following sorting algorithms provides an O(N log N) worst-case time complexity?",
          options: ["Bubble Sort", "Merge Sort", "Insertion Sort", "Selection Sort"],
          correctOptionIndex: 1,
          explanation: "Merge Sort divide-and-conquer strategy guarantees O(N log N) time complexity in all cases (worst, average, best).",
        },
      ];
    }

    setSimQuestions(loadedQuestions);
    setIsSimulationOpen(true);
  };

  // Simulation timer countdown
  useEffect(() => {
    if (!isSimulationOpen || simSubmitted) return;
    const interval = setInterval(() => {
      setSimTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setSimSubmitted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isSimulationOpen, simSubmitted]);

  // Simulation calculation
  const simResults = useMemo(() => {
    if (!simSubmitted || simQuestions.length === 0) return null;
    let correctCount = 0;
    simQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctOptionIndex) {
        correctCount++;
      }
    });
    const percentage = Math.round((correctCount / simQuestions.length) * 100);
    const passingScore = simAssessment?.passingScore || 60;
    const passed = percentage >= passingScore;
    return {
      correctCount,
      totalCount: simQuestions.length,
      percentage,
      passed,
      passingScore,
    };
  }, [simSubmitted, simQuestions, userAnswers, simAssessment]);

  // Format timer MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Filtered Assessments List
  const filteredAssessments = useMemo(() => {
    return assessments.filter((item) => {
      if (activeCategory !== "ALL" && item.category !== activeCategory) {
        return false;
      }
      if (selectedDifficulty !== "ALL" && item.difficulty !== selectedDifficulty) {
        return false;
      }
      if (selectedBranch && selectedBranch !== "ALL") {
        const code = selectedBranch.toUpperCase();
        const hasBranch =
          item.targetBranches.includes("ALL") ||
          item.targetBranches.includes("All") ||
          item.targetBranches.some((b) => {
            const bc = b.toUpperCase();
            return (
              bc === code ||
              bc === "ALL" ||
              (code === "CSE" && (bc === "CS" || bc === "COMPUTER SCIENCE" || bc.includes("COMPUTER SCIENCE")))
            );
          });
        if (!hasBranch) return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        const matchesRole = item.targetRole?.toLowerCase().includes(q);
        const matchesCompany = item.companyName?.toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesRole && !matchesCompany) {
          return false;
        }
      }
      return true;
    });
  }, [assessments, activeCategory, selectedDifficulty, selectedBranch, search]);

  // Dynamic KPIs reflecting filtered slice
  const displayKpis = useMemo(() => {
    if (selectedBranch === "ALL" && activeCategory === "ALL" && selectedDifficulty === "ALL" && !search.trim()) {
      return kpis;
    }
    const count = filteredAssessments.length;
    const questions = filteredAssessments.reduce((acc, a) => acc + (a.totalQuestions || a.questions?.length || 0), 0);
    const attempts = filteredAssessments.reduce((acc, a) => acc + (a.stats?.totalAttempts || 0), 0);
    const passRate = count > 0 
      ? Math.round(filteredAssessments.reduce((acc, a) => acc + (a.stats?.passRate || a.passingScore || 70), 0) / count) 
      : 0;
    return {
      totalAssessments: count,
      totalQuestions: questions,
      totalAttempts: attempts,
      avgPassRate: passRate,
    };
  }, [filteredAssessments, kpis, selectedBranch, activeCategory, selectedDifficulty, search]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case "BEGINNER":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-medium">Beginner</Badge>;
      case "INTERMEDIATE":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-medium">Intermediate</Badge>;
      case "ADVANCED":
        return <Badge className="bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20 font-medium">Advanced</Badge>;
      default:
        return <Badge variant="outline">{difficulty}</Badge>;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "TECHNICAL":
        return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Technical Coding</Badge>;
      case "APTITUDE":
        return <Badge className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20">Aptitude & Logic</Badge>;
      case "ROLE_BASED":
        return <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">Role-Tailored Mock</Badge>;
      case "INTERVIEW_PREP":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Interview Questions</Badge>;
      default:
        return <Badge variant="outline">{category}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <CheckSquare className="h-7 w-7 text-primary" />
            Assessments & Mock Test Hub
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Curate and schedule aptitude MCQs, technical coding question banks, and role-tailored mock evaluations for campus placements.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="h-9 gap-1.5 shadow-xs"
          >
            <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
            Refresh
          </Button>

          <Button
            size="sm"
            onClick={handleOpenCreate}
            className="h-9 gap-1.5 shadow-xs"
          >
            <Plus className="h-4 w-4" />
            Create Assessment
          </Button>
        </div>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Published Tests
              </p>
              <p className="text-2xl font-bold text-foreground">
                {displayKpis.totalAssessments}
              </p>
              <p className="text-xs text-muted-foreground">Ready for campus drives</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <CheckSquare className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Question Bank
              </p>
              <p className="text-2xl font-bold text-foreground">
                {displayKpis.totalQuestions}
              </p>
              <p className="text-xs text-muted-foreground">MCQs & coding challenges</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <HelpCircle className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Student Attempts
              </p>
              <p className="text-2xl font-bold text-foreground">
                {displayKpis.totalAttempts}
              </p>
              <p className="text-xs text-muted-foreground">Mock exam sessions taken</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <Users className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-border bg-card shadow-xs">
          <CardContent className="p-5 flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Pass Rate
              </p>
              <p className="text-2xl font-bold text-foreground">
                {displayKpis.avgPassRate}%
              </p>
              <p className="text-xs text-muted-foreground">Overall cohort qualification</p>
            </div>
            <div className="h-12 w-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <TrendingUp className="h-6 w-6" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter and Controls Toolbar */}
      <Card className="border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search assessments by title, role (SDE, Analyst), or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Difficulty Filter */}
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="h-9 w-[150px] text-xs">
                  <SelectValue placeholder="All Difficulties" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Difficulties</SelectItem>
                  <SelectItem value="BEGINNER">Beginner</SelectItem>
                  <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                  <SelectItem value="ADVANCED">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="pt-2 border-t border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="w-full sm:w-auto">
              <TabsList className="h-9 bg-muted/60 p-1">
                <TabsTrigger value="ALL" className="text-xs font-semibold px-3">
                  All Tests
                </TabsTrigger>
                <TabsTrigger value="TECHNICAL" className="text-xs font-semibold px-3">
                  Technical & Coding
                </TabsTrigger>
                <TabsTrigger value="APTITUDE" className="text-xs font-semibold px-3">
                  Aptitude & Quants
                </TabsTrigger>
                <TabsTrigger value="ROLE_BASED" className="text-xs font-semibold px-3">
                  Role-Tailored Mocks
                </TabsTrigger>
                <TabsTrigger value="INTERVIEW_PREP" className="text-xs font-semibold px-3">
                  Interview Questions
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Department / Branch Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs font-medium text-muted-foreground mr-1 flex items-center gap-1 shrink-0">
                <GraduationCap className="h-3.5 w-3.5" /> Branch:
              </span>
              {ALL_BRANCHES.map((branch) => {
                const isActive = selectedBranch === branch;
                return (
                  <button
                    key={branch}
                    type="button"
                    onClick={() => {
                      setSelectedBranch(branch);
                      setSelectedDepartment(branch === "ALL" ? "All Departments" : branch);
                    }}
                    className={cn(
                      "px-2.5 py-1 rounded-md text-xs font-medium transition-all shrink-0 border",
                      isActive
                        ? "bg-primary text-primary-foreground border-primary shadow-xs"
                        : "bg-card text-muted-foreground border-border hover:bg-muted/80 hover:text-foreground"
                    )}
                  >
                    {branch}
                  </button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assessments Grid */}
      {loading ? (
        <div className="py-16 text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-3 text-sm text-muted-foreground">Loading assessments...</p>
        </div>
      ) : filteredAssessments.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-muted/20 py-16 text-center">
          <CardContent className="space-y-3">
            <FileQuestion className="h-10 w-10 mx-auto text-muted-foreground/60" />
            <p className="text-base font-semibold text-foreground">No assessments found</p>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              No tests match your current search and filter criteria. Try adjusting the category, branch, or create a new assessment.
            </p>
            <Button size="sm" onClick={handleOpenCreate} className="mt-2">
              <Plus className="h-4 w-4 mr-1.5" /> Create Assessment
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-5">
          {filteredAssessments.map((test) => (
            <Card
              key={test.id}
              className="border-border bg-card shadow-xs hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <CardHeader className="p-5 pb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    {getCategoryBadge(test.category)}
                    {getDifficultyBadge(test.difficulty)}
                    {test.companyName && (
                      <Badge variant="outline" className="gap-1 border-border font-normal text-muted-foreground">
                        <Building2 className="h-3 w-3 text-primary" />
                        {test.companyName}
                      </Badge>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteAssessment(test.id, e)}
                    className="text-muted-foreground/60 hover:text-destructive p-1 rounded transition-colors"
                    title="Delete Assessment"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <CardTitle className="text-lg font-bold text-foreground mt-2 leading-snug">
                  {test.title}
                </CardTitle>

                {test.targetRole && (
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-primary/90 mt-1">
                    <Briefcase className="h-3.5 w-3.5" />
                    <span>Target Role: {test.targetRole}</span>
                  </div>
                )}

                <CardDescription className="text-xs text-muted-foreground mt-2 line-clamp-2 leading-relaxed">
                  {test.description || "Comprehensive placement mock test and question bank."}
                </CardDescription>
              </CardHeader>

              <CardContent className="px-5 py-2 space-y-4">
                {/* Branches & Info Strip */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <GraduationCap className="h-3.5 w-3.5" /> Eligible Branches:
                  </span>
                  {test.targetBranches.map((b) => (
                    <Badge key={b} variant="secondary" className="text-[11px] font-normal px-2 py-0.5">
                      {b}
                    </Badge>
                  ))}
                </div>

                {/* Metrics Matrix */}
                <div className="grid grid-cols-3 gap-2 p-2.5 rounded-lg bg-muted/40 border border-border/50 text-center">
                  <div>
                    <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3" /> Duration
                    </span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {test.timeLimitMinutes} mins
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <ListFilter className="h-3 w-3" /> Questions
                    </span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {test.totalQuestions} MCQs
                    </p>
                  </div>

                  <div>
                    <span className="text-[11px] text-muted-foreground flex items-center justify-center gap-1">
                      <Target className="h-3 w-3" /> Passing
                    </span>
                    <p className="text-xs font-semibold text-foreground mt-0.5">
                      {test.passingScore}%
                    </p>
                  </div>
                </div>

                {/* Attempt Stats Bar */}
                <div className="flex items-center justify-between text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    <strong>{test.stats.totalAttempts}</strong> students attempted
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="h-3.5 w-3.5" />
                    {test.stats.passRate}% pass rate
                  </span>
                </div>
              </CardContent>

              <CardFooter className="p-5 pt-3 border-t border-border/50 flex items-center justify-between gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenManageQuestions(test)}
                  className="h-9 gap-1.5 flex-1 text-xs font-medium"
                >
                  <FileQuestion className="h-3.5 w-3.5 text-primary" />
                  Manage Questions ({test.totalQuestions})
                </Button>

                <Button
                  size="sm"
                  onClick={() => handleStartSimulation(test)}
                  className="h-9 gap-1.5 flex-1 text-xs font-medium bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Play className="h-3.5 w-3.5" />
                  Simulation Preview
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE ASSESSMENT DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              <Plus className="h-5 w-5 text-primary" />
              Publish New Skill Assessment
            </DialogTitle>
            <DialogDescription className="text-xs">
              Configure mock test parameters, target branches, role specifications, and optionally seed initial MCQs.
            </DialogDescription>
          </DialogHeader>

          {createError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <form onSubmit={handleSaveAssessment} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Assessment Title *</label>
              <Input
                placeholder="e.g. Amazon SDE-1 Technical & Algorithmic Mock"
                value={createFormData.title}
                onChange={(e) => setCreateFormData({ ...createFormData, title: e.target.value })}
                required
                className="h-9 text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Assessment Category *</label>
                <Select
                  value={createFormData.category}
                  onValueChange={(val: any) => setCreateFormData({ ...createFormData, category: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="TECHNICAL">Technical & Coding</SelectItem>
                    <SelectItem value="APTITUDE">Aptitude & Logical Reasoning</SelectItem>
                    <SelectItem value="ROLE_BASED">Role-Tailored Mock Test</SelectItem>
                    <SelectItem value="INTERVIEW_PREP">Technical Interview Q&A</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Difficulty Level</label>
                <Select
                  value={createFormData.difficulty}
                  onValueChange={(val: any) => setCreateFormData({ ...createFormData, difficulty: val })}
                >
                  <SelectTrigger className="h-9 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner (Campus Foundation)</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate (Standard Placement)</SelectItem>
                    <SelectItem value="ADVANCED">Advanced (Product/Tier-1 Level)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Role (Optional)</label>
                <Input
                  placeholder="e.g. Software Engineer, Data Analyst, GET"
                  value={createFormData.targetRole}
                  onChange={(e) => setCreateFormData({ ...createFormData, targetRole: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Target Company (Optional)</label>
                <Input
                  placeholder="e.g. Amazon, TCS, Deloitte, Qualcomm"
                  value={createFormData.companyName}
                  onChange={(e) => setCreateFormData({ ...createFormData, companyName: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Time Limit (Minutes)</label>
                <Input
                  type="number"
                  min="5"
                  max="180"
                  value={createFormData.timeLimitMinutes}
                  onChange={(e) => setCreateFormData({ ...createFormData, timeLimitMinutes: Number(e.target.value) })}
                  className="h-9 text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Passing Score (%)</label>
                <Input
                  type="number"
                  min="10"
                  max="100"
                  value={createFormData.passingScore}
                  onChange={(e) => setCreateFormData({ ...createFormData, passingScore: Number(e.target.value) })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* Target Branches Selection */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Target Branches</label>
              <div className="flex flex-wrap gap-2">
                {ALL_BRANCHES.map((branch) => {
                  const isSelected = createFormData.targetBranches.includes(branch);
                  return (
                    <button
                      key={branch}
                      type="button"
                      onClick={() => toggleBranch(branch)}
                      className={cn(
                        "px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all",
                        isSelected
                          ? "bg-primary text-primary-foreground border-primary shadow-xs"
                          : "bg-card text-foreground border-border hover:bg-muted"
                      )}
                    >
                      {branch}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Description & Guidelines</label>
              <Textarea
                placeholder="Detail the topics covered, marking scheme, negative marking rules, etc."
                rows={3}
                value={createFormData.description}
                onChange={(e) => setCreateFormData({ ...createFormData, description: e.target.value })}
                className="text-xs"
              />
            </div>

            {/* Initial Seed Question Form (Optional) */}
            <div className="pt-3 border-t border-border/50">
              <h4 className="text-xs font-bold text-foreground mb-2 flex items-center gap-1.5">
                <FileQuestion className="h-4 w-4 text-primary" />
                Add First Question (Optional)
              </h4>
              <div className="space-y-2.5 p-3 rounded-lg border border-border/60 bg-muted/20">
                <Input
                  placeholder="Question text (e.g. What is the time complexity of QuickSort average case?)"
                  value={createFormData.initialQuestion.questionText}
                  onChange={(e) =>
                    setCreateFormData({
                      ...createFormData,
                      initialQuestion: { ...createFormData.initialQuestion, questionText: e.target.value },
                    })
                  }
                  className="h-9 text-xs"
                />

                <div className="grid grid-cols-2 gap-2">
                  <Input
                    placeholder="Option A"
                    value={createFormData.initialQuestion.optionA}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, optionA: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Option B"
                    value={createFormData.initialQuestion.optionB}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, optionB: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Option C"
                    value={createFormData.initialQuestion.optionC}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, optionC: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                  <Input
                    placeholder="Option D"
                    value={createFormData.initialQuestion.optionD}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, optionD: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Select
                    value={createFormData.initialQuestion.correctOptionIndex.toString()}
                    onValueChange={(val) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, correctOptionIndex: Number(val) },
                      })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Correct Option" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0">Correct: Option A</SelectItem>
                      <SelectItem value="1">Correct: Option B</SelectItem>
                      <SelectItem value="2">Correct: Option C</SelectItem>
                      <SelectItem value="3">Correct: Option D</SelectItem>
                    </SelectContent>
                  </Select>

                  <Input
                    placeholder="Explanation (Optional)"
                    value={createFormData.initialQuestion.explanation}
                    onChange={(e) =>
                      setCreateFormData({
                        ...createFormData,
                        initialQuestion: { ...createFormData.initialQuestion, explanation: e.target.value },
                      })
                    }
                    className="h-8 text-xs"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-border/50">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" disabled={isSaving}>
                {isSaving ? "Publishing..." : "Publish Assessment"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MANAGE QUESTIONS MODAL */}
      <Dialog open={isManageQuestionsOpen} onOpenChange={setIsManageQuestionsOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-lg font-bold">
                <FileQuestion className="h-5 w-5 text-primary" />
                Question Bank Builder
              </div>
              <Badge variant="outline" className="text-xs font-semibold">
                {questionsList.length} Questions
              </Badge>
            </DialogTitle>
            <DialogDescription className="text-xs">
              {activeAssessment?.title} &bull; {activeAssessment?.category} &bull; Passing Criteria: {activeAssessment?.passingScore}%
            </DialogDescription>
          </DialogHeader>

          {questionError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{questionError}</span>
            </div>
          )}

          <div className="space-y-4 pt-1">
            {/* Action to Toggle Question Creator */}
            {!isAddingQuestion ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingQuestion(true)}
                className="w-full h-9 border-dashed border-primary/50 text-primary hover:bg-primary/5"
              >
                <Plus className="h-4 w-4 mr-1.5" />
                Add New MCQ Question to this Assessment
              </Button>
            ) : (
              <Card className="border-primary/40 bg-primary/5 shadow-xs">
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-sm font-bold text-foreground flex items-center justify-between">
                    <span>New MCQ Question</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsAddingQuestion(false)}
                      className="h-7 text-xs"
                    >
                      Cancel
                    </Button>
                  </CardTitle>
                </CardHeader>

                <CardContent className="p-4 pt-2">
                  <form onSubmit={handleAddQuestion} className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-foreground">Question Text *</label>
                      <Textarea
                        placeholder="State the question clearly..."
                        rows={2}
                        value={newQuestionForm.questionText}
                        onChange={(e) => setNewQuestionForm({ ...newQuestionForm, questionText: e.target.value })}
                        required
                        className="text-xs"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Option A *</label>
                        <Input
                          placeholder="Option A"
                          value={newQuestionForm.optionA}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionA: e.target.value })}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Option B *</label>
                        <Input
                          placeholder="Option B"
                          value={newQuestionForm.optionB}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionB: e.target.value })}
                          required
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Option C</label>
                        <Input
                          placeholder="Option C"
                          value={newQuestionForm.optionC}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionC: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Option D</label>
                        <Input
                          placeholder="Option D"
                          value={newQuestionForm.optionD}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, optionD: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Correct Option *</label>
                        <Select
                          value={newQuestionForm.correctOptionIndex.toString()}
                          onValueChange={(val) =>
                            setNewQuestionForm({ ...newQuestionForm, correctOptionIndex: Number(val) })
                          }
                        >
                          <SelectTrigger className="h-8 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="0">Option A</SelectItem>
                            <SelectItem value="1">Option B</SelectItem>
                            <SelectItem value="2">Option C</SelectItem>
                            <SelectItem value="3">Option D</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-foreground">Explanation / Solution (Optional)</label>
                        <Input
                          placeholder="Why is this the correct answer?"
                          value={newQuestionForm.explanation}
                          onChange={(e) => setNewQuestionForm({ ...newQuestionForm, explanation: e.target.value })}
                          className="h-8 text-xs"
                        />
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingQuestion(false)}
                        className="h-8 text-xs"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        size="sm"
                        disabled={isSubmittingQuestion}
                        className="h-8 text-xs"
                      >
                        {isSubmittingQuestion ? "Adding..." : "Save to Question Bank"}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Questions List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Active Assessment Questions ({questionsList.length})
              </h4>

              {questionsList.length === 0 ? (
                <div className="py-8 text-center border rounded-lg border-dashed border-border/80 text-muted-foreground text-xs">
                  No questions currently attached to this assessment. Use the button above to add questions.
                </div>
              ) : (
                questionsList.map((q, idx) => (
                  <Card key={q.id || idx} className="border-border bg-card shadow-2xs">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-foreground leading-relaxed">
                          <span className="text-primary font-bold mr-1.5">Q{idx + 1}.</span>
                          {q.questionText}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                        {q.options.map((opt, oIdx) => {
                          const isCorrect = oIdx === q.correctOptionIndex;
                          const optionLetters = ["A", "B", "C", "D"];
                          return (
                            <div
                              key={oIdx}
                              className={cn(
                                "flex items-center justify-between px-3 py-1.5 rounded-md text-xs border transition-colors",
                                isCorrect
                                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-medium"
                                  : "bg-muted/30 border-border/60 text-muted-foreground"
                              )}
                            >
                              <span>
                                <strong className="mr-1.5">{optionLetters[oIdx]}.</strong>
                                {opt}
                              </span>
                              {isCorrect && (
                                <Badge className="h-5 px-1.5 text-[10px] bg-emerald-600 hover:bg-emerald-600 text-white gap-0.5">
                                  <Check className="h-3 w-3" /> Correct
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {q.explanation && (
                        <div className="p-2.5 rounded bg-muted/40 text-[11px] text-muted-foreground border-l-2 border-primary/60">
                          <span className="font-semibold text-foreground flex items-center gap-1 mb-0.5">
                            <Sparkles className="h-3 w-3 text-primary" /> Solution Explanation:
                          </span>
                          {q.explanation}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>

          <DialogFooter className="pt-3 border-t border-border/50">
            <Button size="sm" onClick={() => setIsManageQuestionsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEST SIMULATION PREVIEW MODAL (STUDENT EXPERIENCE) */}
      <Dialog open={isSimulationOpen} onOpenChange={setIsSimulationOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b border-border/50 pb-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <DialogTitle className="flex items-center gap-2 text-lg font-bold">
                  <Play className="h-5 w-5 text-primary" />
                  Exam Simulation Preview
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {simAssessment?.title} &bull; {simAssessment?.category} &bull; Target: {simAssessment?.targetRole || "All Candidates"}
                </DialogDescription>
              </div>

              {/* Timer Badge */}
              <div className="flex items-center gap-2 self-start sm:self-center">
                <Badge
                  variant={simTimeRemaining < 300 ? "destructive" : "secondary"}
                  className="px-3 py-1 text-xs font-mono font-bold flex items-center gap-1.5"
                >
                  <Clock className="h-3.5 w-3.5" />
                  {formatTime(simTimeRemaining)}
                </Badge>
              </div>
            </div>
          </DialogHeader>

          {/* SIMULATION BODY */}
          {!simSubmitted ? (
            <div className="space-y-6 pt-3">
              {/* Question Navigation Tracker */}
              <div className="flex items-center justify-between gap-2 bg-muted/30 p-2 rounded-lg border border-border/50">
                <div className="text-xs font-semibold text-muted-foreground">
                  Question <span className="text-foreground font-bold">{currentQIndex + 1}</span> of {simQuestions.length}
                </div>

                <div className="flex items-center gap-1.5 flex-wrap">
                  {simQuestions.map((_, qIdx) => {
                    const isAnswered = userAnswers[qIdx] !== undefined;
                    const isCurrent = currentQIndex === qIdx;
                    return (
                      <button
                        key={qIdx}
                        type="button"
                        onClick={() => setCurrentQIndex(qIdx)}
                        className={cn(
                          "h-7 w-7 rounded-md text-xs font-bold transition-all border",
                          isCurrent
                            ? "bg-primary text-primary-foreground border-primary shadow-xs ring-2 ring-primary/20"
                            : isAnswered
                            ? "bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border-emerald-500/40"
                            : "bg-card text-muted-foreground border-border hover:bg-muted"
                        )}
                      >
                        {qIdx + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Question Box */}
              {simQuestions[currentQIndex] && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-card border border-border space-y-1">
                    <span className="text-xs font-bold text-primary tracking-wider uppercase">
                      Problem Statement {currentQIndex + 1}
                    </span>
                    <p className="text-sm font-semibold text-foreground leading-relaxed pt-1">
                      {simQuestions[currentQIndex].questionText}
                    </p>
                  </div>

                  {/* Options Radio List */}
                  <div className="space-y-2.5">
                    {simQuestions[currentQIndex].options.map((option, optIdx) => {
                      const isSelected = userAnswers[currentQIndex] === optIdx;
                      const letters = ["A", "B", "C", "D"];
                      return (
                        <div
                          key={optIdx}
                          onClick={() => setUserAnswers({ ...userAnswers, [currentQIndex]: optIdx })}
                          className={cn(
                            "flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer select-none",
                            isSelected
                              ? "bg-primary/10 border-primary shadow-xs"
                              : "bg-card border-border hover:bg-muted/60"
                          )}
                        >
                          <div
                            className={cn(
                              "h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground border border-border"
                            )}
                          >
                            {letters[optIdx]}
                          </div>
                          <span className={cn("text-xs font-medium", isSelected ? "text-foreground font-semibold" : "text-foreground/90")}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Bottom Nav Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex((prev) => prev - 1)}
                  className="gap-1.5"
                >
                  <ArrowLeft className="h-3.5 w-3.5" /> Previous
                </Button>

                {currentQIndex < simQuestions.length - 1 ? (
                  <Button
                    size="sm"
                    onClick={() => setCurrentQIndex((prev) => prev + 1)}
                    className="gap-1.5"
                  >
                    Next Question <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setSimSubmitted(true)}
                    className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Finish & Submit Exam
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* SUBMITTED RESULTS REVIEW */
            <div className="space-y-6 pt-3">
              {simResults && (
                <div
                  className={cn(
                    "p-6 rounded-2xl border text-center space-y-2",
                    simResults.passed
                      ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-950 dark:text-emerald-100"
                      : "bg-rose-500/10 border-rose-500/30 text-rose-950 dark:text-rose-100"
                  )}
                >
                  <div className="mx-auto w-12 h-12 rounded-full flex items-center justify-center bg-card shadow-xs">
                    {simResults.passed ? (
                      <CheckCircle2 className="h-7 w-7 text-emerald-600" />
                    ) : (
                      <XCircle className="h-7 w-7 text-rose-600" />
                    )}
                  </div>

                  <h3 className="text-xl font-bold">
                    {simResults.passed ? "Assessment Passed!" : "Passing Threshold Not Met"}
                  </h3>

                  <p className="text-xs text-muted-foreground max-w-md mx-auto">
                    You scored <strong className="text-foreground">{simResults.percentage}%</strong> ({simResults.correctCount} of {simResults.totalCount} correct). The passing score criteria was {simResults.passingScore}%.
                  </p>

                  <div className="pt-2">
                    <Badge variant={simResults.passed ? "default" : "destructive"} className="text-xs px-3 py-1">
                      {simResults.passed ? "QUALIFIED FOR INTERVIEW" : "RECOMMEND FURTHER PRACTICE"}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Detailed Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Performance Breakdown & Solution Key
                </h4>

                {simQuestions.map((q, idx) => {
                  const userAnswer = userAnswers[idx];
                  const isCorrect = userAnswer === q.correctOptionIndex;
                  const letters = ["A", "B", "C", "D"];

                  return (
                    <Card
                      key={idx}
                      className={cn(
                        "border shadow-2xs",
                        isCorrect ? "border-emerald-500/30 bg-emerald-500/5" : "border-rose-500/30 bg-rose-500/5"
                      )}
                    >
                      <CardContent className="p-4 space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground">
                            <span className="font-bold mr-1">Q{idx + 1}.</span> {q.questionText}
                          </span>
                          <Badge
                            variant={isCorrect ? "default" : "destructive"}
                            className="text-[10px] h-5 px-1.5 shrink-0"
                          >
                            {isCorrect ? "Correct" : "Incorrect"}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          <div className="p-2 rounded bg-card border border-border/60">
                            <span className="text-muted-foreground block text-[10px]">Your Answer:</span>
                            <span className={cn("font-medium", isCorrect ? "text-emerald-600 font-bold" : "text-rose-600 font-bold")}>
                              {userAnswer !== undefined ? `${letters[userAnswer]}. ${q.options[userAnswer]}` : "Not Answered"}
                            </span>
                          </div>

                          <div className="p-2 rounded bg-card border border-border/60">
                            <span className="text-muted-foreground block text-[10px]">Correct Answer:</span>
                            <span className="font-bold text-emerald-600">
                              {letters[q.correctOptionIndex]}. {q.options[q.correctOptionIndex]}
                            </span>
                          </div>
                        </div>

                        {q.explanation && (
                          <div className="p-2.5 rounded bg-muted/50 text-[11px] text-muted-foreground border-l-2 border-primary">
                            <strong className="text-foreground">Explanation:</strong> {q.explanation}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-border/50">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setUserAnswers({});
                    setCurrentQIndex(0);
                    setSimSubmitted(false);
                    setSimTimeRemaining((simAssessment?.timeLimitMinutes || 30) * 60);
                  }}
                  className="gap-1.5"
                >
                  <RotateCcw className="h-3.5 w-3.5" /> Retake Test
                </Button>

                <Button size="sm" onClick={() => setIsSimulationOpen(false)}>
                  Close Simulation
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
