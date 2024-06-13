import { type RecipeVariantProps, cva } from "@/styled-system/css";
import { styled } from "@/styled-system/jsx";

export const text = cva({
	base: {
		fontWeight: "400",
		lineHeight: "1.25",
		letterSpacing: "0",
		textDecoration: "None",
		textTransform: "None",
	},
	variants: {
		size: {
			lg: {
				fontSize: "lg",
			},
			md: {
				fontSize: "md",
			},
		},
	},
	defaultVariants: {
		size: "md",
	},
});

export type TextVariants = RecipeVariantProps<typeof text>;

export const Text = styled("p", text);
