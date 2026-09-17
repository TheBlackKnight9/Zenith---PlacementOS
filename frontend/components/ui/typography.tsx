import React from "react";
import { cn } from "@/lib/utils";

export function TypographyH1({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h1
      className={cn(
        "scroll-m-20 text-3xl font-extrabold tracking-tight lg:text-4xl text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h1>
  );
}

export function TypographyH2({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={cn(
        "scroll-m-20 border-b border-border pb-2 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
        className
      )}
      {...props}
    >
      {children}
    </h2>
  );
}

export function TypographyH3({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "scroll-m-20 text-xl font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function TypographyH4({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h4
      className={cn(
        "scroll-m-20 text-lg font-semibold tracking-tight text-foreground",
        className
      )}
      {...props}
    >
      {children}
    </h4>
  );
}

export function TypographyP({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn("leading-7 text-sm text-muted-foreground [&:not(:first-child)]:mt-4", className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function TypographyLead({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-base text-muted-foreground font-normal", className)} {...props}>
      {children}
    </p>
  );
}

export function TypographyLarge({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("text-lg font-semibold text-foreground", className)} {...props}>
      {children}
    </div>
  );
}

export function TypographySmall({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <small className={cn("text-sm font-medium leading-none text-foreground", className)} {...props}>
      {children}
    </small>
  );
}

export function TypographyMuted({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)} {...props}>
      {children}
    </p>
  );
}

export function TypesetDocs({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn("typeset-docs", className)} {...props}>
      {children}
    </div>
  );
}

