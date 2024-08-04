import Header from "@/components/shared/header";
import Particles from "@/components/shared/magicui/particles";
import Providers from "@/components/shared/providers";
import { css } from "@/styled-system/css";
import { Container } from "@/styled-system/jsx";
import type { Metadata } from "next";
import { Inter as Font } from "next/font/google";

import "@/styles/globals.css";

const font = Font({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Seyfert | The Discord framework",
	description:
		"Seyfert is a powerful library that focuses on Discord and its bot API. It offers support for scalable applications and unique utilities.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<Providers>
			<html lang="en">
				<body className={font.className}>
					<Particles
						className={css({
							position: "absolute",
							inset: 0,
						})}
						quantity={100}
						ease={80}
						refresh
					/>
					<Header />
					<Container py={11}>{children}</Container>
				</body>
			</html>
		</Providers>
	);
}
