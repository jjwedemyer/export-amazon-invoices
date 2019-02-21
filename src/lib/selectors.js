const selectors = {
  list: {
    numOrders: '#controlsContainer .num-orders-for-orders-by-date .num-orders',
    order: '#ordersContainer div.order',
    orderDetails: {
      article: '.shipment .a-col-left .a-col-right .a-row:first-of-type .a-link-normal',
      date: '.order-info > div > div > div > div.a-fixed-right-grid-col.a-col-left > div > div.a-column.a-span4 > div.a-row.a-size-base > span',
      id: '.order-info .actions .a-size-mini .a-color-secondary+.value',
      total: '.order-info .a-fixed-right-grid-col .a-span4 .a-size-base .value',
      url: '.order-info .actions .a-row:nth-of-type(2) > .a-unordered-list > .a-link-normal:first-of-type',
    },
    page: '#yourOrders',
    popoverLinks: '.a-unordered-list .a-list-item a',
    popoverTrigger: '.order-info .actions .a-popover-trigger',
  },
  login: {
    continue: '#continue',
    form: 'form[name=signIn]',
    password: '#ap_password',
    submit: '#signInSubmit',
    user: '#ap_email',
  },
};

export default selectors;
