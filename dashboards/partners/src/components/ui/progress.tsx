import * as ProgressPrimitive from "@radix-ui/react-progress"

import { cn } from "@/lib/utils"

// @ts-ignore
const Progress = ({ className, value, ...props }) => {
    return (
        <ProgressPrimitive.Root
            className={cn(
                "relative h-4 w-full overflow-hidden rounded-full bg-secondary",
                className
            )}
            {...props}
        >
            <ProgressPrimitive.Indicator
                className="h-full w-full flex-1 bg-primary transition-all"
                style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
            />
        </ProgressPrimitive.Root>
    )
}

export { Progress }