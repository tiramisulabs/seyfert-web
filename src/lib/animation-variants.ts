import type { Variants } from "framer-motion";

export const fadeInFromTopAndOutTop: Variants = {
	initial: { y: -5, x: 0, opacity: 0 },
	enter: { y: 0, opacity: 1 },
	exit: {
		y: -5,
		opacity: 0,
		transition: { duration: 0.2 },
	},
};
