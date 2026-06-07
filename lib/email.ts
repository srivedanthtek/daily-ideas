import { Resend } from "resend";

export async function sendEmail({
  title,
  dateLabel,
  content,
  modelLabel,
  ideaId,
}: {
  title: string;
  dateLabel: string;
  content: string;
  modelLabel: string;
  ideaId: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@spark.srivedanthtek.com";
  const myEmail = process.env.MY_EMAIL || "sindhumuthyam@gmail.com";
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://spark.srivedanthtek.com";

  if (!apiKey) {
    console.error("Missing RESEND_API_KEY environment variable. Email cannot be sent.");
    return false;
  }

  const resend = new Resend(apiKey);

  // Convert some headers or list elements to clean HTML manually
  let formattedHtml = content
    .replace(/^### (.*$)/gim, '<h3 style="font-family: Georgia, serif; color: #1a1a1a; margin-top: 24px; margin-bottom: 8px;">$1</h3>')
    .replace(/^\*\*([^*]+)\*\*/gim, '<strong style="color: #1a1a1a;">$1</strong>')
    .replace(/^\* (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>')
    .replace(/^- (.*$)/gim, '<li style="margin-bottom: 6px;">$1</li>')
    .replace(/\n\n/g, '<br/><br/>')
    // Convert blockquotes (> text)
    .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid #d1d5db; padding-left: 16px; margin: 20px 0; color: #4b5563; font-style: italic;">$1</blockquote>')
    // Convert tables: | Field | Detail | rows -> HTML table
    .replace(
      /^\|(.+)\|\n\|[-| ]+\|\n((?:\|.+\|\n?)*)/gm,
      (_match: string, headerRow: string, bodyRows: string) => {
        const headers = headerRow.split('|').map((h: string) => h.trim()).filter(Boolean);
        const rows = bodyRows.trim().split('\n').filter(Boolean).map((row: string) =>
          row.split('|').map((c: string) => c.trim()).filter(Boolean)
        );
        if (headers.length === 0) return _match;
        let html = '<table style="width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 14px; font-family: -apple-system, sans-serif; border: 1px solid #e5e7eb; border-radius: 8px; overflow: hidden;">';
        html += '<thead><tr>';
        for (const h of headers) {
          html += `<th style="background: #f9fafb; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #e5e7eb;">${h}</th>`;
        }
        html += '</tr></thead><tbody>';
        for (const row of rows) {
          html += '<tr style="border-bottom: 1px solid #f3f4f6;">';
          for (let i = 0; i < row.length; i++) {
            const isFirst = i === 0;
            html += `<td style="padding: 10px 14px; color: #374151; ${isFirst ? 'font-weight: 700; color: #111827; white-space: nowrap; vertical-align: top;' : ''}">${row[i]}</td>`;
          }
          html += '</tr>';
        }
        html += '</tbody></table>';
        return html;
      }
    )
    // Convert code blocks (```...```) to styled pre/code elements
    .replace(
      /```(\w*)\n([\s\S]*?)```/g,
      (_match: string, lang: string, code: string) => {
        const langLabel = lang ? `<div style="background: #1f2937; padding: 6px 14px; border-bottom: 1px solid #374151;"><span style="color: #9ca3af; font-size: 11px; font-family: monospace;">${lang}</span></div>` : '';
        return `<div style="background: #1f2937; border-radius: 8px; margin: 20px 0; overflow: hidden;">${langLabel}<pre style="padding: 14px; overflow-x: auto; margin: 0;"><code style="color: #f3f4f6; font-size: 13px; font-family: 'SF Mono', Monaco, monospace; line-height: 1.5; white-space: pre-wrap;">${code.trim()}</code></pre></div>`;
      }
    )
    // Convert inline code (`...`)
    .replace(/`([^`]+)`/g, '<code style="background: #f3f4f6; padding: 2px 5px; border-radius: 3px; font-size: 13px; font-family: monospace; color: #111827;">$1</code>')
    // Convert horizontal rules (---)
    .replace(/^---+$/gim, '<hr style="border: none; border-top: 1px solid #e5e7eb; margin: 28px 0;" />');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>✦ Spark — ${title}</title>
      </head>
      <body style="font-family: 'Inter', -apple-system, sans-serif; background-color: #ffffff; color: #1a1a1a; margin: 0; padding: 40px 20px; -webkit-font-smoothing: antialiased;">
        <div style="max-width: 600px; margin: 0 auto;">
          <div style="border-bottom: 1px solid #eaeaea; padding-bottom: 20px; margin-bottom: 30px;">
            <p style="font-size: 14px; color: #6b7280; margin: 0; text-transform: uppercase; letter-spacing: 0.05em;">✦ Spark Daily Idea</p>
            <h1 style="font-family: Georgia, serif; font-size: 28px; margin: 10px 0 5px 0; color: #1a1a1a; font-weight: normal;">${title}</h1>
            <p style="font-size: 14px; color: #6b7280; margin: 0;">
              ${dateLabel} &middot; <span style="background-color: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px; font-weight: 500;">${modelLabel}</span>
            </p>
          </div>
          
          <div style="font-family: Georgia, serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
            ${formattedHtml}
          </div>
          
          <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eaeaea; text-align: center;">
            <a href="${siteUrl}/ideas/${ideaId}" style="display: inline-block; background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-weight: 500; font-size: 15px; margin-bottom: 20px;">Read on Spark &rarr;</a>
            <p style="font-size: 12px; color: #9ca3af; margin: 0;">Generated by: ${modelLabel}</p>
            <p style="font-size: 11px; color: #9ca3af; margin: 5px 0 0 0;">Generated daily by Claude &middot; spark.srivedanthtek.com</p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const response = await resend.emails.send({
      from: `Spark <${fromEmail}>`,
      to: [myEmail],
      subject: `✦ Spark — ${title} · ${modelLabel} · ${dateLabel}`,
      html,
    });

    if (response.error) {
      console.error("Resend email delivery failed:", response.error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Exception occurred while sending email with Resend:", error);
    return false;
  }
}