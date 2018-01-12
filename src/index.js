import commandLineArgs from 'command-line-args';
import fs from 'fs-extra';
import getOrderNumber from './lib/getOrderNumber';
import listOrders from './lib/listOrders';
import loadNextPageIfRequired from './lib/loadNextPageIfRequired';
import logInIfRequired from './lib/logInIfRequired';
import logResults from './lib/logResults';
import puppeteer from 'puppeteer';
import showUsageHints from './lib/showUsageHints';
import {log, logDetail, logError, logStatus} from './lib/log';

import argDefinitions from './lib/argDefinitions';
import selectors from './lib/selectors';

const args = commandLineArgs(argDefinitions);

const credentialsAreMissing = ['user', 'password'].some(k => !args[k]);
if (credentialsAreMissing) {
  showUsageHints();
}

// pager settings of Amazon
export const resultsPerPage = 10;

const failedExports = [];

(async () => {
  // rimraf output dirs
  args.year.forEach(year => fs.remove(`./output/${year}`));

  // initialize browser
  const browser = await puppeteer.launch({
    headless: false, // FIXME: puppeteer should really run in headless mode, but when it's doing, it can't even log in
  });
  const page = await browser.newPage();

  await page.setViewport({
    width: 1440,
    height: 900,
  });

  await page.goto(listOrders(), {waitUntil: 'load'});

  await logInIfRequired(page, args);

  for (let ii = 0; ii < args.year.length; ii++) {
    let savedInvoices = 0;
    const year = args.year[ii];
    log();
    logStatus(`Exporting orders of ${year}`);

    const outputFolder = `./output/${year}`;
    fs.mkdirs(outputFolder);

    await page.goto(listOrders(year, 0), {waitUntil: 'load'});

    const numberOfOrders = Math.min(
      args.limit,
      await page.$eval(selectors.list.numOrders, el => parseInt(el.innerText.split(' ')[0], 10))
    );
    logDetail(`Starting export of ${numberOfOrders} orders`);

    for (let i = 1, l = numberOfOrders; i <= l; i++) {
      await loadNextPageIfRequired(page, i, numberOfOrders, year);

      const orderNumber = getOrderNumber(i.toString(), year, numberOfOrders);
      logDetail(`Exporting invoice(s) for order ${orderNumber}`);

      // there is a hidden alert component at the top of the orders list,
      // so a selector using nth-child within the ordersContainer has to start at 2,
      // meaning we have to increase all orderIndex values by 1
      const orderIndex = i % resultsPerPage === 0 ? resultsPerPage + 1 : i % resultsPerPage + 1;

      // the popover ids start at 3 and Amazon increments them in the order the elements are clicked,
      // so the first opened popover has #a-popover-3, the next #a-popover-4, #a-popover-5 etc.
      const popoverSelector = `#a-popover-content-${orderIndex + 1} ${selectors.list.popoverLinks}`;

      try {
        const popoverTrigger = await page.$(
          `${selectors.list.order}:nth-of-type(${orderIndex}) ${selectors.list.popoverTrigger}`
        );
        await popoverTrigger.click();
        await page.waitFor(popoverSelector); // the popover content can take up to 1-3 seconds to load
        await page.evaluate(sel => {
          document.querySelectorAll(sel).forEach(async link => {
            // invoice links follow either pattern 'Rechnung 1' or pattern 'Rechnung oder Gutschrift 1'
            const invoiceLinkRegex = /^Rechnung( oder Gutschrift)?\s[0-9]{1,2}/;
            const isInvoiceLink = invoiceLinkRegex.test(link.innerText);
            if (isInvoiceLink) {
              // download invoice to output folder

              // // make Chrome download links using the experimental setDownloadBehavior API,
              // // see https://chromedevtools.github.io/devtools-protocol/tot/Page/#method-setDocumentContent
              // await page._client.send('Page.setDownloadBehavior', {
              //   behavior: 'allow',
              //   downloadPath: './output', // FIXME: pass outputFolder in here
              // });
              // await link.click();

              // FIXME: setDownloadBehavior doesn't do fuck all, maybe try
              // https://github.com/GoogleChrome/puppeteer/issues/610#issuecomment-340160025

              // increment count of savedInvoices
              // FIXME: we are in browser context here, I doubt savedInvoices++ will work...
              savedInvoices++;
            }
          });
        }, popoverSelector);
      } catch (e) {
        const resultsPage = Math.ceil(i / resultsPerPage);
        logError(`Failed to process order ${orderNumber}, orderIndex ${orderIndex}, page ${resultsPage}`);
        logError(e);

        const path = `${outputFolder}/FAILED__${orderNumber}.png`;
        await page.screenshot({
          fullPage: true,
          path,
        });
        failedExports.push(`Order ${orderNumber}, see screenshot ${path}`);
      }
    }

    logStatus(`${savedInvoices} invoices saved as PDF in folder /output/${year}`);
  }

  await browser.close();
  logResults(failedExports, args);
})();
