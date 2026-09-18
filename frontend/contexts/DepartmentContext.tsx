"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { apiClient } from "@/lib/api-client";

export interface DepartmentOption {
  code: string;
  name: string;
}

export const DEFAULT_DEPARTMENTS: DepartmentOption[] = [
  { code: "CSE", name: "Computer Science & Engineering" },
  { code: "IT", name: "Information Technology" },
  { code: "ECE", name: "Electronics & Communication" },
  { code: "MECH", name: "Mechanical Engineering" },
  { code: "CIVIL", name: "Civil Engineering" },
  { code: "AI & DS", name: "Artificial Intelligence & Data Science" },
  { code: "EE", name: "Electrical Engineering" },
];

interface DepartmentContextType {
  selectedDepartment: string;
  selectedDepartmentCode: string;
  setSelectedDepartment: (dept: string) => void;
  departments: DepartmentOption[];
  departmentCodes: string[];
  isLoadingDepartments: boolean;
  refreshDepartments: () => Promise<void>;
  getDepartmentName: (code: string) => string;
  getDepartmentCode: (name: string) => string;
  isDepartmentMatch: (branches: string | string[] | null | undefined, deptCode?: string) => boolean;
}

const DepartmentContext = createContext<DepartmentContextType>({
  selectedDepartment: "All Departments",
  selectedDepartmentCode: "ALL",
  setSelectedDepartment: () => {},
  departments: DEFAULT_DEPARTMENTS,
  departmentCodes: DEFAULT_DEPARTMENTS.map((d) => d.code),
  isLoadingDepartments: false,
  refreshDepartments: async () => {},
  getDepartmentName: (code) => code,
  getDepartmentCode: (name) => name,
  isDepartmentMatch: () => true,
});

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartmentState, setSelectedDepartmentState] = useState("All Departments");
  const [departments, setDepartments] = useState<DepartmentOption[]>(DEFAULT_DEPARTMENTS);
  const [isLoadingDepartments, setIsLoadingDepartments] = useState(false);

  const refreshDepartments = useCallback(async () => {
    try {
      setIsLoadingDepartments(true);
      const res = await apiClient.get<{ departments: Array<{ code: string; name: string }> }>("/tpo/departments");
      if (res && Array.isArray(res.departments) && res.departments.length > 0) {
        const mapped = res.departments.map((d) => ({
          code: String(d.code).trim().toUpperCase(),
          name: String(d.name).trim(),
        }));
        setDepartments(mapped);
      }
    } catch (err) {
      console.warn("Could not fetch dynamic departments from /tpo/departments, falling back to defaults", err);
    } finally {
      setIsLoadingDepartments(false);
    }
  }, []);

  useEffect(() => {
    refreshDepartments();
  }, [refreshDepartments]);

  const setSelectedDepartment = useCallback((val: string) => {
    if (!val || val === "ALL" || val === "All Departments" || val === "All Branches") {
      setSelectedDepartmentState("All Departments");
      return;
    }
    const match = departments.find(
      (d) =>
        d.code.toUpperCase() === val.toUpperCase() ||
        d.name.toLowerCase() === val.toLowerCase()
    );
    if (match) {
      setSelectedDepartmentState(match.name);
    } else {
      setSelectedDepartmentState(val);
    }
  }, [departments]);

  // If currently selected department is deleted, reset to 'All Departments'
  useEffect(() => {
    if (selectedDepartmentState && selectedDepartmentState !== "All Departments" && selectedDepartmentState !== "ALL") {
      const exists = departments.some(
        (d) =>
          d.code.toUpperCase() === selectedDepartmentState.toUpperCase() ||
          d.name.toLowerCase() === selectedDepartmentState.toLowerCase()
      );
      if (!exists) {
        setSelectedDepartmentState("All Departments");
      }
    }
  }, [departments, selectedDepartmentState]);

  const departmentCodes = useMemo(() => departments.map((d) => d.code), [departments]);

  const selectedDepartmentCode = useMemo(() => {
    if (!selectedDepartmentState || selectedDepartmentState === "All Departments" || selectedDepartmentState === "ALL") {
      return "ALL";
    }
    const match = departments.find(
      (d) => d.code.toUpperCase() === selectedDepartmentState.toUpperCase() || d.name.toLowerCase() === selectedDepartmentState.toLowerCase()
    );
    return match ? match.code : selectedDepartmentState.toUpperCase();
  }, [selectedDepartmentState, departments]);

  const getDepartmentName = useCallback(
    (code: string) => {
      if (!code || code === "ALL") return "All Departments";
      const match = departments.find((d) => d.code.toUpperCase() === code.toUpperCase());
      return match ? match.name : code;
    },
    [departments]
  );

  const getDepartmentCode = useCallback(
    (name: string) => {
      if (!name || name === "All Departments") return "ALL";
      const match = departments.find(
        (d) => d.name.toLowerCase() === name.toLowerCase() || d.code.toUpperCase() === name.toUpperCase()
      );
      return match ? match.code : name;
    },
    [departments]
  );

  const isDepartmentMatch = useCallback(
    (branches: string | string[] | null | undefined, deptCode?: string) => {
      const target = deptCode || selectedDepartmentCode;
      if (!target || target === "ALL") return true;
      if (!branches) return false;
      const list = Array.isArray(branches) ? branches : [branches];
      return list.some((b) => {
        const u = String(b).toUpperCase();
        return (
          u === target.toUpperCase() ||
          u === "ALL" ||
          u === "ALL DEPARTMENTS" ||
          (target === "CSE" && (u === "CS" || u === "COMPUTER SCIENCE" || u.includes("COMPUTER SCIENCE")))
        );
      });
    },
    [selectedDepartmentCode]
  );

  return (
    <DepartmentContext.Provider
      value={{
        selectedDepartment: selectedDepartmentState,
        selectedDepartmentCode,
        setSelectedDepartment,
        departments,
        departmentCodes,
        isLoadingDepartments,
        refreshDepartments,
        getDepartmentName,
        getDepartmentCode,
        isDepartmentMatch,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  return useContext(DepartmentContext);
}
