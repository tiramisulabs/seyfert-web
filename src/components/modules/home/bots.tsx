'use client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Heading } from '@/components/ui/heading';
import { Text } from '@/components/ui/text';
import { css } from '@/styled-system/css';
import { Grid, GridItem, HStack, Stack, VStack } from '@/styled-system/jsx';
import Image from 'next/image';
import Link from 'next/link';

const bots: {
  displayName: string;
  username: string;
  id: string;
  avatar: string;
  guilds: number;
  content: React.ReactNode;
}[] = [
  {
    displayName: 'CactusFire',
    username: 'CactusFire#3759',
    id: '543567770579894272',
    avatar: 'cactusfire',
    guilds: 290000,
    content: (
      <>
        I think choosing Seyfert is a very good option, we have been working
        with Discord.js & Discordeno for years, and yes... It's good, but for
        large scale bots... nothing better than Seyfert. Besides it's a team
        that is very attentive, and gives us a hand whenever they can.
      </>
    ),
  },
  {
    displayName: 'Listen',
    username: 'Listen#7518',
    id: '777401960793636934',
    avatar: 'listen',
    guilds: 7300,
    content: (
      <>
        After years of experience with Discord.js, Discordeno and Eris, Seyfert
        proved to be unmatched for large-scale music bots - dropping our RAM
        usage to under 1 GB (from almost 4 GB) while handling
        200% more servers. This allowed us to finally focus on our features
        without any constraints over all these years.
      </>
    ),
  },
];

export default function HomeBots() {
  return (
    <VStack alignItems={'start'} w="full">
      <Heading size="3xl" mb={{ base: 4, md: 6 }}>
        Bots using Seyfert
      </Heading>
      <Grid
        w="full"
        gridTemplateColumns={{
          base: '1fr',
          sm: 'repeat(2, 1fr)',
        }}
        gap={{ base: 4, md: 6 }}
      >
        {bots.map((bot, key) => (
          <GridItem key={key}>
            <Card w="full">
              <VStack alignItems={'start'} h="full" gap={3}>
                <Stack
                  direction={{
                    base: 'column',
                    md: 'row',
                  }}
                  justifyContent={'space-between'}
                  alignItems={'center'}
                  w={{ md: 'full' }}
                >
                  <HStack gap={3}>
                    <Image
                      width={50}
                      height={50}
                      alt={bot.displayName}
                      src={`/bots/${bot.avatar}.png`}
                      className={css({
                        rounded: 'full',
                      })}
                    />
                    <VStack gap={0} alignItems={'start'}>
                      <Heading size="2xl">{bot.displayName}</Heading>
                      <Text fontSize="sm" color="gray.500">
                        @{bot.username}
                      </Text>
                    </VStack>
                  </HStack>

                  <Text fontSize="2xl" fontWeight={'bold'}>
                    {bot.guilds.toLocaleString('en-US')} servers
                  </Text>
                </Stack>

                <Text h="full">{bot.content}</Text>

                <Link
                  target="_blank"
                  referrerPolicy="no-referrer"
                  href={`https://discord.com/oauth2/authorize?client_id=${bot.id}&permissions=0&scope=bot%20applications.commands`}
                >
                  <Button>Add bot</Button>
                </Link>
              </VStack>
            </Card>
          </GridItem>
        ))}
      </Grid>
    </VStack>
  );
}
