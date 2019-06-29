const cheerio = require('cheerio');
const got = require('got');
const urlFactory = require('./urlFactory');

module.exports = async (urlPart, college, sem) => {
  const url = urlFactory(urlPart, college, sem);
  const { body } = await got(url);
  const $ = cheerio.load(body);

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  const jsonObj = {};
  jsonObj.data = [];

  // Get top level tables
  const tables = $('table')
    .filter((i, elm) => (!$(elm).parents('table').length))
    .slice(1, -1);

  // Each day
  $(tables).each((i, table) => {
    jsonObj.data.push([]);
    // Only days with class
    $(table)
      .children('tbody')
      .find('tr')
      .each((j, row) => {
        if (j === 0) return; // Skip row with useless data
        const details = [];
        $(row).find('td').each((k, cell) => {
          details.push($(cell).text());
        });
        jsonObj.data[i].push({
          day: days[i],
          startTime: details[3],
          name: details[1].split('- ')[1] || details[0],
          room: details[7].trim() || 'N/A',
          type: details[2],
          teacher: details[8].replace(/,/g, ', ').replace(/ {2}/g, ' '),
          length: details[5],
          endTime: details[4],
        });
      });
  });

  const isEmpty = a => Array.isArray(a) && a.every(isEmpty);
  jsonObj.empty = isEmpty(jsonObj.data);

  jsonObj.courseCode = urlPart;
  jsonObj.url = url;
  jsonObj.semester = sem;

  return jsonObj;
};