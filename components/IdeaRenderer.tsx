"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
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
            p: ({ node, ...props }) => (
              <p className="mb-6 leading-relaxed text-neutral-700 font-serif" {...props} />
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