"use client";

import clsx from "clsx";
import { motion } from "framer-motion";

export function MultiDirectionSlide() {
    const MULTIDIRECTION_SLIDE_VARIANTS = {
        hidden: { opacity: 0, x: "-25vw" },
        visible: { opacity: 1, x: 0 },
        right: { opacity: 0, x: "25vw" },
    };
    return (
        <div className="overflow-hidden">
            <motion.h1
                initial="hidden"
                animate="visible"
                variants={MULTIDIRECTION_SLIDE_VARIANTS}
                transition={{ duration: 0.5 }}
                className={clsx(
                    "font-extrabold drop-shadow-sm leading-10 lg:leading-[4.5rem]",
                    "text-5xl"
                )}
            >
                The Discord framework
            </motion.h1>

            <motion.h1
                initial="right"
                animate="visible"
                variants={MULTIDIRECTION_SLIDE_VARIANTS}
                transition={{ duration: 0.5 }}
                className={clsx(
                    "font-extrabold drop-shadow-sm",
                    "text-5xl"
                )}
            >
                that <span className="font-mono px-2 py-1 underline">satisfies</span> you
            </motion.h1>
        </div>
    );
}