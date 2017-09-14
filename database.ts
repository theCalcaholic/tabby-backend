//import * as sqlite3 from 'sqlite3';
import * as sqlite3 from 'sqlite3';
import { ProfileData } from 'tabby-common/profile';
import { TabData } from 'tabby-common/tab';
//import * as Promise from 'bluebird';

const DBPATH = './db/main.sql';

function getDB() {
  return new sqlite3.Database(DBPATH, Database.handleError);
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
      db.get(`SELECT * FROM Profile WHERE Profile.Id='${id}'`, (err, row) => {
        let tabs = new Array;
        this.handleError(err);
        if(err) {
          reject(err);
          return;
        } else {

          db.all(`SELECT * FROM Tab WHERE ParentProfile='${id}'`, (err, rows) => {
            this.handleError(err);
            if(err) {
              reject(err);
              return;
            }

            tabs = rows.map( (tabRow) => {
              return {
                title: tabRow.Title || '',
                content: tabRow.Content || '',
                id: tabRow.Id
              } as TabData
            });

              resolve({
                title: row.title,
                id: row.title,
                tabs: tabs
               } as ProfileData);
            });
          }
        });
      });
  },

  updateProfile(profile:ProfileData):Promise<any> {
    let db = getDB();
    let promises = profile.tabs.map((data) => {
      let tab: TabData = {id: data.id, title: data.title, content: data.content};
      return new Promise((resolve, reject) => {
        console.log("updating profile...")
        console.log(profile);
        if(data.id) {
          db.run(`UPDATE Tab
              SET
                Title='${tab.title}',
                Content='${tab.content}',
                ParentProfile='${profile.id}'
              WHERE Id='${tab.id}'`, (err) => {
            console.log(`Tried to update tab ${tab.id}`);
            this.handleError(err);
          });
        } else {
          db.run(`INSERT INTO Tab
            (Title, Content, ParentProfile)
            VALUES (
              '${tab.title}',
              '${tab.content}', '${profile.id}'
            )`, (err) => {
            console.log(`Tried to insert tab ${tab.id} instead.`);
            this.handleError(err);
            resolve();
          });
        }
      });
    });
    promises.push(new Promise((resolve, reject) => {
      db.run(`UPDATE Profile
        SET
          Title='${profile.title}'
        WHERE Id='${profile.id}'`, (err) => {
          if(err) {
            console.log("request 3");
            this.handleError(err);
          } else {
            resolve();
          }
        });
    }));
    return Promise.all(promises);
  },

  addNewProfile(profile:ProfileData):Promise<ProfileData> {
    let db = getDB();
    return new Promise<ProfileData>((resolve, reject) => {
      db.run(`INSERT INTO Profile
        (Id, Title)
        VALUES ('${profile.id}', '${profile.title}')`, (err) => {
          if(err) {
            this.handleError(err);
            reject(err);
            return;
          } else {
            resolve();
            return;
          }
        });
    });
  },

  handleError(error:any):void {
    if(error)
      console.error(error.message || error);
  }
}

export default Database;
