import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { css } from "@/styled-system/css";
import { Box, HStack, VStack } from "@/styled-system/jsx";
import { IconChartLine } from "@tabler/icons-react";
import Link from "next/link";

export default function HomeBench() {
	return (
		<Box w={"1/2"} fontSize={"sm"}>
			<VStack w="full">
				<HStack w="full">
					<Text w="full" maxW={"24"}>
						Seyfert
					</Text>
					<HStack
						w="full"
						p={2}
						borderWidth={1}
						rounded="md"
						borderColor={"background.400"}
					>
						<Box
							bgGradient={"to-r"}
							gradientFrom={"brand.500"}
							gradientTo={"green.500"}
							w={"27%"}
							h={9}
							rounded="md"
						/>
						<Text ml="auto">75 MB</Text>
					</HStack>
				</HStack>
				<HStack w="full">
					<Text w="full" maxW={"24"}>
						Eris
					</Text>
					<HStack
						w="full"
						p={2}
						borderWidth={1}
						rounded="md"
						borderColor={"background.400"}
					>
						<Box bg="background.400" w={"30%"} h={9} rounded="md" />
						<Text ml="auto">79 MB</Text>
					</HStack>
				</HStack>
				<HStack w="full">
					<Text w="full" maxW={"24"}>
						Discord.js
					</Text>
					<HStack
						w="full"
						p={2}
						borderWidth={1}
						rounded="md"
						borderColor={"background.400"}
					>
						<Box bg="background.400" w={"40%"} h={9} rounded="md" />
						<Text ml="auto">89 MB</Text>
					</HStack>
				</HStack>
				<HStack w="full">
					<Text w="full" maxW={"24"}>
						Detritus
					</Text>
					<HStack
						w="full"
						p={2}
						borderWidth={1}
						rounded="md"
						borderColor={"background.400"}
					>
						<Box bg="background.400" w={"45%"} h={9} rounded="md" />
						<Text ml="auto">99 MB</Text>
					</HStack>
				</HStack>
				<HStack w="full">
					<Text w="full" maxW={"24"}>
						Oceanic
					</Text>
					<HStack
						w="full"
						p={2}
						borderWidth={1}
						rounded="md"
						borderColor={"background.400"}
					>
						<Box bg="background.400" w={"55%"} h={9} rounded="md" />
						<Text ml="auto">104 MB</Text>
					</HStack>
				</HStack>
				<Box mt={4}>
					<Link href="/benchmark">
						<Button
							size="lg"
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
							<span role="img" aria-label="sparkles" style={{ marginRight: '8px' }}>✨</span>
							View Benchmark
							<span role="img" aria-label="sparkles" style={{ marginLeft: '8px' }}>✨</span>
						</Button>
					</Link>
				</Box>
			</VStack>
		</Box>
	);
}
