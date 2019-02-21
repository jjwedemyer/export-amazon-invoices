import listOrders from './listOrders';
import {logStatus,log} from './log';

import {resultsPerPage} from './constants';

const loadNextPageIfRequired = async (page, index, numberOfOrders, year) => {
	log(`index ${index}, numberOfOrders ${numberOfOrders}, year: ${year}`)
  const resultsPage = Math.ceil(index / resultsPerPage);

  const isFirstResultOnPage = index % resultsPerPage === 1;
  if (isFirstResultOnPage) {
    logStatus(`Processing results page ${resultsPage} of ${Math.ceil(numberOfOrders / 10)}`);

    let offset = 0;

    if ( numberOfOrders > 10 ) {
       offset = resultsPage * resultsPerPage;
    }

    log(`offset ${offset}`);
    await page.goto(listOrders(year, offset), {waitUntil: 'load'});
  }
};

export default loadNextPageIfRequired;
