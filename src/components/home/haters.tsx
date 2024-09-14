import Image from "next/image";

const haters: {
    displayName: string;
    username: string;
    avatar: string;
    content: React.ReactNode;
}[] = [
        {
            displayName: "Socram09",
            username: "socram09",
            avatar: "d038d272c589230c38f84243789692c3",
            content: <>I have no idea how this thing turns on.</>,
        },
        {
            displayName: "MARCROCK22",
            username: "marcrock22",
            avatar: "6aff65edc136278714c4d4998dca4680",
            content: <>I don't even know why I made this shit</>
        },
        {
            displayName: "FreeAoi",
            username: "freeaoi",
            avatar: "324f47e4cdb102f41303d7edb0213175",
            content: <>GOMEN AMANAI</>
        },
        {
            displayName: "Deivid",
            username: "deivid",
            avatar: "a_842b80d2226ed205deeec10cd2a99ca9",
            content: <>Breakfast every day. Today I am fasting.</>
        },
        {
            displayName: "JustEvil",
            username: "justevil",
            avatar: "0f7fcc364251c08e705dfffed8182091",
            content: <>Is so good that I can't even use it.</>
        },
        {
            displayName: "Sawako",
            username: "sawa_ko",
            avatar: "3cfd56ea7764ac48aa1b33874edc8d64",
            content: <>I hate seyfert so much that I sponsor them &gt;:(</>
        },
        {
            displayName: "Miia",
            username: "miia",
            avatar: "ae86fffd53d44c4c2f9cf532e18d4e61",
            content: <>Seyfert works until you switch it on.</>
        },
        {
            displayName: "Shisui San",
            username: "shisuisan",
            avatar: "a_b490bbd37a4037949d0868c222fa7033",
            content: "Seyfert better keep working else I will be fired"
        }
    ];

export default function HatersSection() {
    return (
        <section className="py-8 sm:py-16 lg:py-4">
            <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Everyone loves Seyfert!</h1>
            <div className="px-4 mx-auto w-full">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {haters.map((hater, index) => (
                        <div key={index} className="flex flex-col bg-accent/40 border border-accent/40 rounded-sm">
                            <div className="flex flex-col justify-between flex-1 p-6">
                                <div className="flex items-center mb-4">
                                    <Image
                                        width={50}
                                        height={50}
                                        alt={hater.displayName}
                                        src={`/haters/${hater.avatar}.png`}
                                        className="rounded-full"
                                    />

                                    <div className="min-w-0 ml-3">
                                        <p className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate">{hater.displayName}</p>
                                        <p className="text-base text-gray-500 dark:text-gray-400 truncate">@{hater.username}</p>
                                    </div>
                                </div>



                                <div className="flex-1">
                                    <blockquote>
                                        <p className="text-base text-gray-800 dark:text-gray-200">{hater.content}</p>
                                    </blockquote>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    )
}