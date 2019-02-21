const listOrders = (year, offset = 0) => {
  const baseUrl = 'https://www.amazon.de/gp/your-account/order-history';

  const options = [];

  //force amazon to load german localization.
  options.push('language=de_DE');

  if (year) {
    options.push(`orderFilter=year-${year}`);
  }
  if (offset) {
    options.push(`startIndex=${offset}`);
  }
  const queryString = options.join('&');

  const url = [baseUrl, queryString].filter(Boolean).join('?');

  console.log(url)

  return url;
};

export default listOrders;
