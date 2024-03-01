"use client";

import AnimatedText from 'react-animated-text-content';
import { AnimatePresence, motion } from "framer-motion"
import { Button, Snippet } from '@nextui-org/react';
import { BookOpenIcon, ChatBubbleLeftEllipsisIcon } from '@heroicons/react/20/solid';
import { useState } from 'react';
import { useInterval } from 'react-use';
import Link from 'next/link';

const phrases = [
  "You write amazing things; we make them happen.",
  "Reach the Zenith of development around Discord.",
  "Unlock the infinite possibilities of bot creation in Discord."
]

/**
 * TODO:
 * <div className='my-10'>
      <Marquee gradient gradientColor="#09090b" pauseOnHover>
        <div className='gap-3 flex items-center'>
          {[...Array(9)].map(() => <div className='w-32 h-20 rounded-lg bg-default-50 flex items-center justify-center'>
            <BoltIcon className='w-6 h-6 mr-2' />Bolt
          </div>)}
        </div>
      </Marquee>
    </div>
 */

export default function Page() {
  const [currentPhrase, setCurrentPhrase] = useState(phrases[0])

  useInterval(
    () => {
      setCurrentPhrase(phrases[Math.floor(Math.random() * phrases.length)])
    },
    5000
  );
  return <div className='p-12 lg:p-40'>
    <div className='flex justify-between items-start gap-14'>
      <div className='flex flex-col gap-2'>
        <motion.span className='uppercase font-bold text-sm text-default-500' initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.5,
            delay: 0
          }}>
          Meet seyfert...
        </motion.span>
        <AnimatedText
          type="words" // animate words or chars
          animation={{
            scale: 1.1,
          }}
          animationType={"lights"}
          interval={0.04}
          duration={0.8}
          tag="h1"
          className="text-5xl font-black duration-150"
          includeWhiteSpaces
          threshold={0.1}
          rootMargin="20%"
        >
          {currentPhrase}
        </AnimatedText>
        <motion.p className='text-default-500 duration-200' initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.5,
            delay: 1
          }}>
          Lorem, ipsum dolor sit amet consectetur adipisicing elit. Facere, ipsam? Sed, minima nemo deserunt id commodi quod aliquid hic consequuntur numquam? Maiores sit quod reprehenderit optio rem esse consequuntur eveniet.
        </motion.p>
        <motion.div className='flex items-center gap-2' initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.5,
            delay: 2
          }}>
          <Link href='https://seyfert-docs.vercel.app/'><Button variant="solid" startContent={<BookOpenIcon className='w-5 h-5' />}>Get started</Button></Link>
          <Link href='https://discord.com/invite/RmW54ShzMA'><Button variant="faded" startContent={<ChatBubbleLeftEllipsisIcon className='w-5 h-5' />}>Support</Button></Link>
        </motion.div>
        <motion.div className='mt-5' initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.5,
            delay: 2.5
          }}>
          <Snippet className='lg:w-fit w-full'>pnpm add seyfert</Snippet>
        </motion.div>
      </div>
      <AnimatePresence>
        <motion.div className='max-w-xl w-full h-80 lg:flex hidden' initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 100 }}
          transition={{
            duration: 0.5,
            delay: 1.5
          }}>
          <div className='bg-default-100 h-full rounded-xl'>
            <div className='w-full h-12 bg-default-50 rounded-t-xl p-3 flex items-center justify-between'>
              <div className='flex gap-2 items-center'>
                <div className='w-5 h-5 rounded-full bg-red-500' />
                <div className='w-5 h-5 rounded-full bg-amber-500' />
                <div className='w-5 h-5 rounded-full bg-green-500' />
              </div>
              <img alt="logo" src="/logo.svg" className='w-8 h-8' />
            </div>

            <div className='p-3 font-mono flex flex-col gap-0'>
              <span>~/dev/seybot $ <strong className='text-emerald-500'>bun add seyfert</strong></span>
              <span>Packages: <strong className='text-emerald-500'>+182</strong></span>
              <span><strong className='text-emerald-500'>++++++++++++++++++++++++++++++++++++++++++++++++++++</strong></span>
              <span>Progress: resolved <strong className='text-blue-500'>542</strong>, reused <strong className='text-blue-500'>454</strong>, downloaded <strong className='text-blue-500'>79</strong>, added <strong className='text-blue-500'>182</strong>, done</span>
              <span>~/dev/seybot $ <strong className='text-emerald-500'>bun dev</strong></span>
              <span><strong className='text-blue-500'>[LOGGER] INFO -</strong> Starting...</span>
              <span><strong className='text-violet-500'>[LOGGER] DEBUG -</strong> Memory usage: ~78mb</span>
              <span><strong className='text-violet-500'>[LOGGER] DEBUG -</strong> Shard count: 3</span>
              <span><strong className='text-emerald-500'>[LOGGER] SUCCESS -</strong> Bot is now online in all shards.</span>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  </div>
}