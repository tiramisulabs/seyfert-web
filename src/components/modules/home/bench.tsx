import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Box, HStack, VStack } from "@/styled-system/jsx";
import { IconArrowBadgeRightFilled } from "@tabler/icons-react";
import Link from "next/link";

export default function HomeBench() {
	return (
		<Box w={{ base: "full", md: "3/4", lg: "full", xl: "full" }} fontSize={{ base: "xs", sm: "sm", md: "md" }}>
			<VStack w="full" gap={{ base: 2, sm: 3, md: 4 }}>
				{[
					{ name: "Seyfert", width: "27%", memory: "75 MB", gradient: true },
					{ name: "Eris", width: "30%", memory: "79 MB" },
					{ name: "Discord.js", width: "40%", memory: "89 MB" },
					{ name: "Detritus", width: "45%", memory: "99 MB" },
					{ name: "Oceanic", width: "55%", memory: "104 MB" },
				].map((item, index) => (
					<HStack key={index} w="full">
						<Text w="full" maxW={{ base: "16", sm: "24", md: "32" }}>
							{item.name}
						</Text>
						<HStack
							w="full"
							p={0.5}
							borderWidth={1}
							rounded="md"
							borderColor={"background.400"}
						>
							<Box
								bgGradient={item.gradient ? "to-r" : undefined}
								gradientFrom={item.gradient ? "brand.500" : undefined}
								gradientTo={item.gradient ? "green.500" : undefined}
								bg={!item.gradient ? "background.400" : undefined}
								w={item.width}
								h={{ base: 6, sm: 8, md: 10 }}
								rounded="md"
							/>
							<Text ml="auto" mr="1.5">{item.memory}</Text>
						</HStack>
					</HStack>
				))}
				<Box mt={{ base: 2, sm: 4, md: 6 }}>
					<Link href="/benchmark">
						<Button
							size="md"
							color="brand"
							className={css({
								transition: "all 0.2s",
								borderRadius: "full",
								fontWeight: "bold",
								_hover: {
									bg: "green.400",
									color: "white",
									transform: "translateY(-2px) scale(1.05)",
									boxShadow: "0 0 15px rgba(0, 255, 0, 0.5)",
								},
							})}
						>
							View Benchmark
							<IconArrowBadgeRightFilled size={20} style={{ marginLeft: '8px' }} />
						</Button>
					</Link>
				</Box>
			</VStack>
		</Box>
	);
}
