import { Text } from "@/components/ui/text";
import { Box, HStack, VStack } from "@/styled-system/jsx";

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
							w={"5%"}
							h={9}
							rounded="md"
						/>
						<Text ml="auto">50mb</Text>
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
						<Text ml="auto">200mb</Text>
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
						<Box bg="background.400" w={"40%"} h={9} rounded="md" />
						<Text ml="auto">245mb</Text>
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
						<Box bg="background.400" w={"60%"} h={9} rounded="md" />
						<Text ml="auto">343mb</Text>
					</HStack>
				</HStack>
			</VStack>
		</Box>
	);
}
