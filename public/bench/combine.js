const dirs = ["bun", "deno", "node"];

for (const dir of dirs) {

  let seyfert_file = Bun.file(`./${dir}/seyfert-98045.txt`);
  let oceanic_file = Bun.file(`./${dir}/oceanic_js-98045.txt`);
  let eris_file = Bun.file(`./${dir}/eris-98045.txt`);
  let discord_file = Bun.file(`./${dir}/discord_js-98045.txt`);
  let detritus_file = Bun.file(`./${dir}/detritus-client-98045.txt`);

  // remove last "," from each file
  seyfert_file = (await seyfert_file.text()).replace(/,([^,]*)$/, '$1');
  oceanic_file = (await oceanic_file.text()).replace(/,([^,]*)$/, '$1')
  eris_file = (await eris_file.text()).replace(/,([^,]*)$/, '$1')
  discord_file = (await discord_file.text()).replace(/,([^,]*)$/, '$1')
  detritus_file = (await detritus_file.text()).replace(/,([^,]*)$/, '$1')

  console.log(seyfert_file)

  const parsedDetritus = chunkArray(JSON.parse(detritus_file), 360);
  const parsedDiscordjs = chunkArray(JSON.parse(discord_file), 360);
  const parsedEris = chunkArray(JSON.parse(eris_file), 360);
  const parsedOceanic = chunkArray(JSON.parse(oceanic_file), 360);
  const parsedSeyfert = chunkArray(JSON.parse(seyfert_file), 360);

  function chunkArray(arr, size) {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size)
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
      heapUsed: result.map(r => r.heapUsed),
      heapTotal: result.map(r => r.heapTotal),
      rss: result.map(r => r.rss)
    };
  }

  const {
    heapUsed: heapUsedDetritus,
    heapTotal: heapTotalDetritus,
    rss: rssDetritus,
  } = processMetrics(parsedDetritus);

  Bun.write(`./${dir}/meadiandetritus.json`, JSON.stringify({
    heapUsed: heapUsedDetritus,
    heapTotal: heapTotalDetritus,
    rss: rssDetritus,
  }, null, 2));

  const {
    heapUsed: heapUsedDiscordjs,
    heapTotal: heapTotalDiscordjs,
    rss: rssDiscordjs,
  } = processMetrics(parsedDiscordjs);

  Bun.write(`./${dir}/meadiandiscordjs.json`, JSON.stringify({
    heapUsed: heapUsedDiscordjs,
    heapTotal: heapTotalDiscordjs,
    rss: rssDiscordjs,
  }, null, 2));

  const {
    heapUsed: heapUsedEris,
    heapTotal: heapTotalEris,
    rss: rssEris,
  } = processMetrics(parsedEris);

  Bun.write(`./${dir}/meadianeris.json`, JSON.stringify({
    heapUsed: heapUsedEris,
    heapTotal: heapTotalEris,
    rss: rssEris,
  }, null, 2));

  const {
    heapUsed: heapUsedOceanic,
    heapTotal: heapTotalOceanic,
    rss: rssOceanic,
  } = processMetrics(parsedOceanic);

  Bun.write(`./${dir}/meadianoceanic.json`, JSON.stringify({
    heapUsed: heapUsedOceanic,
    heapTotal: heapTotalOceanic,
    rss: rssOceanic,
  }, null, 2));

  const {
    heapUsed: heapUsedSeyfert,
    heapTotal: heapTotalSeyfert,
    rss: rssSeyfert,
  } = processMetrics(parsedSeyfert);

  Bun.write(`./${dir}/meadianseyfert.json`, JSON.stringify({
    heapUsed: heapUsedSeyfert,
    heapTotal: heapTotalSeyfert,
    rss: rssSeyfert,
  }, null, 2));
}
