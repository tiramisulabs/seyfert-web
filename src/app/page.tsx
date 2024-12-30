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
import HomeBots from '@/components/modules/home/bots';

export default function Page() {
	return (
		<Flex flexDir={"column"} gap={{ base: 8, md: 12 }}>
			<Flex
				alignItems={{ base: "flex-start", lg: "center" }}
				flexDir={{ base: "column", lg: "row" }}
				justifyContent={"space-between"}
				gap={{ base: 8, lg: 0 }}
			>
				<Flex maxW={{ base: "full", lg: "3xl" }} flexDir={"column"} gap={4}>
					<Badge color="brand" className="font">
						<Link href="https://docs.seyfert.dev/changelog" target="_blank">
							<Flex alignItems="center">
								<span>Seyfert 2.2.0 is out!</span>
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
								px: { base: 2, sm: 4, md: 6 },
								py: 1,
								bg: "brand.500/20",
								rounded: "xl",
								color: "brand.500",
								display: "inline-block",
								my: { base: 2, md: 0 },
							})}
						>
							satisfies
						</span>{" "}
						you
					</Heading>
					<Text pr={{ base: 0, lg: 5 }}>
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
					<Flex gap={2} flexDir={{ base: "column", sm: "row" }} w={{ base: "full", sm: "auto" }}>
						<Link
							target="_blank"
							referrerPolicy="no-referrer"
							href="https://docs.seyfert.dev"
							className={css({ w: { base: "full", sm: "auto" } })}
						>
							<Button size="lg" w={{ base: "full", sm: "auto" }}>Get started</Button>
						</Link>

						<Link
							target="_blank"
							referrerPolicy="no-referrer"
							href="https://discord.gg/XNw2RZFzaP"
							className={css({ w: { base: "full", sm: "auto" } })}
						>
							<Button size="lg" color="gray" w={{ base: "full", sm: "auto" }}>
								Join the chat now
							</Button>
						</Link>
					</Flex>
				</Flex>
				<Box w={{ base: "full", lg: "xl" }}>
					<HomeBench />
				</Box>
			</Flex>
			<HomeFeatures />
			<HomeBots />
			<HomeHaters />
			<Box p={{ base: 4, md: 6 }} w="full" rounded="xl" color={"background.900"} bg="brand.600">
				<Center>
					<VStack gap={{ base: 3, md: 4 }}>
						<IconBubbleFilled size={32} />
						<Heading size="xl">Join the party</Heading>
						<Text textAlign="center">Join the discussion and seek help if you need to!</Text>
						<Button colorScheme="gray" size="md">
							<Link href="https://discord.gg/XNw2RZFzaP" target="_blank">
								Join the Discord server
							</Link>
						</Button>
					</VStack>
				</Center>
			</Box >
		</Flex >
	);
}
