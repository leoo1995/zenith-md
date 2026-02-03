import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';
// html2pdf.js doesn't have good TS types usually, require casting or ignore
import html2pdf from 'html2pdf.js';

export const exportToHtml = (markdown: string, filename: string = 'document.html') => {
    // For proper HTML export we usually want the rendered HTML.
    // We can get it from the DOM if we give an ID to the preview container.
    const previewElement = document.getElementById('markdown-preview-content');
    if (previewElement) {
        const fullHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${filename}</title>
<style>
body{font-family:system-ui,-apple-system,sans-serif;max-width:800px;margin:0 auto;padding:2rem;line-height:1.6;color:#333;}
img{max-width:100%;}
pre{background:#f4f4f4;padding:1rem;overflow-x:auto;}
blockquote{border-left:4px solid #ddd;margin:0;padding-left:1rem;color:#666;}
table{border-collapse:collapse;width:100%;}
th,td{border:1px solid #ddd;padding:0.5rem;}
</style>
</head>
<body>
${previewElement.innerHTML}
</body>
</html>`;
        const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
        saveAs(blob, filename);
    } else {
        // Fallback
        const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
        saveAs(blob, filename.replace('.html', '.md'));
    }
};

export const exportToDocx = async (markdown: string, filename: string = 'document.docx') => {
    // Simple conversion: Split by newlines and create paragraphs
    const paragraphs = markdown.split('\n').map(line => new Paragraph({
        children: [new TextRun(line)],
    }));

    const doc = new Document({
        sections: [{
            properties: {},
            children: paragraphs,
        }],
    });

    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);
};

export const exportToPdf = (filename: string = 'document.pdf') => {
    const element = document.getElementById('markdown-preview-content');
    if (element) {
        const opt = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2 },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };
        // @ts-ignore
        html2pdf().set(opt).from(element).save();
    }
};
