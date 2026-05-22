import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="section-band">
      <div className="page-shell space-y-4">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-80 w-full" />
      </div>
    </div>
  );
}
