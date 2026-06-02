"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface IdeaRendererProps {
  content: string;
}

export function IdeaRenderer({ content }: IdeaRendererProps) {
  // We can render each of the 6 Non-Negotiable parts beautifully
  return (
    <div className="prose max-w-none text-foreground font-serif leading-relaxed text-lg selection:bg-gray-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h3: ({ node, ...props }) => (
            <h3
              className="font-sans font-bold text-2xl mt-12 mb-6 tracking-tight text-[#1a1a1a] flex items-center gap-2"
              {...props}
            />
          ),
          h4: ({ node, ...props }) => (
            <h4
              className="font-sans font-bold text-xl mt-8 mb-4 text-[#1a1a1a]"
              {...props}
            />
          ),
          p: ({ node, ...props }) => (
            <p className="mb-6 leading-relaxed" {...props} />
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
                <span className="block font-sans font-bold text-xl text-[#1a1a1a] mt-8 mb-4 border-l-4 border-gray-300 pl-3">
                  {textContent}
                </span>
              );
            }
            return <strong className="font-bold text-foreground" {...props} />;
          },
          ul: ({ node, ...props }) => (
            <ul className="list-disc pl-6 mb-6 space-y-2 text-base font-sans" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="list-decimal pl-6 mb-6 space-y-2 text-base font-sans" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="leading-relaxed" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}