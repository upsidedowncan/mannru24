import * as React from "react"
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible"
import { cn } from "@/lib/utils"

function Collapsible({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.Root>) {
  return <CollapsiblePrimitive.Root {...props} />
}

function CollapsibleTrigger({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleTrigger>) {
  return <CollapsiblePrimitive.CollapsibleTrigger {...props} />
}

function CollapsibleContent({ ...props }: React.ComponentProps<typeof CollapsiblePrimitive.CollapsibleContent>) {
  return <CollapsiblePrimitive.CollapsibleContent className="data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down" {...props} />
}

export { Collapsible, CollapsibleTrigger, CollapsibleContent }
