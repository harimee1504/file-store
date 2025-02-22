import dynamic from "next/dynamic";
import MainContent from "./_components/main-content";

const Wrapper = dynamic(() => import('auth/wrapper')!, {
    ssr: false,
});

const data = {
    user: {
      name: "shadcn",
      email: "m@example.com",
      avatar: "/avatars/shadcn.jpg",
    },
    teams: [
      {
        name: "Acme Inc",
        logo: undefined,
        plan: "Enterprise",
      }
    ],
    navMain: [
      {
        title: "File Store",
        url: "/file-store",
        icon: undefined,
        isActive: true,
        items: [
          {
            title: "Files",
            url: "/file-store",
          },
          {
            title: "Favourites",
            url: "/file-store?favourites=true",
          },
          {
            title: "Recycle Bin",
            url: "/file-store?recycle=true",
          },
        ],
      },
    ],
    projects: [
    ],
  }

const Page = () => {
    return (
        <Wrapper data={data}>
            <MainContent />
        </Wrapper>
    );
};

export default Page;
