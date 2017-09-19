import * as express from 'express';
import * as BodyParser from 'body-parser';
import * as Crypto from 'crypto';
import * as cors from 'cors';
import RunMode from './runmode';
import Database from './database';
import { ProfileData } from 'tabby-common/profile';
import { TabData } from 'tabby-common/tab';

//Database.setup();

let MODE = new RunMode();
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
  console.log("route GET '/profiles/new'");
  let length = 16
  let newId;
  do {
    newId = Crypto.randomBytes(Math.ceil(length * 3 / 4))
      .toString('base64')
      .slice(0, length)
      .replace(/\+/g, '0')
      .replace(/\//g, '0');
  } while( false )
  let profile:ProfileData = {
    id: newId,
    tabs: [],
    title: ''
  };
  Database.addNewProfile(profile).then(() => {
      res.json({data: profile});
  }, (err) => {
      console.error("rejection! REASON:")
      console.error(err);
  });
  //profiles.push(profile)
});

app.get('/profiles/:id', function(req, res) {
  let id = req.params['id'];
  console.log(`route GET '/profiles/:id(${id})'`);
  Database.getProfile(id).then((profile) => {
    res.json({"data": profile});
  }, (err) => {
    console.error("rejection! REASON:")
    console.error(err);
  });
});

app.put('/tab/new', function(req, res) {
  console.log(`route PUT '/profiles/new'`);
  let profileId = req.body.profileId as string;
  Database.addNewTab(profileId).then(
    (tab: TabData) => {
      res.json({"data": tab})
    },
    (err:any) => {
    console.error("rejection! REASON:")
    console.error(err);
  });
});

app.put('/profiles/:id', function(req, res) {
  let id = req.params['id'];
  console.log(`route PUT '/profiles/:id(${id})'`);
  let profileData = req.body as ProfileData
  Database.updateProfile(profileData).then(res.json, (err) => {
    console.error("rejection! REASON:")
    console.error(err);
  });
});

app.listen(3000, () => {
  console.log('Tabby backend started.');
  console.log('Listening on port 3000');
})
