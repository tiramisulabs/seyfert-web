import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";
import Header from "@/components/common/header";
import { Providers } from "@/components/providers";

const font = Sora({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Seyfert | Discord library",
	description: "Interact Discord API your way",
	openGraph: {
		siteName: "Seyfert",
		title: "Seyfert | Discord library",
		description: "Interact Discord API your way",
		type: "website",
		url: "https://seyfert.dev",
		images: [
			{
				url: "/brand/og-image.png",
				width: 1280,
				height: 640,
				alt: "Seyfert | Discord library",
			},
		],
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className="dark">
			<body className={font.className}>
				<Providers>
					<Header />
					<div className="p-12 lg:px-24 lg:py-24">{children}</div>
				</Providers>
			</body>
		</html>
	);
}
