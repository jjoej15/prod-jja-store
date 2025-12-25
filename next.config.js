/** @type {import('next').NextConfig} */
const nextConfig = {
    serverExternalPackages: ["pdfkit"],
    outputFileTracingIncludes: {
        '/*': ['node_modules/pdfkit/js/data/**'],
    },
};


module.exports = nextConfig;
