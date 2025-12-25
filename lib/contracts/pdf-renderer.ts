import PDFDocument from 'pdfkit';

async function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (c) => chunks.push((Buffer.isBuffer(c) ? c : Buffer.from(c)) as unknown as Uint8Array));
        doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
        doc.on('error', reject);
        doc.end();
    });
}

export async function renderSimpleTextContractPdf(opts: {
    pdfTitle: string;
    headerTitle: string;
    headerSubtitle: string;
    lines: string[];
}): Promise<Buffer> {
    const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
            Title: opts.pdfTitle,
            Author: 'jj.aholics',
        },
    });

    doc.font('Helvetica-Bold').fontSize(16).text(opts.headerTitle, { align: 'left' });
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(11).text(opts.headerSubtitle);
    doc.moveDown(1);

    doc.font('Helvetica').fontSize(10);

    for (const line of opts.lines) {
        if (line.trim().length === 0) {
            doc.moveDown(0.75);
            continue;
        }

        if (line === 'All licenses are non-refundable and non-transferable.') {
            doc.font('Helvetica-Bold').text(line);
            doc.font('Helvetica');
            continue;
        }

        doc.text(line, { align: 'left' });
        doc.moveDown(0.35);
    }

    return await pdfToBuffer(doc);
}
