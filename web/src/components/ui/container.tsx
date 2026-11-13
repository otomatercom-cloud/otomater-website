import { cn } from "./cn";
export const Container = ({ className, ...p }: React.HTMLAttributes<HTMLDivElement>) => <div className={cn("mx-auto w-full max-w-7xl px-5 sm:px-8", className)} {...p} />;
