"use client"

import AnimatedText from "react-animated-text-content"
import { Line } from "react-chartjs-2"
import seyfertData from "../../../public/data/seyfert-98045.json"
import discordjsData from "../../../public/data/discord_js-98045.json"
import oceanicData from "../../../public/data/oceanic_js-98045.json"
import erisData from "../../../public/data/eris-98045.json"
import detritusData from "../../../public/data/detritus-client-98045.json"

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { motion } from "framer-motion"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const data = {
  labels: seyfertData.map((_, i) => `${i} minutes`),
  datasets: [
    {
      label: "Seyfert",
      data: seyfertData.map((_) => _.rss / 1024 / 1024),
      fill: false,
      borderColor: "rgb(75, 192, 192)",
      tension: 0.1,
    },
    {
      label: "Discord.js",
      data: discordjsData.map((_) => _.rss / 1024 / 1024),
      fill: false,
      borderColor: "rgb(54, 162, 235)",
      tension: 0.1,
    },
    {
      label: "Oceanic.js",
      data: oceanicData.map((_) => _.rss / 1024 / 1024),
      fill: false,
      borderColor: "rgb(255, 99, 132)",
      tension: 0.1,
    },
    {
      label: "Eris",
      data: erisData.map((_) => _.rss / 1024 / 1024),
      fill: false,
      borderColor: "rgb(153, 102, 255)",
      tension: 0.1,
    },
    {
      label: "Detritus",
      data: detritusData.map((_) => _.rss / 1024 / 1024),
      fill: false,
      borderColor: "rgb(255, 159, 64)",
      tension: 0.1,
    }
  ],
}

export default function Benchmark() {
  return (
    <>
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
            Benchmarks
          </AnimatedText>
          <motion.p className='text-default-500 duration-200 lg:text-base text-sm' initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 100 }}
            transition={{
              duration: 0.5,
              delay: 0.5
            }}>
            As you can see below, Seyfert is the most efficient in terms of memory usage at long runtime. All libraries has been ran in a discord bot with a 3,000 discord servers and all non-privileged intents activated , you can see the code used to benchmark the libraries <a href="https://github.com/tiramisulabs/benchmark" className="font-bold text-indigo-600">here</a>.
          </motion.p>
        </div>

      </div>
      <div className="max-h-[26em]">
        <Line className="h-[26em]" data={data} options={{
          maintainAspectRatio: false,
          scales: {
            y: {
              ticks: {
                callback: function (value) {
                  return `${value}MB`
                }
              }
            }
          }
        }} />
      </div>
    </>
  )
}
