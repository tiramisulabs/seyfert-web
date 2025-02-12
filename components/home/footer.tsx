import { Button } from '@/components/ui/button';
import Discord from '@/components/ui/icons/discord';
import { GridLayout } from '@/components/ui/grid-layout';

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
                    <Button variant="default" size="lg" className="rounded-md shadow-none cursor-pointer">
                        Read the Docs
                    </Button>
                    <Button variant="outline" size="lg" className="rounded-md shadow-none cursor-pointer">
                        <Discord className="!h-5 !w-5" /> Join Discord
                    </Button>
                </div>
            </div>
        </GridLayout>
    )
}