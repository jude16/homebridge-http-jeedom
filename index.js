var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge){
  Service = homebridge.hap.Service;
  Characteristic = homebridge.hap.Characteristic;
  homebridge.registerAccessory("homebridge-http-jeedom", "HttpJeedom", HttpJeedomAccessory);
}

function HttpJeedomAccessory(log, config) {
  this.log = log;

  this.jeedom_url           = config["jeedom_url"];
  this.jeedom_api           = config["jeedom_api"];
  this.service              = config["service"];

  this.name                 = config["name"];


  //SwitchService
  this.onCommandID          = config["onCommandID"];
  this.offCommandID         = config["offCommandID"];
  this.stateCommandID       = config["stateCommandID"];

  //TemperatureService
  this.temperatureCommandID = config["temperatureCommandID"];

  //HumidityService
  this.humidityCommandID     = config["humidityCommandID"];
  
  //AmbientLightService
  this.ambientLightCommandID     = config["ambientLightCommandID"];

}

HttpJeedomAccessory.prototype = {

  httpRequest: function(url, callback) {
    request({
      url: url,
      method: "GET",
      rejectUnauthorized: false
    },
  function(error,response, body) {
    callback(error, response, body)
  })
},

//This function builds the URL.
setUrl: function(cmdID) {
  var url;

  url = this.jeedom_url + "/core/api/jeeApi.php?apikey=" + this.jeedom_api + "&type=cmd&id=" + cmdID;

  return url;
},

//This function turns On or Off a switch device
setPowerState: function(powerOn, callback) {
  var url;

  if (!this.onCommandID || !this.offCommandID) {
    this.log.warn("No command ID defined, please check config.json file");
    callback(new Error("No command ID defined"));
    return;
  }

  if (powerOn) {
    url = this.setUrl(this.onCommandID);
  } else {
    url = this.setUrl(this.offCommandID);
  }

  this.httpRequest(url, function(error, response, responseBody) {
    if (error) {
      this.log("HTTP set power failed with error: %s", error.message);
      callback(error);
    } else {
      this.log("HTTP set power succeeded");
      callback();
    }
  }.bind(this));
},

//This function get a switch state
getPowerState: function(callback) {
  var url;

  if (!this.stateCommandID) {
    this.log.warn("No state command ID defined");
    callback(new Error("No status command ID defined"));
    return;
  }

  url = this.setUrl(this.stateCommandID);

  this.httpRequest(url, function(error, response, responseBody) {
    if (error) {
      this.log("HTTP get power function failed: %s", error.message);
      callback(error);
    } else {
      var binaryState = parseInt(responseBody);
      var powerOn = binaryState > 0;
      this.log("Power state is currently %s", binaryState);
      callback(null, powerOn);
    }
  }.bind(this));
},

getTemperature: function(callback) {
  var url;

  if (!this.temperatureCommandID) {
    this.log.warn("No temperature command ID defined");
    callback(new Error("No temperature command ID defined"));
    return;
  }

  url = this.setUrl(this.temperatureCommandID);

  this.log("Getting current temperature for sensor " + this.name );

  this.httpRequest(url, function(error, response, responseBody) {
    if (error) {
      this.log("HTTP get temperature function failed: %s", error.message);
      callback(error);
    } else {
      var floatState = parseFloat(responseBody);
      this.log("Temperature for sensor " + this.name + " is currently %s", floatState);
      callback(null, floatState);
    }
  }.bind(this));

},

getHumidity: function(callback) {
  var url;

  if (!this.humidityCommandID) {
    this.log.warn("No humidity command ID defined");
    callback(new Error("No humidity command ID defined"));
    return;
  }

  url = this.setUrl(this.humidityCommandID);

  this.log("Getting current humidity for sensor " + this.name );

  this.httpRequest(url, function(error, response, responseBody) {
    if (error) {
      this.log("HTTP get humidity function failed: %s", error.message);
      callback(error);
    } else {
      var floatState = parseFloat(responseBody);
      this.log("Humidity for sensor " + this.name + " is currently %s", floatState);
      callback(null, floatState);
    }
  }.bind(this));

},

getAmbientLight: function(callback) {
  var url;

  if (!this.ambientLightCommandID) {
    this.log.warn("No ambient light command ID defined");
    callback(new Error("No ambient light command ID defined"));
    return;
  }

  url = this.setUrl(this.ambientLightCommandID);

  this.log("Getting current humidity for sensor " + this.name );

  this.httpRequest(url, function(error, response, responseBody) {
    if (error) {
      this.log("HTTP get ambient light function failed: %s", error.message);
      callback(error);
    } else {
      var floatState = parseFloat(responseBody);
      this.log("Ambient light for sensor " + this.name + " is currently %s", floatState);
      callback(null, floatState);
    }
  }.bind(this));

},

identify: function(callback) {
  this.log("Identify requested");
  callback();
},

getServices: function() {
  // you can OPTIONALLY create an information service if you wish to override
  // the default values for things like serial number, model, etc.
  var informationService = new Service.AccessoryInformation();

  informationService
  .setCharacteristic(Characteristic.Manufacturer, "HTTP Manufacturer")
  .setCharacteristic(Characteristic.Model, "HTTP Model")
  .setCharacteristic(Characteristic.SerialNumber, "HTTP Serial Number");

  if (this.service == "SwitchService") {
    this.log("Defining a switch module");

    var switchService = new Service.Switch(this.name);

    switchService
    .getCharacteristic(Characteristic.On)
    .on('get', this.getPowerState.bind(this))
    .on('set', this.setPowerState.bind(this));

    return [switchService];

  } else if (this.service == "TemperatureService"){
    var temperatureService = new Service.TemperatureSensor(this.name);

    temperatureService
    .getCharacteristic(Characteristic.CurrentTemperature)
    .on('get', this.getTemperature.bind(this));

    return [informationService, temperatureService];

  } else if (this.service == "HumidityService") {
    var humidityService = new Service.HumiditySensor(this.name);

    humidityService
    .getCharacteristic(Characteristic.CurrentRelativeHumidity)
    .on('get', this.getHumidity.bind(this));

    return [informationService, humidityService];

  } else if (this.service == "AmbientLightService") {
    var ambientLightService = new Service.LightSensor(this.name);

    ambientLightService
    .getCharacteristic(Characteristic.CurrentAmbientLightLevel)
    .on('get', this.getAmbientLight.bind(this));

    return [informationService, ambientLightService];
  }

}
}
