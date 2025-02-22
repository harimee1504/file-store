import { SparklesPreview } from '@/components/auth-sidebar';
import Footer from '@/components/footer';
import { DialogFooter } from '@/components/ui/dialog';
import { SignIn } from '@clerk/clerk-react';
import Image from 'next/image';

export default function Page() {
    return (
        <main className="flex h-full w-full flex-1">
            <aside className="flex h-full w-[60%] items-start flex-col">
                <header className="flex items-center p-4 bg-[#286cd9] w-full">
                    <Image
                        src="/icon-white.png"
                        alt="SDLC HUB"
                        width={35}
                        height={200}
                    />
                    <div className="w-full text-white text-2xl font-semibold pl-2">
                        SDLC HUB
                    </div>
                </header>
                <main className="flex h-full w-full flex-1 items-center justify-center bg-[#286cd9]"></main>
                <Footer />
            </aside>
            <aside className="flex h-full w-[40%] items-center justify-center">
                <SignIn
                    appearance={{
                        elements: {
                            header: {
                                background: '',
                            },
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
        </main>
    );
}
