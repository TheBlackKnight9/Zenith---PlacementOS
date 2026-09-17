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
});

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");
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

  // If currently selected department is deleted, reset to 'All Departments'
  useEffect(() => {
    if (selectedDepartment && selectedDepartment !== "All Departments" && selectedDepartment !== "ALL") {
      const exists = departments.some(
        (d) =>
          d.code.toUpperCase() === selectedDepartment.toUpperCase() ||
          d.name.toLowerCase() === selectedDepartment.toLowerCase()
      );
      if (!exists) {
        setSelectedDepartment("All Departments");
      }
    }
  }, [departments, selectedDepartment]);

  const departmentCodes = useMemo(() => departments.map((d) => d.code), [departments]);

  const selectedDepartmentCode = useMemo(() => {
    if (!selectedDepartment || selectedDepartment === "All Departments" || selectedDepartment === "ALL") {
      return "ALL";
    }
    const match = departments.find(
      (d) => d.code.toUpperCase() === selectedDepartment.toUpperCase() || d.name.toLowerCase() === selectedDepartment.toLowerCase()
    );
    return match ? match.code : selectedDepartment.toUpperCase();
  }, [selectedDepartment, departments]);

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

  return (
    <DepartmentContext.Provider
      value={{
        selectedDepartment,
        selectedDepartmentCode,
        setSelectedDepartment,
        departments,
        departmentCodes,
        isLoadingDepartments,
        refreshDepartments,
        getDepartmentName,
        getDepartmentCode,
      }}
    >
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  return useContext(DepartmentContext);
}
