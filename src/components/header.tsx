import Link from "next/link";
import { IconBrandGithubFilled } from "@tabler/icons-react";
import Image from "next/image";
import Logo from "../../public/logo.svg";
import { ThemeToggle } from "./theme";

export default function Header() {
    return (
        <header className="z-30 sticky top-0 bg-background-800/50 w-full py-5 border-b-2 border-background-600 z-100 backdrop-filter backdrop-blur-sm">
            <div className="container mx-auto w-full">
                <div className="flex justify-between items-center">
                    <Link href="/">
                        <div className="flex items-center">
                            <Image src={Logo} alt="Seyfert Logo" className="w-[30px] h-[30px] -mr-0.5 -mt-0.5" />
                            <h1 className="text-2xl font-bold">eyfert</h1>
                        </div>
                    </Link>
                    <ThemeToggle />
                    <Link
                        href="https://github.com/tiramisulabs/seyfert"
                        target="_blank"
                        referrerPolicy="no-referrer"
                    >
                        <IconBrandGithubFilled />
                    </Link>
                </div>
            </div>
        </header>
    );
}