"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import { Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface ChatMessageProps {
  content: string
  role: "user" | "agent"
  className?: string
}

export function ChatMessage({ content, role, className }: ChatMessageProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Erreur lors de la copie:", error)
    }
  }

  const isAgent = role === "agent"

  return (
    <div
      className={cn(
        "group relative max-w-[70%] rounded-lg px-4 py-3",
        isAgent
          ? "bg-gray-900/50 text-foreground border border-cyan-900/30"
          : "bg-cyan-500/10 text-cyan-400 border border-cyan-500/30",
        className
      )}
    >
      {/* Copy Button - Only for agent messages, visible on hover */}
      {isAgent && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleCopy}
          className={cn(
            "absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-gray-800/90 backdrop-blur-sm border border-cyan-900/40",
            "opacity-0 group-hover:opacity-100 transition-all duration-200",
            "hover:bg-gray-700 hover:border-cyan-500/60 hover:scale-110",
            "text-cyan-400 shadow-lg z-10"
          )}
          title="Copier le message"
        >
          {copied ? (
            <Check className="h-3 w-3 text-emerald-400" />
          ) : (
            <Copy className="h-3 w-3" />
          )}
        </Button>
      )}

      {/* Markdown Content */}
      <div className="markdown-content">
        <ReactMarkdown
          components={{
            // Headings
            h1: ({ children }) => (
              <h1 className={cn(
                "text-xl font-bold mt-4 mb-3 first:mt-0",
                isAgent ? "text-foreground" : "text-cyan-300"
              )}>
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className={cn(
                "text-lg font-semibold mt-3 mb-2 first:mt-0",
                isAgent ? "text-foreground" : "text-cyan-300"
              )}>
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className={cn(
                "text-base font-semibold mt-2 mb-1.5 first:mt-0",
                isAgent ? "text-foreground" : "text-cyan-300"
              )}>
                {children}
              </h3>
            ),
            // Paragraphs
            p: ({ children }) => (
              <p className={cn(
                "text-sm leading-relaxed mb-2 last:mb-0",
                isAgent ? "text-foreground" : "text-cyan-400/90"
              )}>
                {children}
              </p>
            ),
            // Bold
            strong: ({ children }) => (
              <strong className={cn(
                "font-semibold",
                isAgent ? "text-foreground" : "text-cyan-300"
              )}>
                {children}
              </strong>
            ),
            // Italic
            em: ({ children }) => (
              <em className="italic opacity-90">{children}</em>
            ),
            // Lists
            ul: ({ children }) => (
              <ul className="list-disc list-outside mb-2 space-y-1.5 ml-4 mt-1">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal list-outside mb-2 space-y-1.5 ml-4 mt-1">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-sm leading-relaxed">{children}</li>
            ),
            // Code blocks
            code: ({ className, children, ...props }: any) => {
              const isInline = !className
              if (isInline) {
                return (
                  <code
                    className={cn(
                      "px-1.5 py-0.5 rounded text-xs font-mono",
                      isAgent
                        ? "bg-gray-800/70 text-cyan-300 border border-cyan-900/30"
                        : "bg-cyan-950/50 text-cyan-200 border border-cyan-500/20"
                    )}
                    {...props}
                  >
                    {children}
                  </code>
                )
              }
              return (
                <code
                  className={cn(
                    "block rounded-lg p-3 my-3 overflow-x-auto text-xs font-mono",
                    isAgent
                      ? "bg-gray-950 border border-cyan-900/30 text-gray-300"
                      : "bg-cyan-950/30 border border-cyan-500/20 text-cyan-200"
                  )}
                  {...props}
                >
                  {children}
                </code>
              )
            },
            pre: ({ children }) => (
              <pre className="my-0">
                {children}
              </pre>
            ),
            // Links
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "underline transition-colors",
                  isAgent
                    ? "text-cyan-400 hover:text-cyan-300"
                    : "text-cyan-300 hover:text-cyan-200"
                )}
              >
                {children}
              </a>
            ),
            // Blockquotes
            blockquote: ({ children }) => (
              <blockquote className={cn(
                "border-l-4 pl-4 my-3 italic",
                isAgent
                  ? "border-cyan-500/30 text-muted-foreground"
                  : "border-cyan-400/40 text-cyan-300/80"
              )}>
                {children}
              </blockquote>
            ),
            // Horizontal rule
            hr: () => (
              <hr className={cn(
                "my-4",
                isAgent ? "border-cyan-900/30" : "border-cyan-500/30"
              )} />
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  )
}
