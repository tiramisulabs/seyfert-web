import { css } from "@/styled-system/css";
import { Container, Flex } from "@/styled-system/jsx";
import { Heading } from "../ui/heading";
import Link from "next/link";
import { IconBrandGithubFilled } from "@tabler/icons-react";

export default function Header() {
	return (
		<header
			className={css({
				top: 0,
				position: "sticky",
				bg: "background.800/50",
				w: "full",
				py: 5,
				borderBottomWidth: 2,
				borderColor: "background.600",
				zIndex: 100,
				backdropFilter: "auto",
				backdropBlur: "sm",
			})}
		>
			<Container w={"full"}>
				<Flex justifyContent={"space-between"} alignItems={"center"}>
					<Heading>Seyfert</Heading>
					<Link
						href="https://github.com/tiramisulabs/seyfert"
						target="_blank"
						referrerPolicy="no-referrer"
					>
						<IconBrandGithubFilled />
					</Link>
				</Flex>
			</Container>
		</header>
	);
}
