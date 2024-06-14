import { Badge } from "@/components/ui/badge";
import { Heading } from "@/components/ui/heading";
import { css } from "@/styled-system/css";
import { Box, Flex } from "@/styled-system/jsx";
import {
	IconAt,
	IconFingerprintOff,
	IconRocket,
	IconTrashFilled,
} from "@tabler/icons-react";
import { Text } from "@/components/ui/text";
import HomeTerminal from "@/components/modules/home/terminal";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Page() {
	return (
		<Flex
			flexDir={{ lg: "row", base: "column" }}
			justifyContent={"space-between"}
			gap={5}
		>
			<Flex maxW={"3xl"} flexDir={"column"} gap={4}>
				<Badge color="brand">
					Seyfert 2.0 is coming soon!
					<IconRocket size={16} className={css({ ml: 1 })} />
				</Badge>
				<Heading size="5xl">
					The Discord library that{" "}
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
				<Text>
					Seyfert is a brand-new Discord library made entirely in TypeScript for
					TypeScript.
				</Text>
				<Flex flexDir={"column"} gap={3}>
					<Flex gap={2} alignItems={"center"}>
						<Box p={2.5} bg={"red.500/20"} color={"red.500"} rounded="full">
							<IconTrashFilled size={24} />
						</Box>
						<Text>Use only what you need</Text>
					</Flex>
					<Flex gap={2} alignItems={"center"}>
						<Box p={2.5} bg={"green.500/20"} color={"green.500"} rounded="full">
							<IconAt size={24} />
						</Box>
						<Text>Decorator-oriented</Text>
					</Flex>
					<Flex gap={2} alignItems={"center"}>
						<Box
							p={2.5}
							bg={"yellow.500/20"}
							color={"yellow.500"}
							rounded="full"
						>
							<IconFingerprintOff size={24} />
						</Box>
						<Text>Low memory usage</Text>
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
							Join the chat
						</Button>
					</Link>
				</Flex>
			</Flex>
			<HomeTerminal />
		</Flex>
	);
}
