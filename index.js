var Service, Characteristic;
var request = require("request");

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    homebridge.registerAccessory("homebridge-http-jeedom", "HttpJeedom", HttpJeedomAccessory);
}

function HttpJeedomAccessory(log, config) {
    this.log = log;

    this.jeedom_url = config["jeedom_url"];
    this.jeedom_api = config["jeedom_api"];
    this.service = config["service"];

    this.name = config["name"];


    //SwitchService
    this.onCommandID = config["onCommandID"];
    this.offCommandID = config["offCommandID"];
    this.stateCommandID = config["stateCommandID"];

    //TemperatureService
    this.temperatureCommandID = config["temperatureCommandID"];

    //HumidityService
    this.humidityCommandID = config["humidityCommandID"];

    //AmbientLightService
    this.ambientLightCommandID = config["ambientLightCommandID"];

    //ThermostatService
    this.thermostatID = config.thermostatID;
    this.thermoStatusID;
    this.thermoModeID;
    this.temperatureID;
    this.targetTemperatureID;
    this.targetThermostatID;
    this.targetOffID;
    this.targetAllAllowID;
    this.targetHeatID;
    this.targetCoolID;
    // this.currentRelativeHumidityID = config.currentRelativeHumidityID;
    // this.currentHumidity = config.currentHumidity || false;
    // this.targetHumidity = config.targetHumidity || false;
    this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0;
    this.maxTemp = 30;
    this.minTemp = 15;
    this.heatOnly = config.heatOnly || false;
    this.targetRelativeHumidity = 90;
    this.currentRelativeHumidity = 90;
    this.targetTemperature = 25;
    this.currentTemperature = 20;
    this.targetHeatingCoolingState = 3;
    this.heatingCoolingState = 1;

}

