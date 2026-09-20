"use client";

import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  X,
  Loader2,
  Users,
  Briefcase,
  Building2,
  LayoutDashboard,
  FileCheck2,
  CalendarClock,
  BookOpen,
  CheckSquare,
  BarChart3,
  FileText,
  CornerDownLeft,
  ArrowRight,
  ExternalLink,
  GraduationCap,
  Sparkles,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { apiClient } from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface StudentResult {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  batchYear: number;
  cgpa: number | null;
  email: string | null;
  placementStatus: boolean;
  path: string;
}

interface DriveResult {
  id: string;
  companyName: string;
  companyLogo: string | null;
  jobRole: string;
  packageCtc: number | null;
  location: string;
  status: string;
  driveType: string;
  deadline: string;
  driveDate: string | null;
  path: string;
}

interface DepartmentResult {
  code: string;
  name: string;
  coordinator: string;
  path: string;
}

interface QuickLinkResult {
  name: string;
  path: string;
  category: string;
  icon: string;
}

interface SearchResponse {
  query: string;
  totalCount: number;
  students: StudentResult[];
  drives: DriveResult[];
  departments: DepartmentResult[];
  quickLinks: QuickLinkResult[];
}

const DEFAULT_QUICK_LINKS: QuickLinkResult[] = [
  { name: "Students Directory", path: "/tpo/students", category: "Directory", icon: "Users" },
  { name: "Placement Drives", path: "/tpo/placement-drives", category: "Recruitment", icon: "Briefcase" },
  { name: "Institutional Analytics", path: "/tpo/analytics", category: "Analytics", icon: "BarChart3" },
  { name: "Academic Departments", path: "/tpo/departments", category: "Faculties", icon: "Building2" },
  { name: "Interview Schedules", path: "/tpo/interviews", category: "Interviews", icon: "CalendarClock" },
  { name: "Skill Assessments", path: "/tpo/assessments", category: "Tests", icon: "CheckSquare" },
];

