"use client"

import type * as React from "react"
import { cn } from "@/lib/utils"
import { Plus } from "lucide-react"

interface CrosshairConfig {
    topLeft?: boolean
    topRight?: boolean
    bottomLeft?: boolean
    bottomRight?: boolean
}

interface GridLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
    children: React.ReactNode
    crosshairs?: CrosshairConfig
    gridLines?: boolean
    columns?: 8 | 12 | 16
    lineVariant?: "all" | "vertical" | "horizontal" | "center" | "none"
}

export function GridLayout({
    children,
    crosshairs,
    gridLines = true,
    columns = 16,
    lineVariant = "all",
    className,
    ...props
}: GridLayoutProps) {
    return (
        <div
            className={cn(
                "relative grid w-full gap-0",
                gridLines && "border-grid-line border",
                columns === 16 && "grid-cols-grid-16",
                columns === 12 && "grid-cols-grid-12",
                columns === 8 && "grid-cols-grid-8",
                className,
            )}
            {...props}
        >
            {gridLines && (
                <div className="absolute inset-0 z-0">
                    {/* Vertikale Linien */}
                    {(lineVariant === "all" ||
                        lineVariant === "vertical" ||
                        lineVariant === "center") && (
                            <div className="absolute inset-0 flex justify-center">
                                {lineVariant === "center" ? (
                                    <div className="border-grid-line h-full w-px border-r" />
                                ) : (
                                    <div
                                        className={cn(
                                            "grid size-full",
                                            columns === 16 && "grid-cols-grid-16",
                                            columns === 12 && "grid-cols-grid-12",
                                            columns === 8 && "grid-cols-grid-8",
                                        )}
                                    >
                                        {Array.from({ length: columns }).map((_, i) => (
                                            <div
                                                key={i}
                                                className={cn(
                                                    "border-grid-line border-r",
                                                    i === 0 && "border-l",
                                                )}
                                            />
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                    {/* Horizontale Linien */}
                    {(lineVariant === "all" || lineVariant === "horizontal") && (
                        <div className="absolute inset-0 grid grid-rows-[repeat(16,1fr)]">
                            {Array.from({ length: 17 }).map((_, i) => (
                                <div
                                    key={i}
                                    className={cn(
                                        "border-grid-line border-t",
                                        i === 16 && "border-b",
                                    )}
                                />
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Crosshairs */}
            {crosshairs?.topLeft && (
                // <CrosshairIcon className="text-grid-line absolute -left-2 -top-2" />
                <Plus className="text-grid-line absolute -left-[12.4px] -top-[12.4px] z-20" strokeWidth={1} />
            )}
            {crosshairs?.topRight && (
                // <CrosshairIcon className="text-grid-line absolute -right-2 -top-2" />
                <Plus className="text-grid-line absolute -right-[12.4px] -top-[12.4px] z-20" strokeWidth={1} />
            )}
            {crosshairs?.bottomLeft && (
                // <CrosshairIcon className="text-grid-line absolute -bottom-2 -left-2" />
                <Plus className="text-grid-line absolute -bottom-[12.4px] z-20 -left-[12.4px]" strokeWidth={1} />
            )}
            {crosshairs?.bottomRight && (
                // <CrosshairIcon className="text-grid-line absolute -bottom-2 -right-2" />
                <Plus className="text-grid-line absolute -bottom-[12.4px] z-20 -right-[12.4px]" strokeWidth={1} />
            )}

            <div className="relative col-span-full">{children}</div>
        </div>
    )
}
