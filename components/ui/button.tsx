"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { type VariantProps } from "class-variance-authority"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { buttonVariants } from "./button-variants"

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: Omit<React.ComponentProps<"button">, "onDrag" | "onDragStart" | "onDragEnd" | "onAnimationStart"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : motion.button

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...(!asChild && { whileTap: { scale: 0.95 } })}
      {...props}
    />
  )
}

export { Button }
