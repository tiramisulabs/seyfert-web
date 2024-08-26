"use client";

import { Card } from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Grid, GridItem, VStack } from "@/styled-system/jsx";
import {
	IconBrandTypescript,
	IconChartArrowsVertical,
	IconMoodHappyFilled,
	IconPalette,
} from "@tabler/icons-react";

export default function HomeFeatures() {
	return (
		<VStack alignItems={"start"} w="full">
			<Heading size="3xl" mb={{ base: 4, md: 6 }}>Features</Heading>
			<Grid
				w="full"
				gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
				gap={{ base: 4, md: 6 }}
			>
				<GridItem>
					<Card h="full">
						<VStack alignItems={"start"} h="full">
							<IconBrandTypescript className={css({ w: 9, h: 9 })} />
							<Heading size="lg" fontSize={{ md: "xl" }}>Written in TypeScript</Heading>
							<Text>
								Seyfert is fully written from scratch in TypeScript with modern
								practices so you don't need to worry about stability.
							</Text>
						</VStack>

					</Card>
				</GridItem>
				<GridItem>
					<Card h="full">
						<VStack alignItems={"start"} h="full">
							<IconChartArrowsVertical className={css({ w: 9, h: 9 })} />
							<Heading size="lg">Scalable</Heading>
							<Text>
								Seyfert is tested on both big and small bots and there were
								perfect performance results on both of them.
							</Text>
						</VStack>
					</Card>
				</GridItem>
				<GridItem>
					<Card h="full">
						<VStack alignItems={"start"} h="full">
							<IconMoodHappyFilled className={css({ w: 9, h: 9 })} />
							<Heading size="lg">Effortless Development</Heading>
							<Text>
								Developer experience is at the core of Seyfert, with a focus on
								easy setup to only worry about your bot's logic.
							</Text>
						</VStack>
					</Card>
				</GridItem>
				<GridItem>
					<Card h="full">
						<VStack alignItems={"start"} h="full">
							<IconPalette className={css({ w: 9, h: 9 })} />
							<Heading size="lg">Full customization</Heading>
							<Text>
								Seyfert makes customization easier than ever, with Seyfert you
								can customize each aspect of your bot's functions, from cache to
								behaviors!
							</Text>
						</VStack>
					</Card>
				</GridItem>
			</Grid>
		</VStack >
	);
}
