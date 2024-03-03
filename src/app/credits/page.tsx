"use client";

import AnimatedText from 'react-animated-text-content';
import { motion } from "framer-motion"
import { Button } from '@nextui-org/react';
import { ArrowLeftIcon, ArrowRightIcon, BanknotesIcon, BeakerIcon, FaceSmileIcon, FingerPrintIcon, HeartIcon, LightBulbIcon, PaintBrushIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import SpotlightCard from '@/components/common/spotlight-card';

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
    return <div className=''>
        <div className='flex justify-between items-start gap-14'>
            <div className='flex flex-col gap-2'>
                <AnimatedText
                    type="chars"
                    animation={{
                        scale: 1.1,
                    }}
                    animationType={"lights"}
                    interval={0.04}
                    duration={0.8}
                    tag="h1"
                    className="lg:text-5xl text-4xl font-black duration-150"
                    includeWhiteSpaces
                    threshold={0.1}
                    rootMargin="20%"
                >
                    Credits
                </AnimatedText>
                <motion.p className='text-default-500 duration-200 flex items-center gap-1 lg:text-base text-sm' initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 100 }}
                    transition={{
                        duration: 0.5,
                        delay: 0.5
                    }}>
                    Thanks to these amazing people, Seyfert is possible <HeartIcon className='w-5 h-5 text-rose-500' />
                </motion.p>
            </div>
        </div>
        <motion.div className='my-5 flex flex-col gap-4' initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 100 }}
            transition={{
                duration: 0.5,
                delay: 1
            }}>
            <div className='flex flex-col gap-2'>
                <h3 className='font-bold text-2xl'>Main development</h3>
                <div className='flex flex-col gap-1'>
                    <span>FreeAoi</span>
                    <span>Marcrock</span>
                    <span>Socram09</span>
                </div>
            </div>
            <div className='flex flex-col gap-2'>
                <h3 className='font-bold text-2xl'>Web development</h3>
                <div className='flex flex-col gap-1'>
                    <span>Simxnet <span className='text-default-500'>— Moi</span></span>
                    <span>Sawako <span className='text-default-500'>— Legacy website</span></span>
                </div>
            </div>
            <div className='flex flex-col gap-2'>
                <h3 className='font-bold text-2xl'>Extras</h3>
                <div className='flex flex-col gap-1'>
                    <span>Yuzuru <span className='text-default-500'>— Main idea</span></span>
                    <span>Miia <span className='text-default-500'>— Extra codes</span></span>
                    <span>David <span className='text-default-500 italic'>— Cat officer</span></span>
                </div>
            </div>
        </motion.div>
    </div>
}