import ReactMarkdown, { type Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import GithubSlugger from "github-slugger";

/**
 * Renders post.content as markdown, styled from the app's own design
 * tokens rather than a generic typography plugin. Heading ids come from a
 * fresh GithubSlugger walking headings in source order — lib/blog.ts's
 * extractHeadings() does the same for the table of contents, so as long as
 * both start fresh and see headings in the same order, the ids always
 * agree without the two passes needing to share any state.
 */
export function PostContent({ markdown }: { markdown: string }) {
  const slugger = new GithubSlugger();

  function headingId(children: React.ReactNode): string {
    const text = childrenToText(children);
    return slugger.slug(text);
  }

  const components: Components = {
    h1: ({ children }) => (
      <h2
        id={headingId(children)}
        className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight"
      >
        {children}
      </h2>
    ),
    h2: ({ children }) => (
      <h2
        id={headingId(children)}
        className="mt-10 scroll-mt-24 text-2xl font-semibold tracking-tight"
      >
        {children}
      </h2>
    ),
    h3: ({ children }) => (
      <h3
        id={headingId(children)}
        className="mt-8 scroll-mt-24 text-xl font-semibold tracking-tight"
      >
        {children}
      </h3>
    ),
    p: ({ children }) => (
      <p className="text-muted-foreground mt-4 leading-relaxed">{children}</p>
    ),
    a: ({ href, children }) => (
      <a
        href={href}
        className="text-primary underline underline-offset-2 hover:no-underline"
        target={href?.startsWith("http") ? "_blank" : undefined}
        rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
      >
        {children}
      </a>
    ),
    ul: ({ children }) => (
      <ul className="text-muted-foreground mt-4 list-disc space-y-2 pl-5">
        {children}
      </ul>
    ),
    ol: ({ children }) => (
      <ol className="text-muted-foreground mt-4 list-decimal space-y-2 pl-5">
        {children}
      </ol>
    ),
    li: ({ children }) => <li className="leading-relaxed">{children}</li>,
    blockquote: ({ children }) => (
      <blockquote className="border-primary text-foreground mt-4 border-l-2 pl-4 italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-muted rounded px-1.5 py-0.5 text-sm">{children}</code>
    ),
    strong: ({ children }) => (
      <strong className="text-foreground font-semibold">{children}</strong>
    ),
  };

  return (
    <div className="text-base">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {markdown}
      </ReactMarkdown>
    </div>
  );
}

function childrenToText(children: React.ReactNode): string {
  if (typeof children === "string") return children;
  if (typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (
    children &&
    typeof children === "object" &&
    "props" in children &&
    (children as { props?: { children?: React.ReactNode } }).props
  ) {
    return childrenToText(
      (children as { props: { children?: React.ReactNode } }).props.children
    );
  }
  return "";
}
