//import * as sqlite3 from 'sqlite3';
import * as fs from 'fs';
import * as sqlite3 from 'sqlite3';
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

function executeRequest(request: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    let stmt = request((err:any, result?:any) => {
      if(err) {
        console.error("ERROR:");
        console.error(err);
        //reject(err);
      }
      if(typeof result === 'undefined') {
        resolve(stmt.lastId);
      } else {
        resolve(result);
      }
    });
  });
}

let Database = {
  blocked:false,

  migrationRoutines: new Array<MigrationRoutine>(
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
      migrate: (db:sqlite3.Database) => {
        db.serialize( () => {
          db.run(`ALTER TABLE Profile
              ADD COLUMN StyleName CHAR(20)
              DEFAULT 'default'`);
          db.run(`ALTER TABLE Profile
              ADD COLUMN StyleParams TEXT
              DEFAULT ''`);
        });
      }
    }
  ),


  getDB(ignoreBlockedStatus:boolean=false):sqlite3.Database {
    if(this.blocked && !ignoreBlockedStatus)
      throw new DBBlockedError();

    return new sqlite3.Database(DBPATH, Database.handleError);
  },

  migrate():void {
    console.log("Migrating database...");
    this.blocked = true;
    this.migrationRoutines.sort(
      (a:MigrationRoutine, b:MigrationRoutine) => {
        if( a.version.lessThan(b.version) )
          return -1;
        if( b.version.lessThan(a.version) )
          return 1;
        return 0;
    });
    let migration:Promise<any>;
    let db:sqlite3.Database;
    let version:Version =  new Version(0,0,0);
    if(!fs.existsSync(DBPATH)) {
      createPath(DBPATH.substr(0, DBPATH.lastIndexOf("/")));
      //fs.mkdirSync(DBPATH.substr(0, DBPATH.lastIndexOf("/")));
      db = this.getDB(true);
    }
    else {
      db = this.getDB(true);
      db.get(`SELECT Value FROM Meta WHERE Key='version'`, (err, row) => {
        if( typeof row === 'undefined' || row === null || row.Value === null)
          throw Error("The database seems to be corrupted!");
        version = new Version(row.Value);

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
      })
    }
  },

  getProfile(id:string):Promise<ProfileData> {
    console.log(`DB.getProfile(${id})`);
    let db = this.getDB();
    return (executeRequest(
      db.get.bind(db, "SELECT * FROM Profile WHERE Profile.Id=?", [id])
      ) as Promise<ProfileData>
      ).then(
        (row:any) => {
          console.log("found profile:");
          console.log(row);
          let tabs = new Array;
          return executeRequest(
            db.all.bind(db,
              "SELECT * FROM Tab WHERE ParentProfile=?",
              [id]))
          .then(
            (rows) => {
            tabs = rows.map( (tabRow:any) => {
                return {
                  title: tabRow.Title || '',
                  content: tabRow.Content || '',
                  id: tabRow.Id
                } as TabData
              });

              return {
                title: row.Title,
                id: row.Id,
                tabs: tabs
               } as ProfileData;
          });
      });
  },

  updateProfile(profile:ProfileData):Promise<any> {
    let db = this.getDB();

    return executeRequest(db.run.bind(db, `
      UPDATE Profile
        SET
          Title=$title
        WHERE Id=$id
      `,
      {
        $title: profile.title,
        $id: profile.id
      }
    ));
  },

  addNewProfile(profile:ProfileData):Promise<any> {
    console.log("addNewProfile()");
    console.log(profile);
    let db = this.getDB();
    return executeRequest(db.run.bind(db, `
        INSERT INTO Profile
          (Id, Title)
          VALUES ($id, $title)
      `,
      {
        $id: profile.id,
        $title: profile.title
      }
    ));
  },

  addNewTab(newTab:TabData, profileId:string):Promise<TabData> {
    console.log(`addNewTab(<TabData>, ${profileId})`);
    let db = this.getDB();
    return executeRequest(db.run.bind(db, `
      INSERT INTO Tab
        (Title, Content, ParentProfile)
        VALUES ($title, $content, $profile)
      `,
      {
        $title: newTab.title,
        $content: newTab.content,
        $profile: profileId
      }
    )).then(
      (result) => {
        return {
          id: result,
          title: newTab.title,
          content: newTab.content
        } as TabData;
      }
    );
  },

  updateTab(tab:TabData, profileId:string):Promise<any> {
    console.log(`DB.updateTab(<TabData>, ${profileId})`);
    let db = this.getDB();
    return executeRequest(db.run.bind(db, `
      UPDATE Tab
        SET
          Title=$title,
          Content=$content
        WHERE Id=$id
        AND ParentProfile=$profile
    `,
    {
      $title: tab.title,
      $content: tab.content,
      $id: tab.id,
      $profile: profileId
    }
  ));
  },

  handleError(error:any):void {
    if(error) {
      console.error("Error occured:");
      console.error(error.message || error);
    }
  }
}

export default Database;
