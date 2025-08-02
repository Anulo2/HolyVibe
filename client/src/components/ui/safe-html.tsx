import DOMPurify from "dompurify";

interface SafeHTMLProps {
  content: string;
  className?: string;
}

export function SafeHTML({ content, className = "" }: SafeHTMLProps) {
  // Sanitize the HTML content to prevent XSS attacks
  const sanitizedHTML = DOMPurify.sanitize(content, {
    ALLOWED_TAGS: [
      "p",
      "br",
      "strong",
      "em",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "blockquote",
      "a",
    ],
    ALLOWED_ATTR: ["href", "title"],
    ALLOW_DATA_ATTR: false,
  });

  return (
    <div
      className={`text-sm leading-relaxed text-foreground max-w-none [&_h1]:text-2xl [&_h1]:font-semibold [&_h1]:mt-6 [&_h1]:mb-2 [&_h1]:leading-tight [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:mt-5 [&_h2]:mb-2 [&_h2]:leading-tight [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mt-4 [&_h3]:mb-2 [&_h3]:leading-tight [&_p]:my-4 [&_p]:leading-relaxed [&_strong]:font-semibold [&_em]:italic [&_ul]:my-4 [&_ul]:pl-6 [&_ol]:my-4 [&_ol]:pl-6 [&_li]:my-2 [&_ul>li]:list-disc [&_ol>li]:list-decimal [&_blockquote]:italic [&_blockquote]:font-medium [&_blockquote]:text-muted-foreground [&_blockquote]:border-l-4 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:my-6 [&_a]:text-primary [&_a]:underline [&_a:hover]:text-primary/80 ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
