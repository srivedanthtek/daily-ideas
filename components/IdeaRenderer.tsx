"use client";

import React from "react";
import ReactMarkdown, { Components } from "react-markdown";
import remarkGfm from "remark-gfm";
import { MemberLock } from "@/components/MemberLock";

interface IdeaRendererProps {
  content: string;
  isLocked?: boolean;
}

export function IdeaRenderer({ content, isLocked = false }: IdeaRendererProps) {
  let displayContent = content;

  if (isLocked) {
    // Elegant truncation for guest preview
    const previewLimit = 900;
    if (content.length > previewLimit) {
      const truncated = content.substring(0, previewLimit);
      const lastParagraphEnd = truncated.lastIndexOf("\n\n");
      if (lastParagraphEnd > 250) {
        displayContent = content.substring(0, lastParagraphEnd) + "\n\n*Truncated guest preview...*";
      } else {
        const lastSentenceEnd = truncated.lastIndexOf(".");
        if (lastSentenceEnd > 250) {
          displayContent = content.substring(0, lastSentenceEnd + 1) + " *Truncated guest preview...*";
        } else {
          displayContent = truncated + "... *Truncated guest preview...*";
        }
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="prose max-w-none text-neutral-800 font-serif leading-relaxed text-lg sm:text-[19px] selection:bg-neutral-100 antialiased">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h3: ({ node, ...props }) => (
              <h3
                className="font-sans font-bold text-xl sm:text-2xl mt-10 mb-5 tracking-tight text-neutral-900 flex items-center gap-2 border-b border-neutral-100 pb-2"
                {...props}
              />
            ),
            h4: ({ node, ...props }) => (
              <h4
                className="font-sans font-bold text-lg sm:text-xl mt-8 mb-4 text-neutral-900"
                {...props}
              />
            ),
            p: ({ node, ...props }) => {
              // If this <p> contains block-level children (table, pre, div),
              // render as <div> instead to avoid hydration errors.
              // This happens when markdown isn't properly separated by blank lines.
              const children = props.children;
              if (children && React.Children.toArray(children).some((child: any) => {
                if (typeof child === "string" || typeof child === "number") return false;
                return (
                  child?.type === "table" ||
                  child?.type === "pre" ||
                  child?.type === "div" ||
                  child?.type === "blockquote"
                );
              })) {
                return (
                  <div className="mb-6 leading-relaxed text-neutral-700 font-serif" {...props} />
                );
              }
              return (
                <p className="mb-6 leading-relaxed text-neutral-700 font-serif" {...props} />
              );
            },
            hr: ({ node, ...props }) => (
              <hr className="my-10 border-t border-neutral-200" {...props} />
            ),
            blockquote: ({ node, ...props }) => (
              <blockquote
                className="border-l-4 border-neutral-300 pl-5 py-2 my-8 text-neutral-600 italic font-serif text-lg leading-relaxed"
                {...props}
              />
            ),
            table: ({ node, ...props }) => (
              <div className="overflow-x-auto my-8 border border-neutral-200 rounded-lg">
                <table
                  className="min-w-full divide-y divide-neutral-200 text-sm font-sans"
                  {...props}
                />
              </div>
            ),
            thead: ({ node, ...props }) => (
              <thead className="bg-neutral-50" {...props} />
            ),
            tbody: ({ node, ...props }) => (
              <tbody className="divide-y divide-neutral-200" {...props} />
            ),
            tr: ({ node, ...props }) => (
              <tr className="even:bg-neutral-50/50" {...props} />
            ),
            th: ({ node, ...props }) => (
              <th
                className="px-5 py-3.5 text-left text-xs font-bold text-neutral-500 uppercase tracking-wider"
                {...props}
              />
            ),
            td: ({ node, ...props }) => {
              const isFirstCell = node && node.children && Array.isArray(node.children) &&
                node.children[0] && typeof node.children[0] === 'object' && 'children' in node.children[0] &&
                Array.isArray((node.children[0] as any).children) &&
                (node.children[0] as any).children[0]?.value?.startsWith('**');
              return (
                <td
                  className={`px-5 py-3 text-sm text-neutral-700 font-sans ${isFirstCell ? 'font-bold text-neutral-900 whitespace-nowrap w-[180px]' : ''}`}
                  {...props}
                />
              );
            },
            code: ({ node, inline, className, children, ...props }: any) => {
              if (inline) {
                return (
                  <code
                    className="px-1.5 py-0.5 bg-neutral-100 rounded text-sm font-mono text-neutral-800"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              const language = className?.replace("language-", "") || "";
              return (
                <div className="my-6 bg-neutral-900 rounded-lg overflow-hidden">
                  {language && (
                    <div className="px-4 py-2 bg-neutral-800 border-b border-neutral-700">
                      <span className="text-xs font-mono text-neutral-400">{language}</span>
                    </div>
                  )}
                  <pre className="p-4 overflow-x-auto">
                    <code className="text-sm font-mono text-neutral-100 leading-relaxed" {...props}>
                      {children}
                    </code>
                  </pre>
                </div>
              );
            },
            pre: ({ node, children, ...props }) => (
              <>{children}</>
            ),
            strong: ({ node, ...props }) => {
              const textContent = String(props.children || "");
              const hasSectionIndicator =
                textContent.includes("1.") ||
                textContent.includes("2.") ||
                textContent.includes("3.") ||
                textContent.includes("4.") ||
                textContent.includes("5.") ||
                textContent.includes("6.") ||
                textContent.includes("🎯") ||
                textContent.includes("📦") ||
                textContent.includes("🔧") ||
                textContent.includes("💰") ||
                textContent.includes("🧪") ||
                textContent.includes("⚠️");

              if (hasSectionIndicator) {
                return (
                  <span className="block font-sans font-bold text-lg sm:text-xl text-neutral-900 mt-10 mb-4 border-l-4 border-neutral-900 pl-4 py-0.5 tracking-tight">
                    {textContent}
                  </span>
                );
              }
              return <strong className="font-bold text-neutral-950" {...props} />;
            },
            ul: ({ node, ...props }) => (
              <ul className="list-disc pl-6 mb-6 space-y-2.5 text-[16px] sm:text-[17px] font-sans text-neutral-700" {...props} />
            ),
            ol: ({ node, ...props }) => (
              <ol className="list-decimal pl-6 mb-6 space-y-2.5 text-[16px] sm:text-[17px] font-sans text-neutral-700" {...props} />
            ),
            li: ({ node, ...props }) => (
              <li className="leading-relaxed" {...props} />
            ),
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>

      {isLocked && <MemberLock />}
    </div>
  );
}