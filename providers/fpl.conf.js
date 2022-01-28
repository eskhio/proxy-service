
const fpl = module.exports = {
  list: (raw) => raw.find("tr"),
  host: (raw) => raw.find('td:first-child').text(),
  port: (raw) => raw.find('td:nth-child(2)').text(),
  https: (raw) => raw.find('td:nth-child(7)').text() === 'yes',
  anonymous: (raw) => raw.find('td:nth-child(5)').text() === 'anonymous',
  alive: (raw) => raw.find('td:nth-child(8)').text(),
  parse: (raw) => ({ host: fpl.host(raw), port: fpl.port(raw) })
}