import Footer from '@/components/footer';
import { SignUp } from '@clerk/clerk-react';
import Image from 'next/image';

export default function Page() {
    return (
        <main className="flex h-full w-full flex-col">
            <header className="relative flex gap-x-2 border-b px-8 py-3">
                <Image
                    src="/sdlc-hub/sdlc-hub.png"
                    alt="SDLC HUB"
                    width={30}
                    height={25}
                />
                <h1 className="text-base font-semibold text-customPrimary">
                    SDLC HUB
                </h1>
            </header>
            <section className="flex flex-1 gap-x-2 p-4">
                <aside className="relative flex h-full w-[60%] flex-col items-center justify-center">
                    <Image
                        src="/sdlc-hub/hero-image.png"
                        alt="SDLC HUB"
                        width={750}
                        height={120}
                    />
                </aside>
                <aside className="flex h-full items-center justify-center">
                    <SignUp
                        appearance={{
                            elements: {
                                form: {
                                    display: 'none',
                                },
                                dividerRow: {
                                    display: 'none',
                                },
                            },
                        }}
                    />
                </aside>
            </section>
            <Footer />
        </main>
    );
}
