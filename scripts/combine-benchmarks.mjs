import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const rawRoot = path.join(root, "data", "bench", "raw");
const publicRoot = path.join(root, "public", "bench");
const dirs = ["bun", "deno", "node"];
const files = {
  seyfert: "seyfert-98045.txt",
  oceanic: "oceanic_js-98045.txt",
  eris: "eris-98045.txt",
  discord: "discord_js-98045.txt",
  detritus: "detritus-client-98045.txt",
};

async function readMetricFile(dir, file) {
  const content = await fs.readFile(path.join(rawRoot, dir, file), "utf8");
  return content.replace(/,([^,]*)$/, "$1");
}

async function writeMedianFile(dir, file, data) {
  await fs.writeFile(
    path.join(publicRoot, dir, file),
    JSON.stringify(data, null, 2),
  );
}

function chunkArray(arr, size) {
  return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
    arr.slice(i * size, i * size + size),
  );
}

function processMetrics(chunks) {
  const result = chunks.map((chunk) => {
    const sumHeap = chunk.reduce((acc, curr) => acc + curr.heapUsed, 0);
    const sumHeapTotal = chunk.reduce((acc, curr) => acc + curr.heapTotal, 0);
    const sumRss = chunk.reduce((acc, curr) => acc + curr.rss, 0);
    return {
      heapUsed: Math.round(sumHeap / chunk.length / 1024 / 1024),
      heapTotal: Math.round(sumHeapTotal / chunk.length / 1024 / 1024),
      rss: Math.round(sumRss / chunk.length / 1024 / 1024),
    };
  });

  return {
    heapUsed: result.map((r) => r.heapUsed),
    heapTotal: result.map((r) => r.heapTotal),
    rss: result.map((r) => r.rss),
  };
}

for (const dir of dirs) {
  const seyfertFile = await readMetricFile(dir, files.seyfert);
  const oceanicFile = await readMetricFile(dir, files.oceanic);
  const erisFile = await readMetricFile(dir, files.eris);
  const discordFile = await readMetricFile(dir, files.discord);
  const detritusFile = await readMetricFile(dir, files.detritus);

  const parsedDetritus = chunkArray(JSON.parse(detritusFile), 360);
  const parsedDiscordjs = chunkArray(JSON.parse(discordFile), 360);
  const parsedEris = chunkArray(JSON.parse(erisFile), 360);
  const parsedOceanic = chunkArray(JSON.parse(oceanicFile), 360);
  const parsedSeyfert = chunkArray(JSON.parse(seyfertFile), 360);

  const {
    heapUsed: heapUsedDetritus,
    heapTotal: heapTotalDetritus,
    rss: rssDetritus,
  } = processMetrics(parsedDetritus);

  await writeMedianFile(dir, "meadiandetritus.json", {
    heapUsed: heapUsedDetritus,
    heapTotal: heapTotalDetritus,
    rss: rssDetritus,
  });

  const {
    heapUsed: heapUsedDiscordjs,
    heapTotal: heapTotalDiscordjs,
    rss: rssDiscordjs,
  } = processMetrics(parsedDiscordjs);

  await writeMedianFile(dir, "meadiandiscordjs.json", {
    heapUsed: heapUsedDiscordjs,
    heapTotal: heapTotalDiscordjs,
    rss: rssDiscordjs,
  });

  const {
    heapUsed: heapUsedEris,
    heapTotal: heapTotalEris,
    rss: rssEris,
  } = processMetrics(parsedEris);

  await writeMedianFile(dir, "meadianeris.json", {
    heapUsed: heapUsedEris,
    heapTotal: heapTotalEris,
    rss: rssEris,
  });

  const {
    heapUsed: heapUsedOceanic,
    heapTotal: heapTotalOceanic,
    rss: rssOceanic,
  } = processMetrics(parsedOceanic);

  await writeMedianFile(dir, "meadianoceanic.json", {
    heapUsed: heapUsedOceanic,
    heapTotal: heapTotalOceanic,
    rss: rssOceanic,
  });

  const {
    heapUsed: heapUsedSeyfert,
    heapTotal: heapTotalSeyfert,
    rss: rssSeyfert,
  } = processMetrics(parsedSeyfert);

  await writeMedianFile(dir, "meadianseyfert.json", {
    heapUsed: heapUsedSeyfert,
    heapTotal: heapTotalSeyfert,
    rss: rssSeyfert,
  });
}
