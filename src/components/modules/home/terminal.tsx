import { Text } from "@/components/ui/text";
import { Box, Circle, Flex } from "@/styled-system/jsx";

export default function HomeTerminal() {
	return (
		<Box
			p={4}
			rounded="xl"
			borderWidth={1}
			borderColor={"background.600"}
			w={{ lg: "1/2", base: "full" }}
			bg={"background.800"}
			fontSize={"sm"}
			fontFamily={"monospace"}
		>
			<Flex w={"full"} alignItems={"center"} justifyContent={"space-between"}>
				<Flex gap={2}>
					<Circle bg={"red.400"} w={"4"} h={"4"} />
					<Circle bg={"yellow.400"} w={"4"} h={"4"} />
					<Circle bg={"green.400"} w={"4"} h={"4"} />
				</Flex>
				<Text>Terminal</Text>
			</Flex>
			<Flex flexDir={"column"} gap={1} mt={3}>
				<Flex gap={2} w={"full"}>
					<strong>/usr/bin $</strong>
					pnpm create seyfert
				</Flex>
				<Flex gap={2} w={"full"} bg="red.500/20" py={1}>
					<strong>Error:</strong>
					This command is not yet available!
				</Flex>
				<Flex gap={2} w={"full"} bg="red.500/20" py={1}>
					<strong>Status:</strong>
					Exiting...
				</Flex>
				<Flex gap={2} w={"full"}>
					<strong>/usr/bin $</strong>_
				</Flex>
			</Flex>
		</Box>
	);
}
