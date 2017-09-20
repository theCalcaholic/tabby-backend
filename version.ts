class Version {
  major:number;
  minor:number;
  revision:number;
}



function versionFromString(versionString:string):Version|null {
  let stringAr = versionString.split(".");
  if(stringAr.length != 3)
    return null;
  let major = parseInt(stringAr[0]);
  let minor = parseInt(stringAr[1]);
  let revision = parseInt(stringAr[2]);
  if( isNaN(major) || isNaN(minor) || isNaN(revision) ) {
    return null;
  }
  return {major: major, minor: minor, revision: revision} as Version;
}

export {Version, versionFromString};
