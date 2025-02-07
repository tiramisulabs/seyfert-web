"use client";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Grid, GridItem, HStack, VStack } from "@/styled-system/jsx";
import Image from "next/image";

const haters: {
	displayName: string;
	username: string
	content: React.ReactNode;
}[] = [
		{
			displayName: "Socram09",
			username: "socram09",
			content: <>I have no idea how this thing turns on.</>,
		},
		{
			displayName: "MARCROCK22",
			username: "marcrock22",
			content: <>I don't even know why I made this shit</>
		},
		{
			displayName: "FreeAoi",
			username: "freeaoi",
			content: <>GOMEN AMANAI</>
		},
		{
			displayName: "Deivid",
			username: "deivid",
			content: <>Breakfast every day. Today I am fasting.</>
		},
		{
			displayName: "JustEvil",
			username: "justevil",
			content: <>Is so good that I can't even use it.</>
		},
		{
			displayName: "Sawako",
			username: "sawa_ko",
			content: <>I hate seyfert so much that I sponsor them &gt;:(</>
		},
		{
			displayName: "Miia",
			username: "miia",
			content: <>Seyfert works until you switch it on.</>
		},
		{
			displayName: "Shisui San",
			username: "shisuisan",
			content: "Seyfert better keep working else I will be fired"
		}
	];

export default function HomeHaters() {
	return (
		<VStack alignItems={"start"} w="full">
			<Heading size="3xl" mb={{ base: 4, md: 6 }}>Everyone loves Seyfert!</Heading>
			<Grid
				w="full"
				gridTemplateColumns={{
					base: "1fr",
					sm: "repeat(2, 1fr)",
					md: "repeat(3, 1fr)",
					lg: "repeat(4, 1fr)"
				}}
				gap={{ base: 4, md: 6 }}
			>
				{haters.map((hater, key) => (
					<GridItem key={key}>
						<Card h="full">
							<VStack alignItems={"start"} h="full" gap={3}>
								<HStack gap={3}>
									<Image
										width={50}
										height={50}
										alt={hater.displayName}
										src={`/haters/${hater.username}.png`}
										className={css({
											rounded: "full",
										})}
									/>
									<VStack gap={0} alignItems={"start"}>
										<Heading size="2xl">{hater.displayName}</Heading>
										<Text fontSize="sm" color="gray.500">@{hater.username}</Text>
									</VStack>
								</HStack>
								<Text>{hater.content}</Text>
							</VStack>
						</Card>
					</GridItem>
				))}
			</Grid>
		</VStack>
	);
}
