"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
  title?: string;
}

export default function MermaidDiagram({ chart, title }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // Dynamically import mermaid only on client side
    const renderDiagram = async () => {
      try {
        const mermaid = (await import("mermaid")).default;
        
        mermaid.initialize({
          startOnLoad: true,
          theme: document.documentElement.classList.contains("dark") ? "dark" : "default",
          securityLevel: "loose",
          fontFamily: "ui-sans-serif, system-ui, sans-serif",
        });

        if (containerRef.current) {
          containerRef.current.innerHTML = chart;
          await mermaid.run({
            nodes: [containerRef.current],
            suppressErrors: false,
          });
        }
      } catch (err: any) {
        console.error("Mermaid render error:", err);
        setError(err.message);
      }
    };

    renderDiagram();
  }, [chart]);

  if (!mounted) {
    return (
      <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">Loading diagram...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
        <p className="text-red-700 dark:text-red-300 text-sm">
          Failed to render diagram: {error}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {title && (
        <h3 className="text-lg font-semibold dark:text-white">{title}</h3>
      )}
      <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6 overflow-x-auto">
        <div ref={containerRef} className="mermaid flex justify-center"></div>
      </div>
    </div>
  );
}

