-- Up
ALTER TABLE Profile
    ADD COLUMN StyleId CHAR(20) DEFAULT 'default';
ALTER TABLE Profile
    ADD COLUMN StyleParameters TEXT DEFAULT '';

-- Down
CREATE TEMPORARY TABLE Profile_backup(Id,Title);
INSERT INTO Profile_backup SELECT Id,Title FROM Profile;
DROP TABLE Profile;
ALTER TABLE Profile_backup RENAME TO Profile;
