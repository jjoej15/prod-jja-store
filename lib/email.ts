import nodemailer from 'nodemailer';

export type EmailAttachment = {
    filename: string;
    content: Buffer;
    contentType?: string;
};

function getSmtpConfig() {
    const host = process.env.SMTP_HOST;
    const port = Number.parseInt(process.env.SMTP_PORT || '587', 10);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const from = process.env.EMAIL_FROM;

    if (!host) throw new Error('SMTP_HOST env var missing');
    if (!user) throw new Error('SMTP_USER env var missing');
    if (!pass) throw new Error('SMTP_PASS env var missing');
    if (!from) throw new Error('EMAIL_FROM env var missing');

    const secure = (process.env.SMTP_SECURE || '').toLowerCase() === 'true' || port === 465;

    return { host, port, user, pass, from, secure };
}

type GlobalMailer = {
    transporter?: nodemailer.Transporter;
    from?: string;
}

const globalForMailer = global as unknown as GlobalMailer;

function getTransporter(): { transporter: nodemailer.Transporter; from: string } {
    if (globalForMailer.transporter && globalForMailer.from) {
        return { transporter: globalForMailer.transporter, from: globalForMailer.from };
    }

    const cfg = getSmtpConfig();
    const transporter = nodemailer.createTransport({
        host: cfg.host,
        port: cfg.port,
        secure: cfg.secure,
        auth: {
            user: cfg.user,
            pass: cfg.pass,
        },
    });

    globalForMailer.transporter = transporter;
    globalForMailer.from = cfg.from;

    return { transporter, from: cfg.from };
}

export async function sendEmail(opts: {
    to: string;
    subject: string;
    text: string;
    attachments?: EmailAttachment[];
}): Promise<void> {
    const { transporter, from } = getTransporter();

    await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        attachments: opts.attachments?.map(a => ({
            filename: a.filename,
            content: a.content,
            contentType: a.contentType,
        })),
    });
}
