import { type RecipeVariantProps, cva } from "@/styled-system/css";
import { styled } from "@/styled-system/jsx";

export const heading = cva({
	base: {
		fontWeight: "500",
		lineHeight: "1.25",
		letterSpacing: "0",
		textDecoration: "None",
		textTransform: "None",
	},
	variants: {
		size: {
			"6xl": {
				fontSize: "6xl",
				fontWeight: "800",
			},
			"5xl": {
				fontSize: "5xl",
				fontWeight: "800",
			},
			"4xl": {
				fontSize: "4xl",
				fontWeight: "800",
			},
			"3xl": {
				fontSize: "3xl",
				fontWeight: "800",
			},
			"2xl": {
				fontSize: "2xl",
				fontWeight: "700",
			},
			xl: {
				fontSize: "xl",
				fontWeight: "700",
			},
			lg: {
				fontSize: "lg",
				fontWeight: "600",
			},
		},
	},
	defaultVariants: {
		size: "2xl",
	},
});

export type HeadingVariants = RecipeVariantProps<typeof heading>;

export const Heading = styled("h1", heading);
