export function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="rounded-md bg-muted px-4 py-3 text-sm overflow-x-auto">
      <code>{children}</code>
    </pre>
  );
}
