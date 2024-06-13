import { defineConfig } from "@pandacss/dev";
import { getColors } from "theme-colors";

const brandColors = getColors("#0ba2c5");
const backgroundColors = getColors("#051721");

function generateColorScheme(color: Record<string, string>) {
	return Object.entries(color).reduce(
		// biome-ignore lint/suspicious/noExplicitAny: bro
		(acc: any, [key, value]) => {
			acc[key] = { value };
			return acc;
		},
		{},
	);
}

export default defineConfig({
	// Whether to use css reset
	preflight: true,

	// Where to look for your css declarations
	include: [
		"./src/components/**/*.{ts,tsx,js,jsx}",
		"./src/app/**/*.{ts,tsx,js,jsx}",
	],

	// Files to exclude
	exclude: [],

	// Useful for theme customization
	theme: {
		extend: {
			tokens: {
				colors: {
					brand: generateColorScheme(brandColors),
					background: generateColorScheme(backgroundColors),
				},
			},
		},
	},

	// Global css
	globalCss: {
		extend: {
			body: {
				bg: "background.950",
				color: "background.50",
			},
		},
	},

	// The output directory for your css system
	outdir: "src/styled-system",
	jsxFramework: "react",
});
