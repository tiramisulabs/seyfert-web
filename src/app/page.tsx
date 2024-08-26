import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { css } from "@/styled-system/css";
import { Box, Center, Flex, VStack } from "@/styled-system/jsx";
import { IconAlbum, IconBubbleFilled, IconCheck } from "@tabler/icons-react";
import { Text } from "@/components/ui/text";
import HomeBench from "@/components/modules/home/bench";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import HomeFeatures from "@/components/modules/home/features";
import HomeHaters from "@/components/modules/home/haters";

export default function Page() {
	return (
		<Flex flexDir={"column"} gap={12}>
			<Flex
				alignItems={"center"}
				flexDir={{ lg: "row", base: "column" }}
				justifyContent={"space-between"}
			>
				<Flex maxW={"3xl"} flexDir={"column"} gap={4}>
					<Badge color="brand" className="font">
						<Link href="https://npmjs.com/package/seyfert" target="_blank">
							<Flex alignItems="center">
								<span>Seyfert 2.0 is out!</span>
								<IconAlbum size={16} className={css({ ml: 2 })} />
							</Flex>
						</Link>
					</Badge>
					<Heading size="5xl">
						The Discord framework that{" "}
						<span
							className={css({
								fontStyle: "italic",
								fontFamily: "mono",
								px: 6,
								py: 1,
								bg: "brand.500/20",
								rounded: "xl",
								color: "brand.500",
							})}
						>
							satisfies
						</span>{" "}
						you
					</Heading>
					<Text pr={5}>
						Seyfert is a brand new, edge-bleeding Discord framework made with scalability and performance in mind.
					</Text>
					<Flex
						css={{
							"& svg": {
								color: "green.500",
							},
						}}
						flexDir={"column"}
						gap={3}
					>
						<Flex gap={2} alignItems={"center"}>
							<IconCheck size={24} />
							<Text>TypeScript first</Text>
						</Flex>
						<Flex gap={2} alignItems={"center"}>
							<IconCheck size={24} />
							<Text>Batteries included</Text>
						</Flex>
						<Flex gap={2} alignItems={"center"}>
							<IconCheck size={24} />
							<Text>Low memory usage, always</Text>
						</Flex>
					</Flex>
					<Flex gap={2}>
						<Link
							target="_blank"
							referrerPolicy="no-referrer"
							href="https://docs.seyfert.dev"
						>
							<Button size="lg">Get started</Button>
						</Link>

						<Link
							target="_blank"
							referrerPolicy="no-referrer"
							href="https://discord.gg/Kxjj9HUVyc"
						>
							<Button size="lg" color="gray">
								Join the chat now
							</Button>
						</Link>
					</Flex>
				</Flex>
				<HomeBench />
			</Flex>
			<HomeFeatures />
			<HomeHaters />
			<Box p={6} w="full" rounded="xl" color={"background.900"} bg="brand.600">
				<Center>
					<VStack>
						<IconBubbleFilled size={44} />
						<Heading>Join the party</Heading>
						<Text>Join the discussion and seek help if you need to!</Text>
						<Button color="gray">Join the Discord server</Button>
					</VStack>
				</Center>
			</Box>
		</Flex>
	);
}
