import PDFDocument from 'pdfkit';

export interface Mp3LeaseContractInput {
    orderNumber: string;
    contractDate: string;
    trackName: string;
    customerFullName: string;
    customerEmail: string;
    mp3LeasePriceInDollars: string;
    purchaseCode: string;
    trackId: string;
}

function buildContractLines(input: Mp3LeaseContractInput): string[] {
    // Mirrors the content/meaning of lease-templates/mp3-lease-contract.tex,
    // but rendered as plain text into a PDF.
    return [
        `jj.aholics - ${input.trackName}: Non Exclusive`,
        `License Agreement For Order #${input.orderNumber}`,
        '',
        `THIS LICENSE AGREEMENT is made on ${input.contractDate} ("Effective Date") by and between`,
        `${input.customerFullName} (hereinafter referred to as the "Licensee", contact email ${input.customerEmail}) and Joseph Anderson professionally known as jj.aholics ("Songwriter").`,
        `Licensor contact email jj.aholics@gmail.com. Licensor warrants that it controls the mechanical rights in and to the copyrighted musical work entitled ${input.trackName} ("Composition"). The Composition, including the music thereof, was composed by jj.aholics ("Songwriter") managed under the Licensor.`,
        '',
        'All licenses are non-refundable and non-transferable.',
        '',
        'Master Use. The Licensor hereby grants to Licensee a non-exclusive license (this "License") to record vocal synchronization to the Composition partly or in its entirety and substantially in its original form ("Master Recording").',
        '',
        `Mechanical Rights. The Licensor hereby grants to Licensee a non-exclusive license to use Master Recording in the reproduction, duplication, manufacture, and distribution of phonograph records, cassette tapes, compact disk, digital downloads, other miscellaneous audio and digital recordings, and any lifts and versions thereof (collectively, the "Recordings", and individually, a "Recordings") worldwide for up to the pressing or selling a total of Two Thousand Five Hundred (2500) copies of such Recordings or any combination of such Recordings, condition upon the payment to the Licensor a sum of $${input.mp3LeasePriceInDollars}, receipt of which is confirmed. This license allows up to Five Thousand (5000) monetized audio streams to sites like (Spotify, RDIO, Rhapsody) but not eligible for monetization on YouTube.`,
        '',
        'Performance Rights. The Licensor here by grants to Licensee a non-exclusive license to use the Master Recording in Unlimited non-profit and 10 for-profit performances, shows, or concerts.',
        '',
        'Synchronization Rights. The Licensor hereby grants limited synchronization rights for One (1) music video streamed online (Youtube, Vimeo, etc..) for up to 5000 monetized video streams on all total sites. A separate synchronization license will need to be purchased for distribution of video to Television, Film or Video game.',
        '',
        'Broadcast Rights. The Licensor hereby grants to Licensee no broadcasting rights.',
        '',
        'Credit. Licensee shall acknowledge the original authorship of the Composition appropriately and reasonably in all media and performance formats under the name "Joseph Anderson" in writing where possible and vocally otherwise.',
        '',
        'Consideration. In consideration for the rights granted under this agreement, Licensee shall pay to licensor the sum of 100 US dollars and other good and valuable consideration, payable to "Joseph Anderson", receipt of which is hereby acknowledged. If the Licensee fails to account to the Licensor, timely complete the payments provided for hereunder, or perform its other obligations hereunder, including having insufficient bank balance, the licensor shall have the right to terminate License upon written notice to the Licensee. Such termination shall render the recording, manufacture and/or distribution of Recordings for which monies have not been paid subject to and actionable infringements under applicable law, including, without limitation, the United States Copyright Act, as amended.',
        '',
        'Indemnification. Accordingly, Licensee agrees to indemnify and hold Licensor harmless from and against any and all claims, losses, damages, costs, expenses, including, without limitation, reasonable attorney\'s fees, arising of or resulting from a claimed breach of any of Licensee\'s representations, warranties or agreements hereunder.',
        '',
        'Audio Samples. 3rd party sample clearance is the responsibility of the licensee.',
        '',
        'Miscellaneous. This license is non-transferable and is limited to the Composition specified above, constitutes the entire agreement between the Licensor and the Licensee relating to the Composition, and shall be binding upon both the Licensor and the Licensee and their respective successors, assigns, and legal representatives.',
        '',
        'Term. Executed by the Licensor and the Licensee, to be effective as for all purposes as of the Effective Date first mentioned above and shall terminate exactly ten (10) years from this date.',
        '',
        `THIS LICENSE AGREEMENT is provided for Order ${input.orderNumber}, PayPal payKey confirming purchase ${input.purchaseCode}`,
        `Track unique uuid ${input.trackId}`,
    ];
}

async function pdfToBuffer(doc: PDFKit.PDFDocument): Promise<Buffer> {
    const chunks: Uint8Array[] = [];
    return await new Promise<Buffer>((resolve, reject) => {
        doc.on('data', (c) => chunks.push((Buffer.isBuffer(c) ? c : Buffer.from(c)) as unknown as Uint8Array));
        doc.on('end', () => resolve(Buffer.concat(chunks as unknown as Uint8Array[])));
        doc.on('error', reject);
        doc.end();
    });
}

async function generateMp3LeasePdfKit(input: Mp3LeaseContractInput): Promise<Buffer> {
    const doc = new PDFDocument({
        size: 'LETTER',
        margin: 50,
        info: {
            Title: `jj.aholics - ${input.trackName}: MP3 Lease Contract`,
            Author: 'jj.aholics',
        },
    });

    // title block
    doc.font('Helvetica-Bold').fontSize(16).text(`jj.aholics - ${input.trackName}: Non Exclusive`, { align: 'left' });
    doc.moveDown(0.25);
    doc.font('Helvetica').fontSize(11).text(`License Agreement For Order #${input.orderNumber}`);
    doc.moveDown(1);

    // body text
    doc.font('Helvetica').fontSize(10);
    const lines = buildContractLines(input);

    for (let idx = 0; idx < lines.length; idx++) {
        if (idx <= 2) continue;
        const line = lines[idx];
        if (line.trim().length === 0) {
            doc.moveDown(0.75);
            continue;
        }
        
        if (line === 'All licenses are non-refundable and non-transferable.') {
            doc.font('Helvetica-Bold').text(line);
            doc.font('Helvetica');
            continue;
        }
        doc.text(line, {
            align: 'left',
        });
        doc.moveDown(0.35);
    }

    return await pdfToBuffer(doc);
}

export async function generateMp3LeaseContractPdf(input: Mp3LeaseContractInput): Promise<{ pdf: Buffer; filename: string }> {
    const safeTrack = input.trackName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'track';
    const filename = `jjaholics-${safeTrack}-mp3-lease.pdf`;

    const pdf = await generateMp3LeasePdfKit(input);
    return { pdf, filename };
}
