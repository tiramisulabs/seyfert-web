import { type RecipeVariantProps, cva } from "@/styled-system/css";
import { styled } from "@/styled-system/jsx";

export const input = cva({
	base: {
		transitionDuration: "normal",
		outline: "none",
		px: 3,
		py: 2,
		borderRadius: "lg",
		bg: {
			base: "background.900",
			_hover: "background.800",
		},
		borderWidth: 1,
		borderColor: {
			base: "background.800",
			_hover: "background.700",
		},
		_placeholder: {
			color: "background.400",
			fontStyle: "italic",
		},
	},
});

export type InputVariants = RecipeVariantProps<typeof input>;

export const Input = styled("input", input);
