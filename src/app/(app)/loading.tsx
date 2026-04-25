import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div
      className="flex flex-col gap-2 overflow-hidden"
      style={{
        height:
          "calc(100dvh - 3.5rem - 3.75rem - env(safe-area-inset-bottom, 0px))",
      }}
    >
      <Skeleton className="h-[72px] rounded-xl" />
      <div className="grid grid-cols-3 gap-1.5">
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
        <Skeleton className="h-[52px] rounded-xl" />
      </div>
      <Skeleton className="flex-1 min-h-0 rounded-xl" />
    </div>
  );
}
