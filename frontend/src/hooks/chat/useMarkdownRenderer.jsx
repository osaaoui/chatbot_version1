import { useMemo, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import LazyMarkdown from '../../components/Chat/LazyMarkdown';

export const useMarkdownRenderer = () => {
  const markdownComponents = useMemo(() => ({
    h1: ({ children }) => <h1 className="text-xl font-bold mt-4 mb-2">{children}</h1>,
    h2: ({ children }) => <h2 className="text-lg font-bold mt-4 mb-2">{children}</h2>,
    h3: ({ children }) => <h3 className="text-lg font-semibold mt-4 mb-2">{children}</h3>,
    h4: ({ children }) => <h4 className="text-base font-semibold mt-3 mb-2">{children}</h4>,
    h5: ({ children }) => <h5 className="text-sm font-semibold mt-3 mb-2">{children}</h5>,
    h6: ({ children }) => <h6 className="text-sm font-medium mt-3 mb-2">{children}</h6>,
    p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
    ol: ({ children }) => <ol className="list-decimal list-outside pl-6 mb-4 space-y-1">{children}</ol>,
    ul: ({ children }) => <ul className="list-disc list-outside pl-6 mb-4 space-y-1">{children}</ul>,
    li: ({ children }) => <li className="mb-1 leading-relaxed">{children}</li>,
    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
    em: ({ children }) => <em className="italic">{children}</em>,
    code: ({ children }) => <code className="bg-gray-100 text-gray-800 px-1 py-0.5 rounded text-sm font-mono">{children}</code>,
    pre: ({ children }) => <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto mb-4">{children}</pre>,
    a: ({ href, children }) => (
      <a href={href} className="text-blue-600 hover:text-blue-800 underline" target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ),
    blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-300 pl-4 italic mb-4">{children}</blockquote>
  }), []);

  const preprocessMarkdown = useCallback((text) => {
    const lines = text.split(/\r?\n/);
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      if (!trimmedLine) {
        processedLines.push('');
        continue;
      }
      
      if (/^#{1,6}[^#\s]/.test(trimmedLine)) {
        const hashCount = trimmedLine.match(/^#+/)[0].length;
        const headingText = trimmedLine.substring(hashCount).trim();
        processedLines.push('#'.repeat(hashCount) + ' ' + headingText);
        continue;
      }
      
      processedLines.push(line);
    }
    
    return processedLines.join('\n');
  }, []);

  const renderFormattedAnswer = useCallback((text) => {
    if (!text || typeof text !== 'string') {
      return <span className="text-text-tertiary italic">Sin contenido</span>;
    }

    if (text.length > 2000) {
      return <LazyMarkdown text={text} components={markdownComponents} />;
    }

    const markdownText = preprocessMarkdown(text);
    
    return (
      <ReactMarkdown components={markdownComponents}>
        {markdownText}
      </ReactMarkdown>
    );
  }, [markdownComponents, preprocessMarkdown]);

  return { renderFormattedAnswer };
};