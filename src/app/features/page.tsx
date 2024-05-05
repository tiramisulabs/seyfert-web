"use client";

import SpotlightCard from "@/components/common/spotlight-card";
import {
	BeakerIcon,
	FaceSmileIcon,
	FingerPrintIcon,
	HeartIcon,
	LightBulbIcon,
	PaintBrushIcon,
} from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import AnimatedText from "react-animated-text-content";

export default function Page() {
	return (
		<div className="">
			<div className="flex justify-between items-start gap-14">
				<div className="flex flex-col gap-2">
					<AnimatedText
						type="words"
						animation={{
							scale: 1.1,
						}}
						animationType={"lights"}
						interval={0.04}
						duration={0.8}
						tag="h1"
						className="lg:text-5xl text-4xl font-black duration-150"
						includeWhiteSpaces
						threshold={0.1}
						rootMargin="20%"
					>
						Why choose Seyfert for your next project?
					</AnimatedText>
					<motion.p
						className="text-default-500 duration-200 lg:text-base text-sm max-w-3xl w-full"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 0.5,
						}}
					>
						There are many reasons to use Seyfert, but we cannot put them all on
						this page, so here are a few of them!
					</motion.p>
				</div>
			</div>
			<motion.div
				className="grid grid-cols-1 lg:grid-cols-2 gap-2 my-5"
				initial={{ y: 10, opacity: 0 }}
				animate={{ y: 0, opacity: 100 }}
				transition={{
					duration: 0.5,
					delay: 1,
				}}
			>
				<SpotlightCard
					icon={<FingerPrintIcon className="w-10 h-10" />}
					title="RAM saver"
					description="Seyfert is amazingly lightweight"
				/>
				<SpotlightCard
					icon={<BeakerIcon className="w-10 h-10" />}
					title="Latest features"
					description="Seyfert is in development and it has the latest Discord features"
				/>
				<SpotlightCard
					icon={<FaceSmileIcon className="w-10 h-10" />}
					title="Dev experience"
					description="Seyfert is made entirely in Typescript to build scalable bots at the speed of light"
				/>
				<SpotlightCard
					icon={<HeartIcon className="w-10 h-10" />}
					title="24/6 support (Sunday is for going to church)"
					description="Seyfert has a good support team who will assist you in your code"
				/>
				<SpotlightCard
					icon={<LightBulbIcon className="w-10 h-10" />}
					title="Written from scratch"
					description="Seyfert is 100% written from scratch, no external dependencies."
				/>
				<SpotlightCard
					icon={<PaintBrushIcon className="w-10 h-10" />}
					title="Type-safe"
					description="Seyfert is fully type-safed, never worry about a wrong type again"
				/>
			</motion.div>
		</div>
	);
}
