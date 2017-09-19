//import * as sqlite3 from 'sqlite3';
import * as sqlite3 from 'sqlite3';
import { ProfileData } from 'tabby-common/profile';
import { TabData } from 'tabby-common/tab';
//import * as Promise from 'bluebird';

const DBPATH = './db/main.sql';

function getDB() {
  return new sqlite3.Database(DBPATH, Database.handleError);
}

function executeRequest(request: Function): Promise<any> {
  return new Promise((resolve, reject) => {
    request((err:any, result?:any) => {
      if(err) {
        reject(err);
      }
      if(typeof result !== 'undefined')
        resolve(result);
    });
  });
}

let Database = {

  setup():void {
    let db = getDB();
    db.serialize(() => {
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
    });
  },

  getProfile(id:string):Promise<ProfileData> {
    console.log(`DB.getProfile(${id})`);
    let db = getDB();
    return new Promise<ProfileData>((resolve, reject) => {
      executeRequest(db.get.bind(db, `SELECT * FROM Profile WHERE Profile.Id='${id}'`)).then(
        (row:any) => {
          let tabs = new Array;
          executeRequest(db.all.bind(db, `SELECT * FROM Tab WHERE ParentProfile='${id}'`)).then(
            (rows) => {
            tabs = rows.map( (tabRow:any) => {
                return {
                  title: tabRow.Title || '',
                  content: tabRow.Content || '',
                  id: tabRow.Id
                } as TabData
              });

              resolve({
                title: row.title,
                id: row.id,
                tabs: tabs
               } as ProfileData);
          },
          (err) => {
            this.handleError(err);
          });
        },
        (err) => {
          this.handleError(err);
        }
      );
      });
  },

  updateProfile(profile:ProfileData):Promise<any> {
    let db = getDB();
    let promises = profile.tabs.map((data) => {
      let tab: TabData = {id: data.id, title: data.title, content: data.content};
      console.log("updating profile...")
      console.log(profile);
      let request:Promise<any>;
      if(data.id) {
        request = executeRequest(db.run.bind(db, `
          UPDATE Tab
            SET
              Title='${tab.title}',
              Content='${tab.content}',
              ParentProfile='${profile.id}'
            WHERE Id='${tab.id}'
        `));
      } else {
        request = executeRequest(db.run.bind(db, `
          INSERT INTO Tab
            (Title, Content, ParentProfile)
            VALUES (
              '${tab.title}',
              '${tab.content}', '${profile.id}'
            )
        `));
      }
      return request;
    });

    promises.push(executeRequest(db.run.bind(db, `
      UPDATE Profile
        SET
          Title='${profile.title}'
        WHERE Id='${profile.id}'
    `)));

    return Promise.all(promises).then(()=>{}, this.handleError);
  },

  addNewProfile(profile:ProfileData):Promise<ProfileData> {
    let db = getDB();
    return executeRequest(db.run.bind(db, `
      INSERT INTO Profile
        (Id, Title)
        VALUES ('${profile.id}', '${profile.title}')
    `));
  },

  addNewTab(profileId:string):Promise<TabData> {
    let db = getDB();
    return executeRequest(db.run.bind(db, `
      INSERT INTO TabData
        (Title, Content, ParentProfile)
        VALUES ('', '', '${profileId}')
    `));
  },

  handleError(error:any):void {
    if(error) {
      console.error("Error occured:");
      console.error(error.message || error);
    }
  }
}

export default Database;
