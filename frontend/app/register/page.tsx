"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { setAuthSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { TypographyH2, TypographyMuted } from "@/components/ui/typography";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const DEPARTMENTS = ["CSE", "IT", "ECE", "MECH", "CIVIL"];

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    rollNumber: "",
    department: "CSE",
    batchYear: "2027",
    cgpa: "",
    phone: "",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleDepartmentChange = (val: string) => {
    setFormData((prev) => ({
      ...prev, 
      department: val,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        role: "STUDENT",
        batchYear: parseInt(formData.batchYear, 10),
        cgpa: parseFloat(formData.cgpa),
      };

      const data = await apiClient.post<{ token: string; user: any }>("/auth/register", payload, {
        requiresAuth: false,
      });

      setAuthSession(data.token, data.user);
      router.push("/student/dashboard");
    } catch (err: any) {
      setError(err.message || "Registration failed. Please check your inputs.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-background text-foreground px-4 py-12 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-xl space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/25 mb-1">
            <GraduationCap className="h-6 w-6" />
          </div>
          <TypographyH2 className="border-none pb-0 text-foreground">Student Registration</TypographyH2>
          <TypographyMuted>Create your PlacementOS profile to discover eligible drives</TypographyMuted>
        </div>

        {/* Form Card */}
        <Card className="border-border bg-card text-card-foreground shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl">Student Details</CardTitle>
            <CardDescription>Academic metrics are verified against college registry records</CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs font-medium">
                  {error}
                </div>
              )}

              {/* Name Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">First Name</label>
                  <Input
                    name="firstName"
                    required
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Last Name</label>
                  <Input
                    name="lastName"
                    required
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
              </div>

              {/* Email & Password */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">College Email</label>
                  <Input
                    type="email"
                    name="email"
                    required
                    placeholder="rollnumber@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Password</label>
                  <Input
                    type="password"
                    name="password"
                    required
                    placeholder="Min 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
              </div>

              {/* Academic Details */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Roll Number</label>
                  <Input
                    name="rollNumber"
                    required
                    placeholder="23CS001"
                    value={formData.rollNumber}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Department</label>
                  <Select value={formData.department} onValueChange={handleDepartmentChange}>
                    <SelectTrigger className="h-10 bg-background border-input text-sm">
                      <SelectValue placeholder="Department" />
                    </SelectTrigger>
                    <SelectContent>
                      {DEPARTMENTS.map((dept) => (
                        <SelectItem key={dept} value={dept}>
                          {dept}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Batch Year</label>
                  <Input
                    type="number"
                    name="batchYear"
                    required
                    placeholder="2027"
                    value={formData.batchYear}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
              </div>

              {/* CGPA and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Current CGPA (0.00 - 10.00)</label>
                  <Input
                    type="number"
                    name="cgpa"
                    step="0.01"
                    min="0"
                    max="10"
                    required
                    placeholder="8.50"
                    value={formData.cgpa}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Contact Phone (Optional)</label>
                  <Input
                    name="phone"
                    placeholder="+91 9876543210"
                    value={formData.phone}
                    onChange={handleChange}
                    className="bg-background border-input"
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 pt-2">
              <Button type="submit" disabled={isLoading} className="w-full h-10 font-semibold">
                {isLoading ? "Creating Profile..." : "Complete Registration"}
                {!isLoading && <ArrowRight className="h-4 w-4 ml-1.5" />}
              </Button>

              <div className="text-center text-xs text-muted-foreground">
                Already registered?{" "}
                <Link href="/login" className="font-semibold text-primary hover:underline">
                  Sign In
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
