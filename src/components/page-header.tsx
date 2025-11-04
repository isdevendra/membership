import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  children?: React.ReactNode;
  className?: string;
};

export function PageHeader({ title, children, className }: PageHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-6", className)}>
      <h1 className="text-3xl font-bold tracking-tight font-headline text-primary">
        {title}
      </h1>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}
