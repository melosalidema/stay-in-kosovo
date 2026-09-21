import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="section-band">
      <div className="page-shell">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-4 h-10 w-2/3 max-w-lg" />
        <Skeleton className="mt-4 h-4 w-full max-w-md" />

        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((index) => (
            <div key={index} className="space-y-3">
              <Skeleton className="aspect-[4/3] rounded-xl" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
