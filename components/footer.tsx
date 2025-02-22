import { Hint } from '@/components/hint';
import { Separator } from '@/components/ui/separator';
import { Globe } from 'lucide-react';
import Image from 'next/image';
import { LinkPreview } from './ui/link-preview';

const Footer = () => {
    return (
        <footer className="w-full flex items-center justify-end gap-x-2 border-t px-8 py-2">
            <p className="text-[12px] font-semibold">
                &copy; Designed & Developed by Harikrishnan
            </p>
            <Separator orientation="vertical" className="bg-gray-300" />
            <span className="cursor-pointer">
                <Hint
                    label="Go to Portfolio Webpage"
                    sideOffset={10}
                    align="start"
                >
                    <LinkPreview
                        url="http://hari-krishnan.com"
                        imageSrc="/hero-background.jpg"
                        isStatic
                        className="font-bold"
                    >
                        <Globe className="h-4 w-4" />
                    </LinkPreview>
                </Hint>
            </span>
            <Separator orientation="vertical" className="bg-gray-300" />
            <span className="cursor-pointer">
                <LinkPreview
                    url="http://hari-krishnan.com"
                    imageSrc="/hero-background.jpg"
                    isStatic
                    className="font-bold"
                >
                    <Image
                        src="/github-mark.png"
                        alt="GitHub"
                        width={18}
                        height={18}
                    />
                </LinkPreview>
            </span>
            <Separator orientation="vertical" className="bg-gray-300" />
            <span className="cursor-pointer">
                <LinkPreview
                    url="http://hari-krishnan.com"
                    imageSrc="/hero-background.jpg"
                    isStatic
                    className="font-bold"
                >
                    <Image
                        src="/In-Blue-40.png"
                        alt="LinkedIn"
                        width={17}
                        height={17}
                    />
                </LinkPreview>
            </span>
            <Separator orientation="vertical" className="bg-gray-300" />
            <span className="cursor-pointer">
                <LinkPreview
                    url="http://hari-krishnan.com"
                    imageSrc="/resume.png"
                    isStatic
                    className="font-bold"
                >
                    <Image
                        src="/resume.png"
                        alt="Resume"
                        width={17}
                        height={17}
                    />
                </LinkPreview>
            </span>
        </footer>
    );
};

export default Footer;