HttpJeedomAccessory.prototype = {

    //Call Jeedom API
    httpRequest: function(url, callback) {
        request({
                url: url,
                method: "GET",
                rejectUnauthorized: false
            },
            function(error, response, body) {
                callback(error, response, body)
            })
    },

    //Call Jeedom JSON RPC API
    jsonRpcRequest: function(method, params = {}, callback) {
        var headers = {
            'User-Agent': 'Super Agent/0.0.1',
            'Content-Type': 'application/json-rpc',
            'Accept': 'application/json-rpc'
        };

        params.apikey = this.jeedom_api;

        var options = {
            url: this.jeedom_url + "/core/api/jeeApi.php",
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                jsonrpc: '2.0',
                method: method,
                params: params,
                id: 1
            })
        };

        request(options,
            function(error, response, body) {
                callback(error, response, body)
            })
    },

    //This function builds the URL.
    setUrl: function(cmdID, slider = null, title = null, message = null) {
        var url;
        url = this.jeedom_url + "/core/api/jeeApi.php?apikey=" + this.jeedom_api + "&type=cmd&id=" + cmdID + (slider == null ? "" : "&slider=" + slider) + (title == null ? "" : "&title=" + title) + (message == null ? "" : "&message=" + message);
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

        this.log("Getting current temperature for sensor " + this.name);

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

        this.log("Getting current humidity for sensor " + this.name);

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

        this.log("Getting current humidity for sensor " + this.name);

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

    initThermostatCommands: function(callback) {
        if (!this.thermostatID) {
            console.log.warn("No " + objectName + " command ID defined");
            return;
        } else if (this.thermoStatusID) {
            return;
        }

        var url;
        var objectName = "thermostat ID";

        url = this.jeedom_url + "/core/api/jeeApi.php?apikey=" + this.jeedom_api + "&type=command&eqLogic_id=" + this.thermostatID;

        var that = this;

        //Get eqLogic commands
        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                that.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                let thermoCmds = JSON.parse(responseBody);

                that.targetTemperatureID = thermoCmds.filter(obj => {
                    return obj.logicalId === "order"
                })[0].id;
                that.log("targetTemperatureID" + that.targetTemperatureID);

                that.temperatureID = thermoCmds.filter(obj => {
                    return obj.logicalId === "temperature"
                })[0].id;

                that.targetThermostatID = thermoCmds.filter(obj => {
                    return obj.logicalId === "thermostat"
                })[0].id;

                that.thermoStatusID = thermoCmds.filter(obj => {
                    return obj.logicalId === "status"
                })[0].id;

                that.thermoModeID = thermoCmds.filter(obj => {
                    return obj.logicalId === "mode"
                })[0].id;

                that.targetAllAllowID = thermoCmds.filter(obj => {
                    return obj.logicalId === "all_allow"
                })[0].id;

                that.targetHeatID = thermoCmds.filter(obj => {
                    return obj.logicalId === "heat_only"
                })[0].id;

                that.targetCoolID = thermoCmds.filter(obj => {
                    return obj.logicalId === "cool_only"
                })[0].id;

                that.targetOffID = thermoCmds.filter(obj => {
                    return obj.logicalId === "off"
                })[0].id;

                that.log(objectName + " for sensor " + that.name + " is loaded");
            }
        });

        //Get eqLogic configuration
        this.jsonRpcRequest("eqLogic::byId", { id: this.thermostatID }, function(error, response, responseBody) {
            if (error) {
                that.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                objectConfig = JSON.parse(responseBody).result;

                that.maxTemp = objectConfig.configuration.order_max != "" ? parseFloat(objectConfig.configuration.order_max) : that.maxTemp;
                that.minTemp = objectConfig.configuration.order_min != "" ? parseFloat(objectConfig.configuration.order_min) : that.minTemp;
            }
            callback();
        });
    },

    getCurrentHeatingCoolingState: function(callback) {
        var url;
        var objectName = "thermostat status";

        if (!this.thermoStatusID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        url = this.setUrl(this.thermoStatusID);

        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                this.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                switch (responseBody) {
                    case "Chauffage":
                        this.currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.HEAT;
                        break;
                    case "Climatisation":
                        this.currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.COOL;
                        break;
                    default:
                        this.currentHeatingCoolingState = Characteristic.CurrentHeatingCoolingState.OFF;
                        break;
                }

                this.log(objectName + " for sensor " + this.name + " is currently %s", this.currentHeatingCoolingState);
                callback(null, this.currentHeatingCoolingState);
            }
        }.bind(this));
    },

    getTargetHeatingCoolingState: function(callback) {
        var url;
        var objectName = "thermostat mode";
        var objectConfig;
        var that = this;

        if (!this.thermoModeID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        //Get eqLogic configuration
        this.jsonRpcRequest("eqLogic::byId", { id: this.thermostatID }, function(error, response, responseBody) {
            if (error) {
                that.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                objectConfig = JSON.parse(responseBody).result;
                url = that.setUrl(that.thermoModeID);

                that.httpRequest(url, function(error, response, responseBody) {
                    if (error) {
                        that.log("HTTP get " + objectName + " function failed: %s", error.message);
                        callback(error);
                    } else {
                        if (responseBody == "Off")
                            that.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.OFF;
                        else if (objectConfig.configuration.allow_mode == "heat" || that.heatOnly)
                            that.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.HEAT;
                        else if (objectConfig.configuration.allow_mode == "cool")
                            that.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.COOL;
                        else
                            that.targetHeatingCoolingState = Characteristic.TargetHeatingCoolingState.AUTO;
                    }

                    that.log(objectName + " for sensor " + that.name + " is currently %s", that.targetHeatingCoolingState);
                    callback(null, that.targetHeatingCoolingState);
                }.bind(that));
            }
        });
    },

    setTargetHeatingCoolingState: function(value, callback) {
        var url;
        var objectName = "thermostat target heating/ cooling state";

        switch (value) {
            case Characteristic.TargetHeatingCoolingState.OFF:
                url = this.setUrl(this.targetOffID);
                break;
            case Characteristic.TargetHeatingCoolingState.HEAT:
                url = this.setUrl(this.targetHeatID);
                this.setTargetTemperature(this.targetTemperature, (response) => {});
                break;
            case Characteristic.TargetHeatingCoolingState.COOL:
                url = this.setUrl(this.targetCoolID);
                this.setTargetTemperature(this.targetTemperature, (response) => {});
                break;
            case Characteristic.TargetHeatingCoolingState.AUTO:
                url = this.setUrl(this.targetAllAllowID);
                this.setTargetTemperature(this.targetTemperature, (response) => {});
                break;
        }

        this.httpRequest(url, function(error) {
            if (error) {
                this.log("HTTP set " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                this.log(objectName + " for sensor " + this.name + " is set to %s", value);
                callback();
            }
        }.bind(this));
    },

    getCurrentTemperature: function(callback) {
        var url;
        var objectName = "thermostat current temperature";

        if (!this.temperatureID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        url = this.setUrl(this.temperatureID);

        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                this.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                this.currentTemperature = parseFloat(responseBody);
                this.log(objectName + " for sensor " + this.name + " is currently %s", this.currentTemperature);
                callback(null, this.currentTemperature);
            }
        }.bind(this));
    },

    getTargetTemperature: function(callback) {
        var url;
        var objectName = "thermostat get target temperature";

        if (!this.targetTemperatureID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        url = this.setUrl(this.targetTemperatureID);

        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                this.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                this.targetTemperature = parseFloat(responseBody);
                this.log(objectName + " for sensor " + this.name + " is currently %s", this.targetTemperature);
                callback(null, this.targetTemperature);
            }
        }.bind(this));
    },

    setTargetTemperature: function(value, callback) {
        var url;
        var objectName = "thermostat set target temperature";

        if (!this.targetThermostatID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        url = this.setUrl(this.targetThermostatID, value);

        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                this.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                this.targetTemperature = parseFloat(responseBody);
                this.log(objectName + " for sensor " + this.name + " is currently set to %s", value);
                callback();
            }
        }.bind(this));
    },

    getCurrentRelativeHumidity: function(callback) {
        var url;
        var objectName = "thermostat relative humidity";

        if (!this.currentRelativeHumidityID) {
            this.log.warn("No " + objectName + " command ID defined");
            callback(new Error("No " + objectName + " command ID defined"));
            return;
        }

        url = this.setUrl(this.currentRelativeHumidityID);

        this.httpRequest(url, function(error, response, responseBody) {
            if (error) {
                this.log("HTTP get " + objectName + " function failed: %s", error.message);
                callback(error);
            } else {
                this.currentRelativeHumidity = parseFloat(responseBody);
                this.log(objectName + " for sensor " + this.name + " is currently %s", this.currentRelativeHumidity);
                callback(null, this.currentRelativeHumidity);
            }
        }.bind(this));
    },

    getTemperatureDisplayUnits: function(callback) {
		callback(null, this.temperatureDisplayUnits);
	},
    setTemperatureDisplayUnits: function(value, callback) {
		this.temperatureDisplayUnits = value;
		callback();
	},

    getName: function(callback) {
        this.log("getName :", this.name);
        callback(null, this.name);
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

        } else if (this.service == "TemperatureService") {
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
        } else if (this.service == "ThermostatService") {

            var thermostatService = new Service.Thermostat(this.name);

            thermostatService
                .getCharacteristic(Characteristic.CurrentHeatingCoolingState)
                .on('get', this.getCurrentHeatingCoolingState.bind(this));

            thermostatService
                .getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .on('get', this.getTargetHeatingCoolingState.bind(this))
                .on('set', this.setTargetHeatingCoolingState.bind(this));

            thermostatService
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on('get', this.getCurrentTemperature.bind(this));

            thermostatService
                .getCharacteristic(Characteristic.TargetTemperature)
                .on('get', this.getTargetTemperature.bind(this))
                .on('set', this.setTargetTemperature.bind(this));

            thermostatService
                .getCharacteristic(Characteristic.TemperatureDisplayUnits)
                .on('get', this.getTemperatureDisplayUnits.bind(this))
                .on('set', this.setTemperatureDisplayUnits.bind(this));

            thermostatService
                .getCharacteristic(Characteristic.Name)
                .on('get', this.getName.bind(this));

            // if (this.currentHumidity) {
            //     thermostatService
            //         .getCharacteristic(Characteristic.CurrentRelativeHumidity)
            //         .on('get', this.getCurrentRelativeHumidity.bind(this));
            // }

            // if (this.targetHumidity) {
            //     this.service
            //         .getCharacteristic(Characteristic.TargetRelativeHumidity)
            //         .on('get', this.getTargetRelativeHumidity.bind(this))
            //         .on('set', this.setTargetRelativeHumidity.bind(this));
        }

        this.initThermostatCommands( (response) => {
            thermostatService.getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                minStep: 0.1
            });

        thermostatService.getCharacteristic(Characteristic.TargetTemperature)
            .setProps({
                minValue: this.minTemp,
                maxValue: this.maxTemp,
                minStep: 0.5
            });
        if (this.heatOnly) {
            thermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
                .setProps({
                    minValue: 0,
                    maxValue: 1,
                    validValues: [0, 1]
                });
        }
        });

        return [informationService, thermostatService];
    }

}