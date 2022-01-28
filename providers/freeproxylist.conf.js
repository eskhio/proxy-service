const cheerio = require('cheerio');

const fpl = module.exports = {
  $: (raw) => cheerio.load(raw),
  list: () => Array.from(fpl.$('.fpl-list table tr')),
  host: (raw) => fpl.$(raw).find('td:first-child').text(),
  port: (raw) => fpl.$(raw).find('td:nth-child(2)').text(),
  alive: (raw) => fpl.$(raw).find('td:nth-child(8)').text(),
  parse: (raw) => ({ host: fpl.host(raw), port: fpl.port(raw) })
}