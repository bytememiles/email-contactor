import { marked } from 'marked';
import { htmlToText } from 'html-to-text';

// Configure marked for email-friendly HTML
const renderer = new marked.Renderer();

// Override link rendering to ensure full URLs
renderer.link = ({ href, title, tokens }) => {
  const text = tokens?.[0]?.raw || href || '';
  const isExternal =
    href?.startsWith('http://') || href?.startsWith('https://');
  const fullHref = isExternal ? href : `https://${href}`;
  const titleAttr = title ? ` title="${title}"` : '';
  return `<a href="${fullHref}" target="_blank"${titleAttr}>${text}</a>`;
};

// Override image rendering
renderer.image = ({ href, title, text }) => {
  const titleAttr = title ? ` title="${title}"` : '';
  const altAttr = text ? ` alt="${text}"` : '';
  return `<img src="${href}" style="max-width: 100%; height: auto;"${titleAttr}${altAttr} />`;
};

marked.setOptions({
  renderer,
  breaks: true,
  gfm: true,
});

export interface ConvertedContent {
  html: string;
  text: string;
}

export function convertMarkdownToEmail(markdown: string): ConvertedContent {
  // Convert markdown to HTML
  const html = marked(markdown) as string;

  // Add email-friendly styles
  const styledHtml = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
      ${html}
    </div>
  `;

  // Convert HTML to plain text for fallback
  const text = htmlToText(styledHtml, {
    wordwrap: 80,
    preserveNewlines: true,
  });

  return {
    html: styledHtml,
    text,
  };
}

// Email template styles
export const emailStyles = `
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    h1, h2, h3, h4, h5, h6 {
      color: #2c3e50;
      margin-top: 0;
      margin-bottom: 16px;
    }
    p {
      margin-bottom: 16px;
    }
    a {
      color: #3498db;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
    code {
      background-color: #f4f4f4;
      padding: 2px 4px;
      border-radius: 3px;
      font-family: monospace;
    }
    pre {
      background-color: #f4f4f4;
      padding: 10px;
      border-radius: 5px;
      overflow-x: auto;
    }
    blockquote {
      border-left: 4px solid #ddd;
      margin: 0;
      padding-left: 16px;
      color: #666;
    }
    ul, ol {
      padding-left: 20px;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin-bottom: 16px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f2f2f2;
    }
  </style>
`;

export function addEmailStyles(html: string): string {
  return `${emailStyles}\n${html}`;
}