export function GlobalSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SearchResponse>({
    query: "",
    totalCount: 0,
    students: [],
    drives: [],
    departments: [],
    quickLinks: [],
  });
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keyboard shortcut: Ctrl+K or Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Dismiss dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced Search API query
  const performSearch = useCallback(async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed) {
      setIsLoading(false);
      setResults({
        query: "",
        totalCount: 0,
        students: [],
        drives: [],
        departments: [],
        quickLinks: [],
      });
      return;
    }

    setIsLoading(true);
    try {
      const data = await apiClient.get<SearchResponse>(
        `/tpo/global-search?q=${encodeURIComponent(trimmed)}`
      );
      setResults(data);
      setSelectedIndex(-1);
    } catch (err) {
      console.error("Global search error:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    setIsOpen(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!val.trim()) {
      setIsLoading(false);
      setResults({
        query: "",
        totalCount: 0,
        students: [],
        drives: [],
        departments: [],
        quickLinks: [],
      });
      return;
    }

    setIsLoading(true);
    debounceTimerRef.current = setTimeout(() => {
      performSearch(val);
    }, 220);
  };

  const handleClear = () => {
    setQuery("");
    setResults({
      query: "",
      totalCount: 0,
      students: [],
      drives: [],
      departments: [],
      quickLinks: [],
    });
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const navigateTo = (path: string, eventDetail?: { type: string; value: string }) => {
    setIsOpen(false);
    if (eventDetail) {
      window.dispatchEvent(new CustomEvent(eventDetail.type, { detail: eventDetail.value }));
    }
    router.push(path);
  };

  // Flatten active result items for keyboard arrow navigation
  const flatItems = useMemo(() => {
    const items: Array<{
      id: string;
      title: string;
      subtitle?: string;
      action: () => void;
      group: string;
    }> = [];

    if (!query.trim()) {
      // If empty query, flatten default quick links
      DEFAULT_QUICK_LINKS.forEach((ql) => {
        items.push({
          id: `default-ql-${ql.path}`,
          title: ql.name,
          subtitle: ql.category,
          group: "Quick Jump",
          action: () => navigateTo(ql.path),
        });
      });
      return items;
    }

    // Quick links
    results.quickLinks.forEach((ql) => {
      items.push({
        id: `ql-${ql.path}`,
        title: ql.name,
        subtitle: ql.category,
        group: "Quick Navigation",
        action: () => navigateTo(ql.path),
      });
    });

    // Students
    results.students.forEach((s) => {
      items.push({
        id: `student-${s.id}`,
        title: s.name,
        subtitle: `${s.rollNumber} • ${s.department} • CGPA: ${s.cgpa ?? "N/A"}`,
        group: "Students",
        action: () =>
          navigateTo(s.path, { type: "tpo:search", value: s.rollNumber }),
      });
    });

    // Drives
    results.drives.forEach((d) => {
      items.push({
        id: `drive-${d.id}`,
        title: d.companyName,
        subtitle: `${d.jobRole} • ${d.packageCtc ? `${d.packageCtc} LPA` : "Stipend"} • ${d.location}`,
        group: "Placement Drives",
        action: () =>
          navigateTo(d.path, { type: "tpo:search-drives", value: d.companyName }),
      });
    });

    // Departments
    results.departments.forEach((dept) => {
      items.push({
        id: `dept-${dept.code}`,
        title: `${dept.code} - ${dept.name}`,
        subtitle: `Coordinator: ${dept.coordinator}`,
        group: "Departments",
        action: () => navigateTo(dept.path),
      });
    });

    // Fallback "View all student matches"
    if (results.students.length > 0) {
      items.push({
        id: `view-all-students-${query}`,
        title: `View all student matches for "${query}"`,
        subtitle: "Open filtered Students Directory",
        group: "Actions",
        action: () =>
          navigateTo(`/tpo/students?search=${encodeURIComponent(query.trim())}`, {
            type: "tpo:search",
            value: query.trim(),
          }),
      });
    }

    return items;
  }, [query, results]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < flatItems.length - 1 ? prev + 1 : 0));
      return;
    }

    if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatItems.length - 1));
      return;
    }

    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < flatItems.length) {
        flatItems[selectedIndex].action();
      } else if (query.trim()) {
        // Default to deep student directory search on Enter
        navigateTo(`/tpo/students?search=${encodeURIComponent(query.trim())}`, {
          type: "tpo:search",
          value: query.trim(),
        });
      }
    }
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case "Users":
        return <Users className="h-4 w-4" />;
      case "Briefcase":
        return <Briefcase className="h-4 w-4" />;
      case "Building2":
      case "Building":
        return <Building2 className="h-4 w-4" />;
      case "BarChart3":
        return <BarChart3 className="h-4 w-4" />;
      case "CalendarClock":
        return <CalendarClock className="h-4 w-4" />;
      case "CheckSquare":
        return <CheckSquare className="h-4 w-4" />;
      case "FileText":
        return <FileText className="h-4 w-4" />;
      case "FileCheck2":
        return <FileCheck2 className="h-4 w-4" />;
      case "BookOpen":
        return <BookOpen className="h-4 w-4" />;
      case "LayoutDashboard":
        return <LayoutDashboard className="h-4 w-4" />;
      default:
        return <Sparkles className="h-4 w-4" />;
    }
  };

  const hasAnyResults =
    results.students.length > 0 ||
    results.drives.length > 0 ||
    results.departments.length > 0 ||
    results.quickLinks.length > 0;

  return (
    <div ref={containerRef} className="relative">
      {/* Search Input Container */}
      <div className="relative flex items-center">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search students, drives, companies..."
          className="pl-9 pr-14 w-[240px] sm:w-[280px] lg:w-[320px] h-8 text-xs bg-background border-input rounded-lg shadow-2xs focus-visible:ring-1 focus-visible:ring-primary/40 focus-visible:border-primary transition-all placeholder:text-muted-foreground/70"
          aria-label="Search PlacementOS"
        />

        {/* Right side controls: Clear / Loading / Shortcut badge */}
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {isLoading ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          ) : query ? (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
              title="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          ) : (
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium font-mono text-muted-foreground bg-muted/80 border border-border rounded shadow-2xs select-none pointer-events-none">
              <span className="text-[9px]">⌘</span>K
            </kbd>
          )}
        </div>
      </div>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="search-popover-surface absolute left-0 top-full mt-1.5 w-[360px] sm:w-[460px] md:w-[500px] max-h-[460px] overflow-y-auto rounded-xl border border-border shadow-2xl z-50 animate-in fade-in-0 zoom-in-95 duration-150 flex flex-col divide-y divide-border">
          
          {/* Header Banner */}
          <div className="px-3.5 py-2 bg-muted/60 dark:bg-[#141618] flex items-center justify-between text-[11px] text-muted-foreground shrink-0">
            <span className="font-medium flex items-center gap-1.5">
              {isLoading ? (
                <>
                  <Loader2 className="h-3 w-3 animate-spin text-primary" />
                  Searching PlacementOS...
                </>
              ) : query.trim() ? (
                hasAnyResults ? (
                  `Found ${results.totalCount} result${results.totalCount === 1 ? "" : "s"} for "${query.trim()}"`
                ) : (
                  `No matching records for "${query.trim()}"`
                )
              ) : (
                "Quick Navigation & Shortcuts"
              )}
            </span>
            <span className="text-[10px] font-mono text-muted-foreground/80">ESC to close</span>
          </div>

          {/* Body Section */}
          <div className="p-1.5 space-y-3 overflow-y-auto">

            {/* Empty Query State: Show Recommended Quick Links */}
            {!query.trim() && (
              <div className="space-y-1">
                <div className="px-2 py-1 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Jump to Destination
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
                  {DEFAULT_QUICK_LINKS.map((ql, idx) => {
                    const isSelected = selectedIndex === idx;
                    return (
                      <button
                        key={ql.path}
                        type="button"
                        onClick={() => navigateTo(ql.path)}
                        className={cn(
                          "w-full text-left p-2 rounded-lg flex items-center gap-2.5 transition-colors cursor-pointer",
                          isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
                        )}
                      >
                        <div className="p-1.5 rounded-md bg-muted text-foreground">
                          {renderIcon(ql.icon)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-medium truncate">{ql.name}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{ql.category}</div>
                        </div>
                        <ArrowRight className="h-3 w-3 text-muted-foreground/50 shrink-0" />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Query Entered: Render Categorized Results */}
            {query.trim() && (
              <>
                {/* 1. Quick Navigation Matches */}
                {results.quickLinks.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Pages & Actions
                    </div>
                    {results.quickLinks.map((ql) => {
                      const flatIdx = flatItems.findIndex((fi) => fi.id === `ql-${ql.path}`);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={ql.path}
                          type="button"
                          onClick={() => navigateTo(ql.path)}
                          className={cn(
                            "w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer",
                            isSelected ? "bg-primary/10 text-primary" : "hover:bg-muted text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-foreground shrink-0">
                              {renderIcon(ql.icon)}
                            </div>
                            <span className="text-xs font-semibold truncate">{ql.name}</span>
                          </div>
                          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-border bg-card">
                            {ql.category}
                          </Badge>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 2. Students */}
                {results.students.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Students ({results.students.length})</span>
                      <span className="text-[9px] lowercase font-normal">click to open profile in directory</span>
                    </div>
                    {results.students.map((student) => {
                      const flatIdx = flatItems.findIndex((fi) => fi.id === `student-${student.id}`);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={student.id}
                          type="button"
                          onClick={() =>
                            navigateTo(student.path, { type: "tpo:search", value: student.rollNumber })
                          }
                          className={cn(
                            "w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer",
                            isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
                          )}
                        >
                          <Avatar className="h-7 w-7 rounded-md border border-border shrink-0">
                            <AvatarFallback className="text-[10px] font-bold bg-primary/15 text-primary">
                              {student.name.substring(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs font-bold text-foreground truncate">{student.name}</span>
                              <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono font-medium">
                                {student.rollNumber}
                              </Badge>
                              {student.placementStatus && (
                                <Badge className="text-[8px] px-1 py-0 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/25">
                                  Placed
                                </Badge>
                              )}
                            </div>
                            <div className="text-[11px] text-muted-foreground flex items-center gap-2 mt-0.5 truncate">
                              <span>Dept: {student.department}</span>
                              <span>•</span>
                              <span>CGPA: {student.cgpa !== null ? Number(student.cgpa).toFixed(2) : "N/A"}</span>
                              {student.email && (
                                <>
                                  <span>•</span>
                                  <span className="truncate">{student.email}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <CornerDownLeft className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 3. Placement Drives */}
                {results.drives.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                      <span>Placement Drives & Companies ({results.drives.length})</span>
                    </div>
                    {results.drives.map((drive) => {
                      const flatIdx = flatItems.findIndex((fi) => fi.id === `drive-${drive.id}`);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={drive.id}
                          type="button"
                          onClick={() =>
                            navigateTo(drive.path, { type: "tpo:search-drives", value: drive.companyName })
                          }
                          className={cn(
                            "w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer",
                            isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
                          )}
                        >
                          <div className="h-7 w-7 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                            <Building2 className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground truncate">{drive.companyName}</span>
                              {drive.packageCtc ? (
                                <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                  {drive.packageCtc} LPA
                                </Badge>
                              ) : null}
                              <Badge variant="outline" className="text-[9px] px-1 py-0 uppercase">
                                {drive.status}
                              </Badge>
                            </div>
                            <div className="text-[11px] text-muted-foreground truncate mt-0.5">
                              {drive.jobRole} • {drive.location}
                            </div>
                          </div>
                          <ExternalLink className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 4. Departments */}
                {results.departments.length > 0 && (
                  <div className="space-y-1">
                    <div className="px-2 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      Academic Departments
                    </div>
                    {results.departments.map((dept) => {
                      const flatIdx = flatItems.findIndex((fi) => fi.id === `dept-${dept.code}`);
                      const isSelected = flatIdx === selectedIndex;
                      return (
                        <button
                          key={dept.code}
                          type="button"
                          onClick={() => navigateTo(dept.path)}
                          className={cn(
                            "w-full text-left p-2 rounded-lg flex items-center gap-3 transition-colors cursor-pointer",
                            isSelected ? "bg-primary/10 text-primary border border-primary/20" : "hover:bg-muted text-foreground"
                          )}
                        >
                          <div className="h-7 w-7 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/20">
                            <GraduationCap className="h-3.5 w-3.5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">{dept.code}</span>
                              <span className="text-xs text-muted-foreground truncate">{dept.name}</span>
                            </div>
                            <div className="text-[10px] text-muted-foreground/80">
                              Coordinator: {dept.coordinator}
                            </div>
                          </div>
                          <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* 5. Deep Search in Students Directory */}
                {results.students.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      navigateTo(`/tpo/students?search=${encodeURIComponent(query.trim())}`, {
                        type: "tpo:search",
                        value: query.trim(),
                      })
                    }
                    className="w-full text-center py-2 px-3 rounded-lg text-xs font-medium text-primary hover:bg-primary/10 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>View all matching students in directory</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                )}

                {/* No Results Fallback */}
                {!hasAnyResults && !isLoading && (
                  <div className="py-6 px-4 text-center space-y-2">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
                      <Search className="h-5 w-5" />
                    </div>
                    <div className="text-xs font-semibold text-foreground">
                      No results found for &ldquo;{query.trim()}&rdquo;
                    </div>
                    <p className="text-[11px] text-muted-foreground max-w-xs mx-auto">
                      Try searching by student roll number, full name, company name, department code (e.g. CSE, ECE), or platform features.
                    </p>
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={() =>
                          navigateTo(`/tpo/students?search=${encodeURIComponent(query.trim())}`, {
                            type: "tpo:search",
                            value: query.trim(),
                          })
                        }
                        className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1 cursor-pointer"
                      >
                        Search &ldquo;{query.trim()}&rdquo; across entire student records database →
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer Shortcuts Guide */}
          <div className="px-3.5 py-1.5 bg-muted/60 dark:bg-[#141618] border-t border-border text-[10px] text-muted-foreground flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-card px-1 py-0.5 rounded border border-border text-[9px]">↑</kbd>
                <kbd className="font-mono bg-card px-1 py-0.5 rounded border border-border text-[9px]">↓</kbd>
                to navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="font-mono bg-card px-1 py-0.5 rounded border border-border text-[9px]">↵</kbd>
                to open
              </span>
            </div>
            <span>Global Search</span>
          </div>

        </div>
      )}
    </div>
  );
}
