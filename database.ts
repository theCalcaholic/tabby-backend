//import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import {open as dbOpen } from 'sqlite';
import { ProfileData } from '../tabby-common/models/profile';
import { TabData } from '../tabby-common/models/tab';
import { Version } from './version';
import { DBBlockedError } from './dbblockederror';
//import * as module from './package.json';
//import * as Promise from 'bluebird';

const DBPATH = './db/main.sql';



function createPath(path:string) {
  let pathArray = path.split("/");
  let pathCreated = "";
  pathArray.forEach((folder:string) => {
    pathCreated += "/"+folder;
    if(!fs.existsSync(folder)) {
      fs.mkdirSync(pathCreated);
    }
  })
}

let DatabaseController = {
  async migrate() {
    console.log("Migrating database...");
    if(!fs.existsSync(DBPATH)) {
      createPath(DBPATH.substr(0, DBPATH.lastIndexOf("/")));
    }

    const db = await dbOpen(DBPATH);
    await db.migrate({ migrationsPath: "./db/migrations" });
  },

  async getProfile(id:string) {
    console.log(`DB.getProfile(${id})`);
    const db = await dbOpen(DBPATH);

    let row = await db.get("SELECT * FROM Profile WHERE Profile.Id=?", [id]);
    if(typeof row === 'undefined') {
      throw new Error(`Profile not found (id: ${id})`);
    }
    let tabRows = await db.all("SELECT * FROM Tab WHERE ParentProfile=?", [id]);
    let tabs = tabRows.map( (tabRow:any) => {
      return {
        title: tabRow.Title || '',
        content: tabRow.Content || '',
        id: tabRow.Id
      } as TabData
    });

    console.log("found profile:");
    console.log(row);
    return {
      title: row.Title || "",
      id: row.Id,
      tabs: tabs,
      styleId: row.StyleId,
      styleParameters: JSON.parse(row.StyleParameters) || [],
      bgMusicUrl: row.BgMusicUrl
     } as ProfileData;
  },

  async updateProfile(profile:ProfileData) {
    console.debug("DB.updateProfile(ProfileData)");
    const db = await dbOpen(DBPATH);

    await db.run(`
      UPDATE Profile
        SET
          Title=$title
        WHERE Id=$id
      `, {
        $title: profile.title,
        $id: profile.id
    });
  },

  async addNewProfile(profile:ProfileData) {
    console.debug("addNewProfile()");
    console.debug(profile);
    let db = await dbOpen(DBPATH);
    await db.run(`
        INSERT INTO Profile
          (Id, Title, StyleId, StyleParameters, BgMusicUrl)
          VALUES ($id, $title, $styleId, $styleParams, $bgMusicUrl)
      `,
      {
        $id: profile.id,
        $title: profile.title,
        $styleId: profile.styleId,
        $styleParams: JSON.stringify(profile.styleParameters),
        $bgMusicUrl: profile.bgMusicUrl
      }
    );
  },

  async addNewTab(newTab:TabData, profileId:string):Promise<TabData> {
    console.debug(`addNewTab(<TabData>, ${profileId})`);
    let db = await dbOpen(DBPATH);
    let result = await db.run(`
      INSERT INTO Tab
        (Title, Content, ParentProfile)
        VALUES ($title, $content, $profile)
      `,
      {
        $title: newTab.title,
        $content: newTab.content,
        $profile: profileId
      }
    );

    return {
      id: result.lastID,
      title: newTab.title,
      content: newTab.content
    } as TabData;
  },

  async updateTab(tab:TabData, profileId:string) {
    console.debug(`DB.updateTab(<TabData>, ${profileId})`);
    let db = await dbOpen(DBPATH);
    await db.run(`
      UPDATE Tab
        SET
          Title=$title,
          Content=$content
        WHERE Id=$id
        AND ParentProfile=$profile
      `, {
      $title: tab.title,
      $content: tab.content,
      $id: tab.id,
      $profile: profileId
    });
  },

  async updateStyle(profileId:string, styleId:string, styleParameters:string) {
    console.debug(`DB.updateStyle(string, string, string)`);
    console.debug("style:");
    console.debug(styleParameters);
    let db = await dbOpen(DBPATH);
    await db.run(`
      UPDATE Profile
        SET
          StyleId=$styleId,
          StyleParameters=$styleParameters
        WHERE Id=$profileId
      `, {
      $styleId: styleId,
      $styleParameters: styleParameters,
      $profileId: profileId
    });
  },

  async updateBgMusicUrl(profileId:string, url:string) {
    console.debug(`DB.updateBgMusicUrl(string, string, string)`);
    let db = await dbOpen(DBPATH);
    await db.run(`
      UPDATE Profile
        SET
          BgMusicUrl=$url
        WHERE Id=$profileId
      `, {
      $url: url,
      $profileId: profileId
    });
  },

  handleError(error:any):void {
    if(error) {
      console.error("Error occured:");
      console.error(error.message || error);
    }
  }
}

export default DatabaseController;
