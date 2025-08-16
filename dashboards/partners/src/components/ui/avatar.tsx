import * as AvatarPrimitive from "@radix-ui/react-avatar"

import { cn } from "@/lib/utils"

// @ts-ignore
function Avatar({ className, ...props }) {
    return (
        <AvatarPrimitive.Root
            className={cn(
                "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                className
            )}
            {...props}
        />
    )
}

// @ts-ignore
function AvatarImage({ className, ...props }) {
    return (
        <AvatarPrimitive.Image
            className={cn("aspect-square h-full w-full", className)}
            {...props}
        />
    )
}

// @ts-ignore
function AvatarFallback({ className, ...props }) {
    return (
        <AvatarPrimitive.Fallback
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
}

export { Avatar, AvatarImage, AvatarFallback }