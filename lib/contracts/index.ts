import type { Beat, ContractInput, PurchaseType } from '../types';
import { generateMp3LeaseContractPdf } from './mp3-lease';
import { generateWavLeaseContractPdf } from './wav-lease';
import { generateExclusiveContractPdf } from './exclusive';

export function getDownloadKeyForPurchaseType(beat: Beat, purchaseType: PurchaseType): string {
    switch (purchaseType) {
        case 'mp3':
            return beat.s3_key_mp3;
        case 'wav':
        case 'exclusive':
            return beat.s3_key_wav;
        default: {
            const _exhaustive: never = purchaseType;
            return _exhaustive;
        }
    }
}

export function getContractEmailSubject(purchaseType: PurchaseType, trackTitle: string): string {
    switch (purchaseType) {
        case 'mp3':
            return `jj.aholics - ${trackTitle}: MP3 Lease Contract`;
        case 'wav':
            return `jj.aholics - ${trackTitle}: WAV Lease Contract`;
        case 'exclusive':
            return `jj.aholics - ${trackTitle}: Exclusive Contract`;
        default: {
            const _exhaustive: never = purchaseType;
            return _exhaustive;
        }
    }
}

export function getContractEmailBody(opts: {
    purchaseType: PurchaseType;
    downloadUrl: string;
    orderNumber: string;
    trackTitle: string;
}): string {
    const typeLabel = opts.purchaseType === 'exclusive'
        ? 'exclusive'
        : `${opts.purchaseType.toUpperCase()} lease`;

    return (
        `thanks for your purchase!\n\n`
        + `attached is your ${typeLabel} contract.\n\n`
        + `your download link (valid for 24 hours):\n${opts.downloadUrl}\n\n`
        + `order: ${opts.orderNumber}\n`
        + `beat: ${opts.trackTitle}\n`
    );
}

export async function generateContractPdf(purchaseType: PurchaseType, input: ContractInput): Promise<{ pdf: Buffer; filename: string }> {
    switch (purchaseType) {
        case 'mp3':
            return await generateMp3LeaseContractPdf(input);
        case 'wav':
            return await generateWavLeaseContractPdf(input);
        case 'exclusive':
            return await generateExclusiveContractPdf(input);
        default: {
            const _exhaustive: never = purchaseType;
            return _exhaustive;
        }
    }
}
