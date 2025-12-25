import { ContractInput } from '../types';
import { renderSimpleTextContractPdf } from './pdf-renderer';


function buildContractLines(input: ContractInput): string[] {
    return [
        `THIS LICENSE AGREEMENT is made on ${input.contractDate} ("Effective Date") by and between`,
        `${input.customerFullName} (hereinafter referred to as the "Licensee", contact email ${input.customerEmail}) and Joseph Anderson professionally known as jj.aholics ("Songwriter").`,
        `Licensor contact email jj.aholics@gmail.com. Licensor warrants that it controls the mechanical rights in and to the copyrighted musical work entitled ${input.trackName} ("Composition"). The Composition, including the music thereof, was composed by jj.aholics ("Songwriter") managed under the Licensor.`,
        '',
        'All licenses are non-refundable and non-transferable.',
        '',
        'Master Use. The Licensor hereby grants to Licensee a non-exclusive license (this "License") to record vocal synchronization to the Composition partly or in its entirety and substantially in its original form ("Master Recording").',
        '',
        `Mechanical Rights. The Licensor hereby grants to Licensee a non-exclusive license to use Master Recording in the reproduction, duplication, manufacture, and distribution of phonograph records, cassette tapes, compact disk, digital downloads, other miscellaneous audio and digital recordings, and any lifts and versions thereof (collectively, the "Recordings", and individually, a "Recordings") worldwide for up to the pressing or selling a total of Seven Thousand Five Hundred (7500) copies of such Recordings or any combination of such Recordings, condition upon the payment to the Licensor a sum of $${input.priceInDollars}, receipt of which is confirmed. This license allows up to Ten Thousand (10000) monetized audio streams to sites like (Spotify, RDIO, Rhapsody) but not eligible for monetization on YouTube.`,
        '',
        'Performance Rights. The Licensor here by grants to Licensee a non-exclusive license to use the Master Recording in Unlimited non-profit and 200 for-profit performances, shows, or concerts.',
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

export async function generateWavLeaseContractPdf(input: ContractInput): Promise<{ pdf: Buffer; filename: string }> {
    const safeTrack = input.trackName.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60) || 'track';
    const filename = `jjaholics-${safeTrack}-wav-lease.pdf`;

    const pdf = await renderSimpleTextContractPdf({
        pdfTitle: `jj.aholics - ${input.trackName}: WAV Lease Contract`,
        headerTitle: `jj.aholics - ${input.trackName}: Non Exclusive`,
        headerSubtitle: `License Agreement For Order #${input.orderNumber}`,
        lines: buildContractLines(input),
    });
    return { pdf, filename };
}
