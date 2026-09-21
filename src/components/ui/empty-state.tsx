import { SearchX } from "lucide-react";

export function EmptyState({
  icon: Icon = SearchX,
  title,
  description,
  action
}: {
  icon?: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-4 py-14 text-center">
      <span className="grid h-12 w-12 place-items-center rounded-full bg-secondary">
        <Icon className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
      </span>
      <p className="font-serif text-xl">{title}</p>
      <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">{description}</p>
      {action}
    </div>
  );
}
