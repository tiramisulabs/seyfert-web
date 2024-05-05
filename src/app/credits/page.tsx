"use client";

import { HeartIcon } from "@heroicons/react/20/solid";
import { motion } from "framer-motion";
import Link from "next/link";
import AnimatedText from "react-animated-text-content";

const credits = {
	main: [
		{
			social: "https://github.com/marcrock22",
			name: "Marcrock22",
		},
		{
			social: "https://github.com/socram09",
			name: "Socram09",
		},
		{
			social: "https://github.com/freeaoi",
			name: "FreeAoi",
		},
	],
	web: [
		{
			social: "https://github.com/simxnet",
			name: "Simxnet",
			quote: "Me, lol",
		},
	],
	extra: [
		{
			social: "https://github.com/yuzudev",
			name: "Yuzu",
			quote: "Biscuit.js founder",
		},
		{
			social: "https://github.com/dragurimu",
			name: "Miia",
			quote: "Domain registration, consultancy, etc.",
		},
		{
			social: "https://github.com/drylozu",
			name: "David",
			quote: "Cat officer 🐈",
		},
	],
};

export default function Page() {
	return (
		<div className="">
			<div className="flex justify-between items-start gap-14">
				<div className="flex flex-col gap-2">
					<AnimatedText
						type="chars"
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
						Credits
					</AnimatedText>
					<motion.p
						className="text-default-500 duration-200 flex items-center gap-1 lg:text-base text-sm"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 0.5,
						}}
					>
						Thanks to these amazing people, Seyfert is possible{" "}
						<HeartIcon className="w-5 h-5 text-rose-500" />
					</motion.p>
					<motion.p
						className="text-default-500 duration-200 gap-1 lg:text-base text-sm"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 0.6,
						}}
					>
						Hey, this is a message from Simxnet, the creator of this website. I
						just wanted to say that I also made a Discord botlist if you want to
						check it out you know...
						<Link
							className="underline ml-1 text-default-800 hover:text-default-700"
							target="_blank"
							referrerPolicy="origin"
							href="https://dbots.fun?ref=seyfert.dev"
						>
							dbots.fun
						</Link>
					</motion.p>
				</div>
			</div>
			<motion.div
				className="my-5 flex flex-col gap-4"
				initial={{ y: 10, opacity: 0 }}
				animate={{ y: 0, opacity: 100 }}
				transition={{
					duration: 0.5,
					delay: 1,
				}}
			>
				<div className="flex flex-col gap-2">
					<h3 className="font-bold text-2xl">Main development</h3>
					<div className="flex flex-col gap-1 w-fit">
						{credits.main.map((u) => (
							<Link href={u.social} key={u.name}>
								<div className="relative before:absolute before:bg-primary before:bottom-0 before:left-0 before:h-full before:w-full before:origin-bottom before:scale-y-[0.35] hover:before:scale-y-100 before:transition-transform before:ease-in-out before:duration-500">
									<span className="relative">{u.name}</span>
								</div>
							</Link>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-2 opacity-70">
					<h3 className="font-bold text-2xl">Web development</h3>
					<div className="flex flex-col gap-1">
						{credits.web.map((u) => (
							<Link href={u.social} key={u.name}>
								<span>
									{u.name} <span className="text-default-500">— {u.quote}</span>
								</span>
							</Link>
						))}
					</div>
				</div>
				<div className="flex flex-col gap-2 opacity-50">
					<h3 className="font-bold text-2xl">Extras</h3>
					<div className="flex flex-col gap-1">
						{credits.extra.map((u) => (
							<Link href={u.social} key={u.name}>
								<span>
									{u.name} <span className="text-default-500">— {u.quote}</span>
								</span>
							</Link>
						))}
					</div>
				</div>
			</motion.div>
		</div>
	);
}
