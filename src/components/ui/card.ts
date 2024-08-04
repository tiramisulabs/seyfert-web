import { type RecipeVariantProps, cva } from "@/styled-system/css";
import { styled } from "@/styled-system/jsx";
import { motion } from "framer-motion";

export const card = cva({
	base: {
		w: "full",
		p: "4",
		bg: "background.800",
		borderWidth: 1,
		borderColor: "background.600",
		rounded: "xl",
		h: "full",
		transitionProperty: "all",
		transitionDuration: "fast",
	},
});

export type CardVariants = RecipeVariantProps<typeof card>;

export const Card = styled(motion.div, card);
