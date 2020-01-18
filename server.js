const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

var romanMap = [
    [1000, 'M'],
    [900, 'CM'],
    [500, 'D'],
    [400, 'CD'],
    [100, 'C'],
    [90, 'XC'],
    [50, 'L'],
    [40, 'XL'],
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I']
  ];


function handleConversionNumber(req, res, next) {
    NUMBER_CONVERTED = _ConvertDecimalToRoman(req.params.number);
    res.json({ roman: NUMBER_CONVERTED });
    return sendEventsToAll(NUMBER_CONVERTED);
}

function _ConvertDecimalToRoman(number) {
    if (number === 0) {
        return '';
    }

    for (var index = 0; index < romanMap.length; index++) {
        if (number >= romanMap[index][0]) {
            return romanMap[index][1] + _ConvertDecimalToRoman(number - romanMap[index][0]); //created a recursive call for the convert
        }
    }
}

// Middleware for GET /events endpoint
function eventsHandler(req, res, next) {
    // Mandatory headers and http status to keep connection open
    const headers = {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    };
    res.writeHead(200, headers);
  
    // After client opens connection send all nests as string
    const data = `data: ${JSON.stringify(NUMBER_CONVERTED)}\n\n`;
    res.write(data);
  
    // Generate an id based on timestamp and save res
    // object of client connection on clients list
    // Later we'll iterate it and send updates to each client
    const clientId = Date.now();
    const newClient = {
      id: clientId,
      res
    };
    CLIENTS.push(newClient);
  
    // When client closes connection we update the clients list
    // avoiding the disconnected one
    req.on('close', () => {
      console.log(`${clientId} Connection closed`);
      CLIENTS = CLIENTS.filter(c => c.id !== clientId);
    });
  }
  
  // Iterate clients list and use write res object method to send new nest
  function sendEventsToAll(numberConverted) {
    CLIENTS.forEach(c => c.res.write(`data: ${JSON.stringify(numberConverted)}\n\n`))
  }
  
  // Middleware for POST /nest endpoint
  async function addNest(req, res, next) {
    const newNest = req.body;
    nests.push(newNest);
  
    // Send recently added nest as POST result
    res.json(newNest)
  
    // Invoke iterate and send function
    return sendEventsToAll(newNest);
  }
  
  // Set cors and bodyParser middlewares
  app.use(cors());
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  
  // Define endpoints
  app.get('/events', eventsHandler);
  app.get('/status', (req, res) => res.json({clients: CLIENTS.length}));
  app.get('/convert/toRoman/:number', handleConversionNumber);
  
  const PORT = 3000;
  
  let CLIENTS = [];
  let NUMBER_CONVERTED = null;
  
  // Start server on 3000 port
  app.listen(PORT, () => console.log(`Swamp Events service listening on port ${PORT}`));