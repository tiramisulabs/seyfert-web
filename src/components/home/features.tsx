import { IconBrandTypescript, IconChartArrowsVertical, IconMoodHappyFilled, IconPalette } from "@tabler/icons-react";

export default function FeaturesSection() {
    return (
        <section className="py-8 bg-accent/40 sm:py-16 lg:py-8 rounded-md">
            <h2 className="text-3xl font-bold text-center mb-4 dark:text-white">Features</h2>
            <div className="mx-auto w-full px-8">
                <div className="grid grid-cols-1 gap-8 text-center sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                        <div className="relative flex items-center justify-center mx-auto">
                            <svg className="text-blue-100 dark:text-blue-900" width="72" height="75" viewBox="0 0 72 75" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M63.6911 28.8569C68.0911 48.8121 74.6037 61.2674 53.2349 65.9792C31.8661 70.6909 11.6224 61.2632 7.22232 41.308C2.82229 21.3528 3.6607 12.3967 25.0295 7.68503C46.3982 2.97331 59.2911 8.90171 63.6911 28.8569Z" />
                            </svg>
                            <IconBrandTypescript className="absolute text-blue-600 dark:text-blue-400 w-9 h-9" />
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-black dark:text-white">Written in TypeScript</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-300 text-justify">
                            Seyfert is fully written from scratch in TypeScript with modern
                            practices so you don't need to worry about stability.
                        </p>
                    </div>

                    <div>
                        <div className="relative flex items-center justify-center mx-auto">
                            <svg className="text-orange-100 dark:text-orange-900" width="62" height="64" viewBox="0 0 62 64" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M62 13.001C62 33.4355 53.9345 64.001 33.5 64.001C13.0655 64.001 0 50.435 0 30.0005C0 9.56596 2.56546 4.00021 23 4.00021C43.4345 4.00021 62 -7.43358 62 13.001Z" />
                            </svg>
                            <IconChartArrowsVertical className="absolute text-orange-600 dark:text-orange-400 w-9 h-9" />
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-black dark:text-white">Scalable</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-300 text-justify">
                            Seyfert is tested on both big and small bots and there were
                            perfect performance results on both of them.
                        </p>
                    </div>

                    <div>
                        <div className="relative flex items-center justify-center mx-auto">
                            <svg className="text-green-100 dark:text-green-900" width="66" height="68" viewBox="0 0 66 68" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M65.5 30C65.5 50.4345 46.4345 68 26 68C5.56546 68 0 50.4345 0 30C0 9.56546 12.5655 0 33 0C53.4345 0 65.5 9.56546 65.5 30Z" />
                            </svg>
                            <IconMoodHappyFilled className="absolute text-green-600 dark:text-green-400 w-9 h-9" />
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-black dark:text-white">Effortless Development</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-300 text-justify">
                            Developer experience is at the core of Seyfert, with a focus on
                            easy setup to only worry about your bot's logic.
                        </p>
                    </div>

                    <div>
                        <div className="relative flex items-center justify-center mx-auto">
                            <svg className="text-purple-100 dark:text-purple-900" width="66" height="68" viewBox="0 0 66 68" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                                <path d="M65.5 30C65.5 50.4345 46.4345 68 26 68C5.56546 68 0 50.4345 0 30C0 9.56546 12.5655 0 33 0C53.4345 0 65.5 9.56546 65.5 30Z" />
                            </svg>
                            <IconPalette className="absolute text-purple-600 dark:text-purple-400 w-9 h-9" />
                        </div>
                        <h3 className="mt-2 text-lg font-semibold text-black dark:text-white">Full customization</h3>
                        <p className="mt-2 text-base text-gray-600 dark:text-gray-300 text-justify">
                            Seyfert makes customization easier than ever, with Seyfert you
                            can easily customize the bot to your liking.
                        </p>
                    </div>
                </div>
            </div>
        </section>
    )
}