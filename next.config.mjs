/** @type {import('next').NextConfig} */
const nextConfig = {
    redirects: async () => {
        return [
            {
                source: '/',
                destination: 'https://givepraise.xyz/',
                permanent: true,
            },
        ];
    },
}

export default nextConfig
