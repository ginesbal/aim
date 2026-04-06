"use client";

import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: "sm" | "md" | "lg";
  color?: "default" | "baltic" | "ash" | "cream" | "lavender";
}

export default function Card({
  className,
  padding = "md",
  color = "default",
  children,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        color === "default" && "card-base",
        color === "baltic" && "card-baltic",
        color === "ash" && "card-ash",
        color === "cream" && "card-cream",
        color === "lavender" && "card-lavender",
        padding === "sm" && "p-4",
        padding === "md" && "p-5",
        padding === "lg" && "p-7",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
