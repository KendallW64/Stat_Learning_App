import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
export default function Markdown({children}){
 return <div className="markdown"><ReactMarkdown remarkPlugins={[remarkGfm,remarkMath]} rehypePlugins={[[rehypeKatex,{strict:'ignore',throwOnError:false}]]} components={{a:({node,...props})=><a {...props} target="_blank" rel="noopener noreferrer"/>}}>{children}</ReactMarkdown></div>;
}
