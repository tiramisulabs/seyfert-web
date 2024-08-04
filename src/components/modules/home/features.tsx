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
		<VStack alignItems={"start"}>
			<Heading size="3xl">Features</Heading>
			<Grid w="full" gridTemplateColumns={4}>
				<GridItem maxW="sm">
					<Card>
						<VStack alignItems={"start"}>
							<IconBrandTypescript className={css({ w: 9, h: 9 })} />
							<Heading>Written in TypeScript</Heading>
							<Text>
								Seyfert is fully written from scratch in TypeScript with modern
								practices so you don't need to worry about stability.
							</Text>
						</VStack>
					</Card>
				</GridItem>
				<GridItem maxW="sm">
					<Card>
						<VStack alignItems={"start"}>
							<IconChartArrowsVertical className={css({ w: 9, h: 9 })} />
							<Heading>Scalable</Heading>
							<Text>
								Seyfert is tested on both big and small bots and there were
								perfect performance results on both of them.
							</Text>
						</VStack>
					</Card>
				</GridItem>
				<GridItem maxW="sm">
					<Card>
						<VStack alignItems={"start"}>
							<IconMoodHappyFilled className={css({ w: 9, h: 9 })} />
							<Heading>Easy DX</Heading>
							<Text>
								Seyfert is made for pro and new devs so you can get going with
								Seyfert real quick! Unique requirement: know js and ts basics.
							</Text>
						</VStack>
					</Card>
				</GridItem>
				<GridItem maxW="sm">
					<Card>
						<VStack alignItems={"start"}>
							<IconPalette className={css({ w: 9, h: 9 })} />
							<Heading>Full customization</Heading>
							<Text>
								Seyfert makes customization easier than ever, with Seyfert you
								can customize each aspect of your bot's functions, from cache to
								behaviors!
							</Text>
						</VStack>
					</Card>
				</GridItem>
			</Grid>
			<Text alignSelf={"center"}>And a lot more...</Text>
		</VStack>
	);
}
