function newRunMode() {
  let runMode = {
    isProduction: true,
  };
  runMode.production = function(set) {
      if(typeof set != 'undefined')
        isProduction = set;
      return isProduction;
    }

  runMode.development = function(set) {
    if(typeof set != 'undefined')
      isProduction = !set;
    return !isProduction;
  }
  return runMode;
}
module.exports.new = newRunMode;
