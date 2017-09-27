//import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import {open as dbOpen } from 'sqlite';
import { ProfileData } from 'tabby-common/models/profile';
import { TabData } from 'tabby-common/models/tab';
import { Version } from './version';
import { DBBlockedError } from './dbblockederror';
//import * as module from './package.json';
//import * as Promise from 'bluebird';

const DBPATH = './db/main.sql';



class MigrationRoutine {
  version: Version;
  migrate: Function;
}

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
/*
function executeRequest(request: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    request( (err:any, result?:any) => {
      if(err) {
        console.error("ERROR:");
        console.error(err);
        reject(err);
      }
      if(typeof result === 'undefined') {
        console.log("typeof result is undefined");
        console.log("last id: " + this.lastId);
        resolve(this.lastId);
      } else {
        resolve(result);
      }
    });
  });
}*/

let DatabaseController = {
  blocked:false,

  /*migrationRoutines: new Array<MigrationRoutine>(
    {
      version: new Version("0.0.1"),
      migrate: (db:any) => {
        db.serialize( () => {
          db.run(`CREATE TABLE Meta (
            Key CHAR(16) NOT NULL PRIMARY KEY,
            Value CHAR(200)
          )`);
          db.run(`CREATE TABLE Profile (
            Id CHAR(16) NOT NULL PRIMARY KEY,
            Title CHAR(100))`);
          db.run(`CREATE TABLE Tab (
            Id INTEGER PRIMARY KEY AUTOINCREMENT,
            Title CHAR(200),
            Content TEXT,
            ParentProfile CHAR(16) NOT NULL,
            FOREIGN KEY(ParentProfile) REFERENCES Profile(Id)
          )`);
          db.run(`INSERT INTO Meta (Key, Value) VALUES ('version', '0.0.0')`);
        });
      }
    },
    {
      version: new Version("0.0.2"),
      migrate: (db:sqlite.Database) => {
        db.serialize( () => {
          db.run(`ALTER TABLE Profile
              ADD COLUMN StyleId CHAR(20)
              DEFAULT 'default'`);
          db.run(`ALTER TABLE Profile
              ADD COLUMN StyleParameters TEXT
              DEFAULT ''`);
        });
      }
    }
  ),


  getDB(ignoreBlockedStatus:boolean=false):sqlite3.Database {
    if(this.blocked && !ignoreBlockedStatus)
      throw new DBBlockedError();

    return new sqlite3.Database(DBPATH, Database.handleError);
  },*/

  async migrate() {
    console.log("Migrating database...");
    //this.blocked = true;
    if(!fs.existsSync(DBPATH)) {
      createPath(DBPATH.substr(0, DBPATH.lastIndexOf("/")));
      //fs.mkdirSync(DBPATH.substr(0, DBPATH.lastIndexOf("/")));
      //db = this.getDB(true);
    }
    /*this.migrationRoutines.sort(
      (a:MigrationRoutine, b:MigrationRoutine) => {
        if( a.version.lessThan(b.version) )
          return -1;
        if( b.version.lessThan(a.version) )
          return 1;
        return 0;
    });*/
    /*let migration:Promise<any> = new Promise((resolve, reject) => {resolve()});
    let db:sqlite3.Database;
    let version:Version =  new Version(0,0,0);
    else {
      db = this.getDB(true);
      migration = executeRequest(db.get.bind(db, `SELECT Value FROM Meta WHERE Key='version'`))
      .then( row => {
        if( typeof row === 'undefined' || row === null || row.Value === null)
          throw Error("The database seems to be corrupted!");
        version = new Version(row.Value);
      });
    }
    migration.then(() => {
      console.log("Detected version: " + version.toString());
      this.migrationRoutines.forEach((routine:MigrationRoutine) => {
        if( routine.version.greaterThan(version) ) {
          console.log("migrating to " + routine.version.toString() + "...");
          routine.migrate(db);
          version = routine.version
          db.serialize(() => {
            db.run(`UPDATE Meta SET Value=? WHERE Key='version'`, [version.toString()]);
          });
          console.log("done.");
        }
      });

      this.blocked = false;
    });*/

    const db = await dbOpen(DBPATH);
    await db.migrate({ force: 'last', migrationsPath: "./db/migrations" });
  },

  async getProfile(id:string) {
    console.log(`DB.getProfile(${id})`);
    const db = await dbOpen(DBPATH);

    let row = await db.get("SELECT * FROM Profile WHERE Profile.Id=?", [id]);
    let tabRows = await db.all("SELECT * FROM Tab WHERE ParentProfile=?", [id]);
    let tabs = tabRows.map( (tabRow:any) => {
      return {
        title: tabRow.Title || '',
        content: tabRow.Content || '',
        id: tabRow.Id
      } as TabData
    });

    return {
      title: row.Title || "",
      id: row.Id,
      tabs: tabs,
      styleId: row.StyleId,
      styleParameters: [JSON.parse(row.StyleParameters)]
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
          (Id, Title, StyleId, StyleParameters)
          VALUES ($id, $title, $styleId, $styleParams)
      `,
      {
        $id: profile.id,
        $title: profile.title,
        $styleId: profile.styleId,
        $styleParams: JSON.stringify(profile.styleParameters)
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

  handleError(error:any):void {
    if(error) {
      console.error("Error occured:");
      console.error(error.message || error);
    }
  }
}

export default DatabaseController;
