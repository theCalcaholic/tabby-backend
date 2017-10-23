import * as express from 'express';
import * as BodyParser from 'body-parser';
import * as Crypto from 'crypto';
import * as cors from 'cors';
import RunMode from './runmode';
import DatabaseController from './database';
import { ProfileData } from '../tabby-common/models/profile';
import { TabData } from '../tabby-common/models/tab';
import { Style } from '../tabby-common/models/style';
import { styles, defaultStyle } from '../tabby-common/styles/styles';


/*if( process.argv.indexOf("--migrate") > -1 ) {
  Database.migrate();
}*/

let MODE = new RunMode();
MODE.development(true);

console.debug = console.log;

var app = express();
app.use(cors());
app.use(BodyParser.json());

async function createNewProfile():Promise<ProfileData> {
  console.debug("route GET '/profiles/new'");
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
    styleParameters: [],
    bgMusicUrl: null
  };
  await DatabaseController.addNewProfile(profile);
  return Promise.resolve(profile);
  //profiles.push(profile)
};

app.put('/profiles/:id/style', async function(req, res) {
  let profileId = req.params['id'];
  console.debug(`route PUT /profiles/:id(${profileId})/style`);
  let styleId = req.body.styleId;
  let styleParams = req.body.styleParameters;
  try{
    await DatabaseController.updateStyle(profileId, styleId, JSON.stringify(styleParams));
    res.send('');
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(503).send();
  }
});

app.put('/profiles/:id/background-music', async function(req, res) {
  let profileId = req.params['id'];
  console.debug(`route PUT /profiles/:id(${profileId})/background-music`)
  let  url = req.body.bgMusicUrl;
  try {
    await DatabaseController.updateBgMusicUrl(profileId, url);
    res.send('');
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(503).send()
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
    res.sendStatus(404).send();
  }
});

app.put('/tabs/:id', async function(req:any, res:any) {
  let id = req.params['id'];
  console.debug(`route PUT 'tabs/:id(${id})'`);
  let tab = req.body.tab as TabData;
  let profileId = req.body.profileId as string;
  try {
    console.log("tab", tab, typeof tab);
    if(!tab) {
      await DatabaseController.deleteTab(id, profileId);
    } else {
      await DatabaseController.updateTab(tab, profileId);
    }
    res.send('')
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(404).send();
  }
});

app.put('/profiles/:id/', async function(req:any, res:any) {
  let id = req.params['id'];
  console.debug(`route PUT '/profiles/:id(${id})'`);
  let profileData = req.body as ProfileData
  try {
    let profile = await DatabaseController.updateProfile(profileData);
    res.json(profile);
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(404).send();
  }
});

app.get('/profiles/:id/', async function(req:any, res:any) {
  let id = req.params['id'];
  if(id === "new") {
    try {
      let newProfile = await createNewProfile();
      res.json({"data": newProfile});
    } catch( error ) {
      console.error(error.stack);
      res.sendStatus(503).send();
    }
  } else {
    console.debug(`route GET '/profiles/:id(${id})'`);
    try {
      let profile = await DatabaseController.getProfile(id);
      console.log("return profile: ", profile);
      res.json({"data": profile});
    } catch( error ) {
      console.error(error.stack);
      res.sendStatus(404).send();
    }
  }
});

app.get('/profiles/:id/style', async function(req:any, res:any) {
  let id = req.params['id'];
  console.debug(`route GET '/profiles/:id(${id})/style'`);
  let profile: ProfileData;
  try {
    profile = await DatabaseController.getProfile(id);
  } catch( error ) {
    console.error(error.stack);
    res.sendStatus(404).send();
    return;
  }
    let style: Style | undefined;
    let styleNotFound = styles.every((s) => {
      let tmpStyle = new s();
      if(tmpStyle.id == profile.styleId) {
        style = tmpStyle
        return false;
      }
      return true;
    });

    if(styleNotFound || typeof style === 'undefined') {
      console.log("ERROR: no style found!");
      res.sendStatus(404).send();
    } else {
      style.loadParameters(profile.styleParameters);
      res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
      res.header('Expires', '-1');
      res.header('Pragma', 'no-cache');
      res.writeHead(200, {"Content-Type": "text/css"});
      res.write(style.exportString());
      console.log("return profile style: ", style.exportString());
      res.send();
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
