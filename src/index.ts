// main.js
import { CheerioCrawler, KeyValueStore, log, type RequestsLike } from "crawlee";
import { router } from "./routes.js";
import { Actor } from "apify";

interface Input {
  keyword?: string;
}

await Actor.init();

const input = (await KeyValueStore.getInput<Input>()) ?? ({} as any);
const keyword = input.keyword;
console.log({ input });
const crawler = new CheerioCrawler({
  requestHandler: router,
});

// Add our initial requests
await crawler.addRequests([
  {
    url: `https://www.amazon.com/s/ref=nb_sb_noss?url=search-alias%3Daps&field-keywords=${keyword}`,
    label: "START",
    userData: { keyword },
  },
]);

log.info("Starting the crawl.");
await crawler.run();
log.info("Crawl finished.");

await Actor.exit();
