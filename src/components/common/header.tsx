"use client";

import { motion } from "framer-motion";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const tourRoutes = [
	{ id: "/", label: "Home" },
	{ id: "/features", label: "Features" },
	{ id: "/benchmarks", label: "Benchmarks" },
	{ id: "/credits", label: "Credits" },
];

export default function Header() {
	const pathname = usePathname();
	const query = useSearchParams();
	const router = useRouter();
	const [activeTab, setActiveTab] = useState(tourRoutes[0].id);
	const uwu = query.get("uwu");
	const queryString = new URLSearchParams(query).toString();

	useEffect(() => {
		setActiveTab(pathname);
	}, [pathname]);

	return (
		<header className="w-fit mx-auto bg-default-50/50 backdrop-blur rounded-xl lg:p-5 p-3 top-5 sticky z-10">
			<div className="flex items-center gap-2 mx-auto w-fit">
				{/* biome-ignore lint/a11y/useKeyWithClickEvents: too lazy for this */}
				<img
					src={uwu ? "/brand/seyfert-uwu.png" : "/brand/seyfert.svg"}
					className="w-10 h-10 cursor-pointer"
					alt="Seyfert Logo"
					onClick={() => router.replace(`/?${queryString}`)}
				/>
				<div className="h-10 w-px rotate-12 bg-content3" />
				{tourRoutes.map((tab) => (
					<button
						type="button"
						key={tab.id}
						onClick={() => router.replace(`${tab.id}?${queryString}`)}
						className={`${
							activeTab === tab.id ? "" : "hover:text-default-600"
						} relative rounded-full px-2 py-1 text-sm font-medium text-white outline-none transition focus-visible:outline-2`}
						style={{
							WebkitTapHighlightColor: "transparent",
						}}
					>
						{activeTab === tab.id && (
							<motion.span
								layoutId="bubble"
								className="absolute inset-0 z-10 bg-white mix-blend-difference rounded-full"
								transition={{ type: "spring", bounce: 0.4, duration: 0.9 }}
							/>
						)}
						{tab.label}
					</button>
				))}
			</div>
		</header>
	);
}
