import { createCheerioRouter, Dataset } from "crawlee";
import { BASE_URL, labels } from "./constants.js";

const r = createCheerioRouter();

r.addHandler(labels.START, async ({ $, crawler, request, log }) => {
  const { keyword } = request.userData;
  const products = $('div > div[data-asin]:not([data-asin=""])');

  log.info(`Start URL: ${request.url}`);
  log.info(`Keyword: "${keyword}"`);
  log.info(`Products found: ${products.length}`);

  for (const product of products) {
    const element = $(product);
    const titleElement = $(element.find(".a-text-normal[href]"));

    const url = titleElement.attr("href")
      ? titleElement.attr("href")!.includes("https://")
        ? titleElement.attr("href")
        : `${BASE_URL}${titleElement.attr("href")}`
      : undefined;

    if (url) {
      log.info(url.length > 80 ? `URL: ${url.slice(0, 80)}...` : `URL: ${url}`);
      await crawler.addRequests([
        {
          url,
          label: labels.PRODUCT,
          userData: {
            data: {
              title: titleElement.first().text().trim(),
              asin: element.attr("data-asin"),
              itemUrl: url,
              keyword,
            },
          },
        },
      ]);
    }
  }
});

r.addHandler(labels.PRODUCT, async ({ $, crawler, request }) => {
  const { data } = request.userData;

  const element = $("div#productDescription");

  await crawler.addRequests([
    {
      url: `${BASE_URL}/gp/aod/ajax/ref=auto_load_aod?asin=${data.asin}&pc=dp`,
      label: labels.OFFERS,
      userData: {
        data: {
          ...data,
          description: element.text().trim(),
        },
      },
    },
  ]);
});

r.addHandler(labels.OFFERS, async ({ $, request }) => {
  const { data } = request.userData;

  for (const offer of $("#aod-offer")) {
    const element = $(offer);

    await Dataset.pushData({
      ...data,
      sellerName: element.find('div[id*="soldBy"] a[aria-label]').text().trim(),
      offer: element.find(".a-price .a-offscreen").text().trim(),
    });
  }
});

export const router = r;
