import * as express from 'express';
import * as BodyParser from 'body-parser';
import * as Crypto from 'crypto';
import * as cors from 'cors';
import RunMode from './runmode';
import DatabaseController from './database';
import { ProfileData } from 'tabby-common/models/profile';
import { TabData } from 'tabby-common/models/tab';
import { styles, defaultStyle } from 'tabby-common/styles/styles';


/*if( process.argv.indexOf("--migrate") > -1 ) {
  Database.migrate();
}*/

let MODE = new RunMode();
MODE.development(true);


var app = express();
app.use(cors());
app.use(BodyParser.json());

async function createNewProfile():Promise<ProfileData> {
  console.log("route GET '/profiles/new'");
  let length = 16
  // TODO: Prevent id collision
  let newId = Crypto.randomBytes(Math.ceil(length * 3 / 4))
    .toString('base64')
    .slice(0, length)
    .replace(/\+/g, '0')
    .replace(/\//g, '0');
  let profile:ProfileData = {
    id: newId,
    tabs: [],
    title: '',
    styleId: 'testStyle',
    styleParameters: []
  };
  await DatabaseController.addNewProfile(profile);
  return Promise.resolve(profile);
  //profiles.push(profile)
};

app.get('/profiles/:id', async function(req:any, res:any) {
  let id = req.params['id'];
  if(id === "new") {
    try {
      let newProfile = await createNewProfile();
      res.json({"data": newProfile});
    } catch( error ) {
      console.error(error.stack);
      res.sendStatus(503).send();
    }
    return;
  }
  console.log(`route GET '/profiles/:id(${id})'`);
  try {
    let profile = await DatabaseController.getProfile(id);
    res.json({"data": profile});
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(404).send();
  }
});

app.put('/tabs/new', async function(req:any, res:any) {
  console.debug(`route PUT '/tabs/new'`);
  let newTab = req.body.tab as TabData;
  let profileId = req.body.profileId as string;
  try {
    let tab = await DatabaseController.addNewTab(newTab, profileId);
    console.debug("created new tab:");
    console.debug(tab);
    res.json({"data": tab})
  } catch(error) {
    console.error(error.stack);
  }
});

app.put('/tabs/:id', async function(req:any, res:any) {
  let id = req.params['id'];
  console.debug(`route PUT 'tabs/:id(${id})'`);
  let tab = req.body.tab as TabData;
  let profileId = req.body.profileId as string;
  try {
    await DatabaseController.updateTab(tab, profileId);
    res.send('')
  } catch( error ) {
    console.error(error.stack);
  }
});

app.put('/profiles/:id', async function(req:any, res:any) {
  let id = req.params['id'];
  console.log(`route PUT '/profiles/:id(${id})'`);
  let profileData = req.body as ProfileData
  try {
    let profile = await DatabaseController.updateProfile(profileData);
    res.json(profile);
  } catch( error ) {
    console.error(error.stack);
  }
});



DatabaseController.migrate()
.then(() => {
  app.listen(3000, () => {
  console.log('Tabby backend started.');
  console.log('Listening on port 3000');
  })
})
.catch(err => {
  console.error(err.stack);
});
