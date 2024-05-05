"use client";

import {
	BookOpenIcon,
	ChatBubbleLeftEllipsisIcon,
} from "@heroicons/react/20/solid";
import { Button, Snippet } from "@nextui-org/react";
import { AnimatePresence, motion } from "framer-motion";
import { PrefetchKind } from "next/dist/client/components/router-reducer/router-reducer-types";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import AnimatedText from "react-animated-text-content";

import SeyfertLogo from "../../public/brand/seyfert.svg";
import SeyfertKawaiiLogo from "../../public/brand/seyfert-uwu.png";

export default function Page() {
	const router = useRouter();

	const searchParams = useSearchParams();
	const uwu = searchParams.get("uwu");

	useEffect(() => {
		router.prefetch("/features", {
			kind: PrefetchKind.FULL,
		});
		router.prefetch("/credits", {
			kind: PrefetchKind.FULL,
		});
	});
	return (
		<div>
			<div className="flex justify-between items-center gap-14">
				<div className="flex flex-col gap-2">
					<motion.span
						className="uppercase font-bold text-sm text-default-500"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 0,
						}}
					>
						Meet seyfert...
					</motion.span>
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
						You write amazing things; we make them happen.
					</AnimatedText>
					<motion.p
						className="text-default-500 duration-200 lg:text-base text-sm"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 1,
						}}
					>
						We make easy to interact with the Discord API, big cache control,
						scalable code and a pretty dev experience.
					</motion.p>
					<motion.div
						className="flex items-center gap-2"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 2,
						}}
					>
						<Link href="https://docs.seyfert.dev/">
							<Button
								variant="solid"
								startContent={<BookOpenIcon className="w-5 h-5" />}
							>
								Get started
							</Button>
						</Link>
						<Link href="https://discord.com/invite/RmW54ShzMA">
							<Button
								variant="faded"
								startContent={
									<ChatBubbleLeftEllipsisIcon className="w-5 h-5" />
								}
							>
								Support
							</Button>
						</Link>
					</motion.div>
					<motion.div
						className="mt-5"
						initial={{ y: 10, opacity: 0 }}
						animate={{ y: 0, opacity: 100 }}
						transition={{
							duration: 0.5,
							delay: 2.5,
						}}
					>
						<Snippet>pnpm add seyfert</Snippet>
					</motion.div>
				</div>
				<AnimatePresence>
					{uwu ? (
						<motion.img
							initial={{ y: 10, opacity: 0 }}
							animate={{ y: 0, opacity: 100 }}
							transition={{
								duration: 0.5,
								delay: 0,
							}}
							src={SeyfertKawaiiLogo.src}
							className="w-[70%]"
						/>
					) : (
						<motion.div
							className="max-w-xl w-full h-80 lg:flex hidden"
							initial={{ y: 10, opacity: 0 }}
							animate={{ y: 0, opacity: 100 }}
							transition={{
								duration: 0.5,
								delay: 1.5,
							}}
						>
							<div className="bg-default-100 h-full rounded-xl">
								<div className="w-full h-12 bg-default-50 rounded-t-xl p-3 flex items-center justify-between">
									<div className="flex gap-2 items-center">
										<div className="w-5 h-5 rounded-full bg-red-500" />
										<div className="w-5 h-5 rounded-full bg-amber-500" />
										<div className="w-5 h-5 rounded-full bg-green-500" />
									</div>
									<img
										alt="Seyfert Logo"
										src={SeyfertLogo.src}
										className="w-8 h-8"
									/>
								</div>

								<div className="p-3 font-mono flex flex-col gap-0">
									<span>
										~/dev/seybot ${" "}
										<strong className="text-emerald-500">
											pnpm add seyfert
										</strong>
									</span>
									<span>
										Packages: <strong className="text-emerald-500">+182</strong>
									</span>
									<span>
										<strong className="text-emerald-500">
											++++++++++++++++++++++++++++++++++++++++++++++++++++
										</strong>
									</span>
									<span>
										Progress: resolved{" "}
										<strong className="text-blue-500">542</strong>, reused{" "}
										<strong className="text-blue-500">454</strong>, downloaded{" "}
										<strong className="text-blue-500">79</strong>, added{" "}
										<strong className="text-blue-500">182</strong>, done
									</span>
									<span>
										~/dev/seybot ${" "}
										<strong className="text-emerald-500">pnpm dev</strong>
									</span>
									<span>
										<strong className="text-blue-500">[LOGGER] INFO -</strong>{" "}
										Starting...
									</span>
									<span>
										<strong className="text-violet-500">
											[LOGGER] DEBUG -
										</strong>{" "}
										Memory usage: ~78mb
									</span>
									<span>
										<strong className="text-violet-500">
											[LOGGER] DEBUG -
										</strong>{" "}
										Shard count: 3
									</span>
									<span>
										<strong className="text-emerald-500">
											[LOGGER] SUCCESS -
										</strong>{" "}
										Bot is now online in all shards.
									</span>
								</div>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		</div>
	);
}
