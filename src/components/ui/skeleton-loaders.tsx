import { cn } from "@/lib/utils";

// Doctor Card Skeleton
export function DoctorCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex items-center gap-3 p-4 rounded-xl border border-border bg-card">
        {/* Avatar Skeleton */}
        <div className="size-12 bg-muted rounded-full"></div>
        
        {/* Content Skeleton */}
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-3/4"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
          <div className="h-3 bg-muted rounded w-1/3"></div>
        </div>
        
        {/* Selector Skeleton */}
        <div className="size-6 bg-muted rounded-full"></div>
      </div>
    </div>
  );
}

// Date Card Skeleton
export function DateCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="p-3 rounded-lg border border-border bg-card">
        <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
        <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
      </div>
    </div>
  );
}

// Time Slot Skeleton
export function TimeSlotSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="p-3 rounded-lg border border-border bg-card text-center">
        <div className="h-4 bg-muted rounded w-2/3 mx-auto"></div>
      </div>
    </div>
  );
}

// Form Field Skeleton
export function FormFieldSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="space-y-2">
        <div className="h-4 bg-muted rounded w-1/4"></div>
        <div className="h-10 bg-muted rounded w-full"></div>
      </div>
    </div>
  );
}

// Radio Option Skeleton
export function RadioOptionSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="flex items-center space-x-2 p-4 border rounded-lg bg-card">
        <div className="w-4 h-4 border-2 border-border rounded-full"></div>
        <div className="h-4 bg-muted rounded w-3/4"></div>
      </div>
    </div>
  );
}

// Section Header Skeleton
export function SectionHeaderSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse text-center", className)}>
      <div className="h-6 bg-muted rounded w-48 mx-auto mb-2"></div>
      <div className="h-4 bg-muted rounded w-64 mx-auto"></div>
    </div>
  );
}

// Doctor List Skeleton
export function DoctorListSkeleton({ count = 4, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-3", className)}>
      {[...Array(count)].map((_, index) => (
        <DoctorCardSkeleton key={index} />
      ))}
      <div className="text-center mt-6">
        <p className="text-sm text-muted-foreground">Loading healthcare providers...</p>
      </div>
    </div>
  );
}

// Date Grid Skeleton
export function DateGridSkeleton({ count = 10, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Loading available dates...</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {[...Array(count)].map((_, index) => (
          <DateCardSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}

// Time Slots Grid Skeleton
export function TimeSlotsGridSkeleton({ count = 8, className }: { count?: number; className?: string }) {
  return (
    <div className={cn("space-y-4", className)}>
      <div className="text-center mb-4">
        <p className="text-sm text-muted-foreground">Loading available times...</p>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {[...Array(count)].map((_, index) => (
          <TimeSlotSkeleton key={index} />
        ))}
      </div>
    </div>
  );
}
