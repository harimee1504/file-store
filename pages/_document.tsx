import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
    return (
        <Html lang="en">
            <Head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin=""
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link
                    href="https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=swap"
                    rel="stylesheet"
                />
                <link rel="stylesheet" href="https://auth-layout.vercel.app/_next/static/chunks/pages/_app.css" />
            </Head>
            <body className="antialiased">
                <Main />
                <NextScript />
            </body>
        </Html>
    );
}
