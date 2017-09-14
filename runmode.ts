
export default class RunMode {
  private isProduction = true;
  production(set?:boolean): boolean {
      if(typeof set != 'undefined')
        this.isProduction = set;
      return this.isProduction;
    }

  development(set?:boolean): boolean {
    if(typeof set != 'undefined')
      this.isProduction = !set;
    return !this.isProduction;
  }
}
