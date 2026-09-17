"use client";

import React, { createContext, useContext, useState } from "react";

interface DepartmentContextType {
  selectedDepartment: string;
  setSelectedDepartment: (dept: string) => void;
}

const DepartmentContext = createContext<DepartmentContextType>({
  selectedDepartment: "All Departments",
  setSelectedDepartment: () => {},
});

export function DepartmentProvider({ children }: { children: React.ReactNode }) {
  const [selectedDepartment, setSelectedDepartment] = useState("All Departments");

  return (
    <DepartmentContext.Provider value={{ selectedDepartment, setSelectedDepartment }}>
      {children}
    </DepartmentContext.Provider>
  );
}

export function useDepartment() {
  return useContext(DepartmentContext);
}
