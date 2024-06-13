import { css } from "@/styled-system/css";
import { IconLoader2, type IconProps } from "@tabler/icons-react";

export default function Spinner(props: IconProps) {
	return (
		<IconLoader2
			{...props}
			size={20}
			className={css({ mr: 3, animation: "spin 1s linear infinite" })}
		/>
	);
}
