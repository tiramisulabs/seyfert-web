import Header from "@/components/shared/header";
import Particles from "@/components/shared/magicui/particles";
import { css } from "@/styled-system/css";
import { Container } from "@/styled-system/jsx";
import "@/styles/globals.css";

import type { Metadata } from "next";
import { Inter } from "next/font/google";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
	title: "Next.js template",
	description:
		"Production-ready Next.js template powered by PandaCSS and HeadlessUI.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={inter.className}>
				<Particles
					className={css({ position: "absolute", inset: 0 })}
					quantity={100}
					ease={80}
					refresh
				/>
				<Header />
				<Container py={11}>{children}</Container>
			</body>
		</html>
	);
}
