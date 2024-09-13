import { IconBrandDiscord, IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";

export default function HomeFooter() {
    return (
        <footer className="bg-white py-6 z-20 w-full">
            <div className="container mx-auto text-center">
                <h2 className="text-2xl font-bold mb-4">SEYFERT</h2>
                <div className="flex justify-center gap-4 mb-4">
                    <Link href="https://github.com/tiramisulabs/seyfert" target="_blank" className="text-gray-600 hover:text-gray-800">
                        <IconBrandGithub className="w-8 h-8" />
                    </Link>
                    <Link href="https://discord.gg/hEeJNaSqnS" target="_blank" className="text-gray-600 hover:text-gray-800">
                        <IconBrandDiscord className="w-8 h-8" />
                    </Link>
                </div>
            </div>
        </footer>
    )
}