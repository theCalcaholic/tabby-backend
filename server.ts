import * as express from 'express';
import * as BodyParser from 'body-parser';
import * as Crypto from 'crypto';
var cors = require('cors');

let MODE = require('./runmode').new();
MODE.development(true);

var app = express();
app.use(cors());
app.use(BodyParser.json());

const profiles = [
  {
    id: "9as9u2ob3bonal",
    tabs: [
      {
        title: "Tab 1",
        content: "<p>Content of Tab 1</p><p>More content...</p>"
      }
    ]
  }
]

app.get('/profiles', function(req, res, next) {
  if(MODE.production()) {
    res.status(503).send();
  }
  else {
    res.json({"data": profiles});
  }
});

app.get('/profiles/new', function(req, res) {
  let length = 16
  let newId;
  do {
    newId = Crypto.randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '0')
      .replace(/\//g, '0');
  } while( getProfile(newId) )
  let profile = {
    id: newId,
    tabs: []
  };
  profiles.push(profile)
  res.json({data: profile});
});

app.all('/profiles/:id', function(req, res, next) {
  let id = req.params['id'];
  if( id == 'new' || getProfile(id) ) {
    next();
  }
  else {
    console.log(id + " not found in profiles.");
    res.sendStatus(404);
    res.send();
  }
});

app.get('/profiles/:id', function(req, res) {
  let id = req.params['id'];
  res.json({"data": getProfile(id)});
});

app.put('/profiles/:id', function(req, res) {
  let id = req.params['id'];
  deleteProfile(id);
  profiles.push(req.body);
});

function getProfile(id: string) {
  let profile;
  profiles.forEach((currentProfile) => {
    if(currentProfile.id == id) {
      profile = currentProfile;
    }
  });
  return profile;
}

function deleteProfile(id:string) {
  for(let i = 0; i < profiles.length; i++)
  {
    if(profiles[i].id == id) {
      profiles.splice(i, 1);
    }
  }
}

app.listen(3000, () => {
  console.log('Tabby backend started.');
  console.log('Listening on port 3000');
})
