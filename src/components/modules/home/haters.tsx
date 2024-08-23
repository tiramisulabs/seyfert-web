"use client";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Grid, GridItem, HStack, VStack } from "@/styled-system/jsx";
import Image from "next/image";

const haters: {
	displayName: string;
	username: string;
	avatar: string;
	content: React.ReactNode;
}[] = [
		{
			displayName: "Socram09",
			username: "socram09",
			avatar: "d038d272c589230c38f84243789692c3",
			content: <>I have no idea how this thing turns on.</>,
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
			avatar: "324f47e4cdb102f41303d7edb0213175",
			content: <>GOMEN AMANAI</>
		},
		{
			displayName: "Deivid",
			username: "deivid",
			avatar: "a_842b80d2226ed205deeec10cd2a99ca9",
			content: <>Breakfast every day. Today I am fasting.</>
		},
		{
			displayName: "JustEvil",
			username: "justevil",
			avatar: "0f7fcc364251c08e705dfffed8182091",
			content: <>Is so good that I can't even use it.</>
		},
		{
			displayName: "Sawako",
			username: "sawa_ko",
			avatar: "3cfd56ea7764ac48aa1b33874edc8d64",
			content: <>I hate seyfert so much that I sponsor them &gt;:(</>
		},
		{
			displayName: "Miia",
			username: "miia",
			avatar: "ae86fffd53d44c4c2f9cf532e18d4e61",
			content: <>Seyfert works until you switch it on.</>
		},
		{
			displayName: "Shisui San",
			username: "shisuisan",
			avatar: "a_b490bbd37a4037949d0868c222fa7033",
			content: "Seyfert better keep working else I will be fired"
		}
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
