class Version {
  major:number;
  minor:number;
  revision:number;

  constructor(theMajor:number|string, theMinor?:number, theRev?:number) {
    if(typeof theMajor === 'string') {
      let stringAr = theMajor.split(".");
      if(stringAr.length != 3)
        throw new Error(`Invalid versionString: ${theMajor}`)
      let major = parseInt(stringAr[0]);
      let minor = parseInt(stringAr[1]);
      let revision = parseInt(stringAr[2]);
      if( isNaN(major) || isNaN(minor) || isNaN(revision) ) {
        throw new Error(`Invalid versionString: ${theMajor}`)
      }
      this.major = major;
      this.minor = minor;
      this.revision = revision;
    }
    else if(typeof theMinor !== 'undefined' && typeof theRev != 'undefined') {
      this.major = theMajor as number;
      this.minor = theMinor;
      this.revision = theRev;
    }
    else {
      throw new Error("Invalid Parameters!")
    }
  }

  lessThan(v2:Version) {
    return this.major < v2.major ||
      this.major == v2.major &&
      (
        this.minor < v2.minor ||
        this.minor == v2.minor &&
        this.revision < v2.revision
      );
  }

  greaterThan(v2: Version) {
    return this.major > v2.major ||
      this.major == v2.major &&
      (
        this.minor > v2.minor ||
        this.minor == v2.minor &&
        this.revision > v2.revision
      );
  }

  equals(v2:Version) {
    return this.major == v2.major &&
      this.minor == v2.minor &&
      this.revision == v2.revision;
  }

  toString():string {
    return `${this.major}.${this.minor}.${this.revision}`;
  }
}

export {Version};
