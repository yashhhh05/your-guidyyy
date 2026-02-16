"use client";

import React from "react";
import Link from "next/link";
import styles from "./NavButton.module.css";
import { cn } from "@/lib/utils";

interface NavButtonProps {
  href?: string;
  className?: string;
  active?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

const NavButton = ({ href, className, active, children, onClick }: NavButtonProps) => {
  const buttonClass = cn(
    styles.btn, 
    active && styles.active, 
    className
  );
  
  const ArrowIcon = (
    <svg width="15px" height="10px" viewBox="0 0 13 10">
      <path d="M1,5 L11,5"></path>
      <polyline points="8 1 12 5 8 9"></polyline>
    </svg>
  );

  if (href) {
    return (
      <Link href={href} className={buttonClass}>
        <span>{children}</span>
        {ArrowIcon}
      </Link>
    );
  }

  return (
    <button className={buttonClass} onClick={onClick}>
      <span>{children}</span>
      {ArrowIcon}
    </button>
  );
};

export default NavButton;
