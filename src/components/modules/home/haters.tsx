"use client";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Grid, GridItem, HStack, VStack } from "@/styled-system/jsx";
import Image from "next/image";

const haters = [
	{
		displayName: "monbrey",
		username: "monbrey",
		avatar: "d34a3a4f1d5d46455ae67e58dac847b9",
		content: <>Everyone uses Seyfert now. discord.js is deprecated</>,
	},
    {
        displayName: "MARCROCK22",
        username: "marcrock22",
        avatar: "6aff65edc136278714c4d4998dca4680",
        content: <>I don't even know why I made this shit</>
    },
    {
        displayName: "FreeAoi",
        username: "freeaoi",
        avatar: "87c010308e281f2c32e54c41167d2ff1",
        content: <>I use discord.js btw</>
    },
    {
        displayName: "JustEvil",
        username: "justevil",
        avatar: "0f7fcc364251c08e705dfffed8182091",
        content: <>discord.js better already had this a long ago 💀</>
    },
    {
        displayName: "Sawako",
        username: "sawa_ko",
        avatar: "3cfd56ea7764ac48aa1b33874edc8d64",
        content: <>Sapphire already has all of that 🙄</>
    },
];

export default function HomeHaters() {
	return (
		<VStack alignItems={"start"}>
			<Heading size="3xl">Everyone loves Seyfert!</Heading>
			<Grid w="full" gridTemplateColumns={4}>
				{haters.map((hater, key) => (
					<GridItem maxW="sm" key={key}>
						<Card>
							<VStack alignItems={"start"}>
								<HStack>
									<Image
										width={50}
										height={50}
										alt={hater.displayName}
										src={`/haters/${hater.avatar}.png`}
										className={css({
											rounded: "full",
										})}
									/>
									<VStack gap={0} alignItems={"start"}>
										<Heading size="lg">{hater.displayName}</Heading>
										<Text>@{hater.username}</Text>
									</VStack>
								</HStack>
								{hater.content}
							</VStack>
						</Card>
					</GridItem>
				))}
			</Grid>
		</VStack>
	);
}
