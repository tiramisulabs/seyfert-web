import { Button } from '@/components/ui/button';
import Discord from '@/components/ui/icons/discord';
import { GridLayout } from '@/components/ui/grid-layout';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';

export function Footer() {
    return (
        <GridLayout
            crosshairs={{
                topLeft: true,
                bottomRight: true,
            }}
            lineVariant="none"
            className="min-h-[250px] p-8"
        >
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-medium tracking-tight">
                        Ready to build your next Discord bot? {" "}
                    </h2>
                    <p className="text-muted-foreground mt-4 text-xl">
                        Start by installing{" "}
                        <span className="text-blue-500">Seyfert</span>{" "}
                        and get started in minutes.
                    </p>
                </div>
                <div className="flex gap-4">
                    <Link href="/docs" target="_blank" rel="noopener noreferrer">
                        <Button variant="default" size="lg" className="rounded-md shadow-none cursor-pointer">
                            Read the Docs
                            <ArrowUpRight className="!w-5 !h-5 ml-2" />
                        </Button>
                    </Link>
                    <Link href="https://discord.gg/hEeJNaSqnS" target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="lg" className="rounded-md shadow-none cursor-pointer">
                            Join Discord
                            <Discord className="!h-5 !w-5" />
                        </Button>
                    </Link>
                </div>
            </div>
        </GridLayout>
    )
}