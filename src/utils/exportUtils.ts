import { saveAs } from 'file-saver';

export const exportToHtml = (markdown: string, filename: string = 'document.html') => {
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
        try {
            const file = new File([fullHtml], filename, { type: 'text/html;charset=utf-8' });
            saveAs(file);
        } catch (e) {
            const blob = new Blob([fullHtml], { type: 'text/html;charset=utf-8' });
            saveAs(blob, filename);
        }
    } else {
        try {
            const file = new File([markdown], filename.replace('.html', '.md'), { type: 'text/markdown;charset=utf-8' });
            saveAs(file);
        } catch (e) {
            const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
            saveAs(blob, filename.replace('.html', '.md'));
        }
    }
};

export const exportToDocx = async (markdown: string, filename: string = 'document.docx') => {
    const { Document, Packer, Paragraph, TextRun } = await import('docx');
    
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
    try {
        const file = new File([blob], filename, { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        saveAs(file);
    } catch (e) {
        saveAs(blob, filename);
    }
};

export const exportToPdf = async (filename: string = 'document.pdf') => {
    const element = document.getElementById('markdown-preview-content');
    if (element) {
        const html2pdf = (await import('html2pdf.js')).default;
        
        // Clone the element to manipulate styles for export without affecting the UI
        const clone = element.cloneNode(true) as HTMLElement;
        
        // Force light mode styles on the clone
        clone.classList.remove('dark', 'dark:prose-invert');
        clone.style.backgroundColor = 'white';
        clone.style.color = 'black';
        clone.style.width = '800px'; // Enforce a width for consistency
        clone.style.margin = '0 auto';
        clone.style.padding = '20px';
        
        // Append to body temporarily (off-screen) to allow html2pdf to render it
        const container = document.createElement('div');
        container.style.position = 'absolute';
        container.style.left = '-9999px';
        container.style.top = '0';
        container.appendChild(clone);
        document.body.appendChild(container);

        const opt = {
            margin: 1,
            filename: filename,
            image: { type: 'jpeg' as const, quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
        };

        // Save and cleanup
        // @ts-ignore
        html2pdf().set(opt).from(clone).save().then(() => {
            document.body.removeChild(container);
        });
    }
};
