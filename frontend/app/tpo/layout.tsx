"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Building,
  Building2,
  Briefcase,
  FileCheck2,
  CalendarClock,
  BarChart3,
  FileText,
  Bell,
  Settings,
  LogOut,
  Search,
  Calendar as CalendarIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { DepartmentProvider, useDepartment } from "@/contexts/DepartmentContext";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const navigationItems = [
  { name: "Dashboard", href: "/tpo/dashboard", icon: LayoutDashboard },
  { name: "Students", href: "/tpo/students", icon: Users },
  { name: "Departments", href: "/tpo/departments", icon: Building },
  { name: "Placement Drives", href: "/tpo/placement-drives", icon: Briefcase },
  { name: "Applications", href: "/tpo/applications", icon: FileCheck2 },
  { name: "Interviews", href: "/tpo/interviews", icon: CalendarClock },
  { name: "Analytics", href: "/tpo/analytics", icon: BarChart3 },
  { name: "Reports", href: "/tpo/reports", icon: FileText },
];

const bottomNavItems: Array<{ name: string; href: string; icon: typeof Bell; badge?: number }> = [
  { name: "Notifications", href: "/tpo/notifications", icon: Bell, badge: 5 },
  { name: "Settings", href: "/tpo/settings", icon: Settings },
];

export default function TpoLayout({ children }: { children: React.ReactNode }) {
  return (
    <DepartmentProvider>
      <TpoLayoutContent>{children}</TpoLayoutContent>
    </DepartmentProvider>
  );
}

function TpoLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const dayStr = today.toLocaleDateString("en-IN", { weekday: "long" });

  const activePage = [...navigationItems, ...bottomNavItems].find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  );
  const pageTitle = activePage?.name || "Dashboard";

  return (
    <div className="min-h-screen flex bg-background text-foreground">
      {/* ─── Sidebar ─── */}
      <aside className="w-64 bg-card border-r border-border flex flex-col shrink-0 fixed inset-y-0 z-40 shadow-xs">
        {/* Brand Header */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-border">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <span className="text-lg font-bold tracking-tight text-foreground leading-none block">
              PlacementOS
            </span>
            <span className="text-[10px] text-primary font-semibold tracking-wider uppercase">
              TPO Administration
            </span>
          </div>
        </div>

        {/* Primary Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navigationItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
              </Link>
            );
          })}

          {/* Divider */}
          <div className="!my-3 border-t border-border" />

          {/* Bottom Nav Items */}
          {bottomNavItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm shadow-primary/25 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                )}
              >
                <Icon
                  className={cn(
                    "h-[18px] w-[18px] transition-colors",
                    isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                {item.name}
                {item.badge ? (
                  <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1.5 shadow-xs">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}

          {/* Logout */}
          <button
            onClick={logout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-150"
          >
            <LogOut className="h-[18px] w-[18px]" />
            Logout
          </button>
        </nav>

        {/* User Profile Footer */}
        <div className="p-3 border-t border-border">
          <div className="w-full flex items-center gap-3 px-2 py-2 rounded-lg bg-muted/40">
            <Avatar className="h-9 w-9 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground font-bold text-xs">
                {(user?.profile?.fullName || "Amit Sharma").slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left overflow-hidden">
              <div className="text-sm font-semibold text-foreground truncate">
                {user?.profile?.fullName || "Amit Sharma"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate font-medium">Placement Officer</div>
            </div>
          </div>
        </div>
      </aside>

      {/* ─── Main Container ─── */}
      <div className="flex-1 flex flex-col pl-64 min-w-0">
        {/* Top Navbar */}
        <header className="h-14 border-b border-border bg-card/95 backdrop-blur-md flex items-center justify-between px-5 sticky top-0 z-30">
          {/* Left: Page Title */}
          <div>
            <h1 className="text-base font-bold text-foreground leading-none">
              {pageTitle}
            </h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Welcome back, TPO 👋
            </p>
          </div>

          {/* Center: Department Filter + Search */}
          <div className="flex items-center gap-2.5">
            <DepartmentFilter />

            {/* Global Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search students, drives, companies..."
                className="pl-9 w-[240px] h-8 text-xs bg-background border-input rounded-lg"
              />
            </div>
          </div>

          {/* Right: Bell + Date + Theme Toggle */}
          <div className="flex items-center gap-3">
            <button
              aria-label="Notifications"
              className="relative p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <Bell className="h-4 w-4" />
              <span className="absolute -top-0.5 -right-0.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-primary-foreground px-1">
                5
              </span>
            </button>

            <div className="hidden sm:flex items-center gap-2 pl-1 border-l border-border">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <div className="text-left">
                <div className="text-xs font-semibold text-foreground leading-tight">{dateStr}</div>
                <div className="text-[10px] text-muted-foreground">{dayStr}</div>
              </div>
            </div>

            {/* Theme Toggle Button */}
            <ThemeToggle />
          </div>
        </header>

        {/* Page Content */}
        <main className="p-4 sm:p-5 flex-1 min-w-0">{children}</main>
      </div>
    </div>
  );
}

/* ─── Department Filter Component with Dynamic Sync ─── */
function DepartmentFilter() {
  const { selectedDepartment, setSelectedDepartment, departments } = useDepartment();

  return (
    <div className="min-w-[200px]">
      <Select value={selectedDepartment} onValueChange={setSelectedDepartment}>
        <SelectTrigger className="h-8 text-xs bg-background border-input font-medium">
          <Building2 className="h-3.5 w-3.5 text-primary mr-1 shrink-0" />
          <SelectValue placeholder="Department" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="All Departments" className="text-xs font-semibold">
            All Departments
          </SelectItem>
          {departments.map((dept) => (
            <SelectItem key={dept.code} value={dept.name} className="text-xs">
              {dept.name} ({dept.code})
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
