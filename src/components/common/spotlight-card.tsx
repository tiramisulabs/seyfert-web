"use client";

import { motion, useMotionTemplate, useMotionValue } from "framer-motion";
import type { MouseEvent, ReactNode } from "react";

interface SpotlightCardProps {
	icon?: ReactNode;
	title: ReactNode;
	description?: ReactNode;
}

export default function SpotlightCard({
	icon,
	title,
	description,
}: SpotlightCardProps) {
	const mouseX = useMotionValue(0);
	const mouseY = useMotionValue(0);

	function handleMouseMove({ currentTarget, clientX, clientY }: MouseEvent) {
		const { left, top } = currentTarget.getBoundingClientRect();

		mouseX.set(clientX - left);
		mouseY.set(clientY - top);
	}

	return (
		<div
			className="group relative w-full rounded-xl bg-default-100 border border-default-200 px-8 py-10 shadow-2xl"
			onMouseMove={handleMouseMove}
		>
			<motion.div
				className="pointer-events-none absolute -inset-px rounded-xl opacity-0 transition duration-300 group-hover:opacity-100"
				style={{
					background: useMotionTemplate`
            radial-gradient(
              650px circle at ${mouseX}px ${mouseY}px,
              rgba(255, 255, 255, 0.05),
              transparent 80%
            )
          `,
				}}
			/>
			<div>
				{icon}
				<div className="mt-2 flex items-center gap-x-2">
					<h1 className="text-xl lg:text-5xl font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-br from-white to-default-500">
						{title}
					</h1>
				</div>
				{description && (
					<p className="mt-6 text-sm lg:text-base text-wrap leading-7 text-default-500">
						{description}
					</p>
				)}
			</div>
		</div>
	);
}
