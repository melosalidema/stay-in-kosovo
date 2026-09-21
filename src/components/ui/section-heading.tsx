import { cn } from "@/lib/utils";

/**
 * Editorial section heading. Replaces the repeated
 * "tiny uppercase eyebrow + bold title" pattern with a calmer
 * hierarchy: a short label, a serif heading, and a readable lede.
 */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "start",
  action,
  className
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "start" | "center";
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        align === "center" && "sm:flex-col sm:items-center sm:text-center",
        className
      )}
    >
      <div className={cn("max-w-2xl", align === "center" && "mx-auto")}>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h2 className="display-2">{title}</h2>
        {description && <p className="lede mt-3 text-[0.9375rem] sm:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
