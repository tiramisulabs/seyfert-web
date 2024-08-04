"use client";

import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import type React from "react";

export default function Providers({ children }: React.PropsWithChildren) {
	const queryClient = new QueryClient();

	return (
		<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
	);
}
