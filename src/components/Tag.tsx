import Link from "next/link";

export function Tag({ name, href }: { name: string; href?: string }) {
  const cls = "text-sm text-muted";
  if (!href) return <span className={cls}>#{name}</span>;
  return (
    <Link href={href} className={`${cls} underline-offset-4 hover:text-accent hover:underline`}>
      #{name}
    </Link>
  );
}
