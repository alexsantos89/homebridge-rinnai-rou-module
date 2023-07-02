let Service, Characteristic
const packageJson = require('./package.json')
const { rinnaiApi } = require('./src/rinnai-api.js')
const ip = require('ip')
// const request = require('request')
// const http = require('http')

module.exports = function (homebridge) {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic
    homebridge.registerAccessory('homebridge-rinnai-thermostat', 'Thermostat', Thermostat)
}

function Thermostat(log, config) {
    this.log = log

    this.name = config.name
    this.pollInterval = config.pollInterval || 30
    this.validStates = config.validStates || [0, 1]
    this.deviceIp = config.deviceIp || '192.168.0.100'
    this.rinnaiDevice = new rinnaiApi(this.log, this.deviceIp)

    this.checkupDelay = config.checkupDelay || 2000

    this.manufacturer = config.manufacturer || packageJson.author
    this.serial = config.serial || this.deviceIp
    this.model = config.model || packageJson.name
    this.firmware = config.firmware || packageJson.version

    this.temperatureDisplayUnits = config.temperatureDisplayUnits || 0
    this.maxTemp = config.maxTemp || 46
    this.minTemp = config.minTemp || 35
    this.minStep = config.minStep || 1

    this.service = new Service.Thermostat(this.name)
}

Thermostat.prototype = {

    identify: function (callback) {
        this.log('Identify requested!')
        callback()
    },

    // _httpRequest: function (url, body, method, callback) {
    //     request({
    //         url: url,
    //         body: body,
    //         method: this.http_method,
    //         LOCAL_IP: this.timeout,
    //         rejectUnauthorized: false,
    //         auth: this.auth
    //     },
    //         function (error, response, body) {
    //             callback(error, response, body)
    //         })
    // },

    // _getStatus: function (callback) {
    //     const url = this.apiroute + '/status'
    //     this.log('Getting status: %s', url)

    //     this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
    //         if (error) {
    //             this.log.warn('Error getting status: %s', error.message)
    //             this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
    //             callback(error)
    //         } else {
    //             this.log('Device response: %s', responseBody)
    //             try {
    //                 const json = JSON.parse(responseBody)
    //                 this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(json.targetTemperature)
    //                 this.log('Updated TargetTemperature to: %s', json.targetTemperature)
    //                 this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(json.currentTemperature)
    //                 this.log('Updated CurrentTemperature to: %s', json.currentTemperature)
    //                 this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(json.targetHeatingCoolingState)
    //                 this.log('Updated TargetHeatingCoolingState to: %s', json.targetHeatingCoolingState)
    //                 this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(json.currentHeatingCoolingState)
    //                 this.log('Updated CurrentHeatingCoolingState to: %s', json.currentHeatingCoolingState)
    //                 if (this.temperatureThresholds) {
    //                     this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(json.coolingThresholdTemperature)
    //                     this.log('Updated CoolingThresholdTemperature to: %s', json.coolingThresholdTemperature)
    //                     this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(json.heatingThresholdTemperature)
    //                     this.log('Updated HeatingThresholdTemperature to: %s', json.heatingThresholdTemperature)
    //                 }
    //                 if (this.currentRelativeHumidity) {
    //                     this.service.getCharacteristic(Characteristic.CurrentRelativeHumidity).updateValue(json.currentRelativeHumidity)
    //                     this.log('Updated CurrentRelativeHumidity to: %s', json.currentRelativeHumidity)
    //                 }
    //                 callback()
    //             } catch (e) {
    //                 this.log.warn('Error parsing status: %s', e.message)
    //             }
    //         }
    //     }.bind(this))
    // },

    // _httpHandler: function (characteristic, value) {
    //     switch (characteristic) {
    //         case 'targetHeatingCoolingState': {
    //             this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(value)
    //             this.log('Updated %s to: %s', characteristic, value)
    //             break
    //         }
    //         case 'targetTemperature': {
    //             this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(value)
    //             this.log('Updated %s to: %s', characteristic, value)
    //             break
    //         }
    //         case 'coolingThresholdTemperature': {
    //             this.service.getCharacteristic(Characteristic.CoolingThresholdTemperature).updateValue(value)
    //             this.log('Updated %s to: %s', characteristic, value)
    //             break
    //         }
    //         case 'heatingThresholdTemperature': {
    //             this.service.getCharacteristic(Characteristic.HeatingThresholdTemperature).updateValue(value)
    //             this.log('Updated %s to: %s', characteristic, value)
    //             break
    //         }
    //         default: {
    //             this.log.warn('Unknown characteristic "%s" with value "%s"', characteristic, value)
    //         }
    //     }
    // },

    _getStatus: function (callback) {
        this.log('Updating device status- ip: %s', this.deviceIp)
        const deviceState = (isPoweredOn) => isPoweredOn ? 1 : 0
        try {
            this.rinnaiDevice.getState().then(
                parsedParams => {
                    deviceTemp = parsedParams.targetTemperature
                    deviceIsPoweredOn = parsedParams.isPoweredOn
                    this.log('Device response: %s', parsedParams)
                    this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(deviceTemp)
                    this.log('Updated TargetTemperature to: %s', deviceTemp)
                    this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(deviceTemp)
                    this.log('Updated CurrentTemperature to: %s', deviceTemp)
                    this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(deviceState(deviceIsPoweredOn))
                    this.log('Updated TargetHeatingCoolingState to: %s', deviceState(deviceIsPoweredOn))
                    this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(deviceState(deviceIsPoweredOn))
                    this.log('Updated CurrentHeatingCoolingState to: %s', deviceState(deviceIsPoweredOn))
                    callback()
                }
            ).catch((error) => {
                this.log('Error getting state: %s', error.message)
                callback(error)
            })
        } catch (e) {
            this.log.warn('Error parsing status: %s', e.message)
            this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
            callback(error)
        }
    },

    setTargetHeatingCoolingState: function (value, callback) {
        this.log('Setting targetHeatingCoolingState: %s', value)

        try {
            this.rinnaiDevice.setPowerState(value).then(() => {
                setTimeout(function () {
                    this._getStatus(function () { })
                }.bind(this), this.checkupDelay)
                callback()
            }
            ).catch((error) => {
                this.log('Error setting targetHeatingCoolingState: %s', error.message)
                callback(error)
            })
        } catch (error) {
            this.log('Error seting target state: %s', error.message)
            callback(error)
        }
        // const url = this.apiroute + '/targetHeatingCoolingState?value=' + value
        // this.log('Setting targetHeatingCoolingState: %s', url)

        // this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        //     if (error) {
        //         this.log.warn('Error setting targetHeatingCoolingState: %s', error.message)
        //         callback(error)
        //     } else {
        //         this.log('Set targetHeatingCoolingState to: %s', value)
        //         setTimeout(function () {
        //             this._getStatus(function () { })
        //         }.bind(this), this.checkupDelay)
        //         callback()
        //     }
        // }.bind(this))
    },

    setTargetTemperature: function (value, callback) {
        this.log('Setting targetTemperature: %s', value)
        callback()
        // value = value.toFixed(0)
        // const url = this.apiroute + '/targetTemperature?value=' + value
        // this.log('Setting targetTemperature: %s', url)

        // this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
        //     if (error) {
        //         this.log.warn('Error setting targetTemperature: %s', error.message)
        //         callback(error)
        //     } else {
        //         this.log('Set targetTemperature to: %s', value)
        //         callback()
        //     }
        // }.bind(this))
    },

    // setCoolingThresholdTemperature: function (value, callback) {
    //     value = value.toFixed(1)
    //     const url = this.apiroute + '/coolingThresholdTemperature?value=' + value
    //     this.log('Setting coolingThresholdTemperature: %s', url)

    //     this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
    //         if (error) {
    //             this.log.warn('Error setting coolingThresholdTemperature: %s', error.message)
    //             callback(error)
    //         } else {
    //             this.log('Set coolingThresholdTemperature to: %s', value)
    //             callback()
    //         }
    //     }.bind(this))
    // },

    // setHeatingThresholdTemperature: function (value, callback) {
    //     value = value.toFixed(1)
    //     const url = this.apiroute + '/heatingThresholdTemperature?value=' + value
    //     this.log('Setting heatingThresholdTemperature: %s', url)

    //     this._httpRequest(url, '', this.http_method, function (error, response, responseBody) {
    //         if (error) {
    //             this.log.warn('Error setting heatingThresholdTemperature: %s', error.message)
    //             callback(error)
    //         } else {
    //             this.log('Set heatingThresholdTemperature to: %s', value)
    //             callback()
    //         }
    //     }.bind(this))
    // },

    getServices: function () {
        this.informationService = new Service.AccessoryInformation()
        this.informationService
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serial)
            .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

        this.service.getCharacteristic(Characteristic.TemperatureDisplayUnits).updateValue(this.temperatureDisplayUnits)

        this.service
            .getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .on('set', this.setTargetHeatingCoolingState.bind(this))

        this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState)
            .setProps({
                validValues: this.validStates
            })

        this.service
            .getCharacteristic(Characteristic.TargetTemperature)
            .on('set', this.setTargetTemperature.bind(this))
            .setProps({
                minValue: this.minTemp,
                maxValue: this.maxTemp,
                minStep: this.minStep
            })

        this.service
            .getCharacteristic(Characteristic.CurrentTemperature)
            .setProps({
                minStep: this.minStep
            })

        // if (this.temperatureThresholds) {
        //     this.service
        //         .getCharacteristic(Characteristic.CoolingThresholdTemperature)
        //         // .on('set', this.setCoolingThresholdTemperature.bind(this))
        //         .setProps({
        //             minValue: this.minTemp,
        //             maxValue: this.maxTemp,
        //             minStep: this.minStep
        //         })

        //     this.service
        //         .getCharacteristic(Characteristic.HeatingThresholdTemperature)
        //         // .on('set', this.setHeatingThresholdTemperature.bind(this))
        //         .setProps({
        //             minValue: this.minTemp,
        //             maxValue: this.maxTemp,
        //             minStep: this.minStep
        //         })
        // }

        this._getStatus(function () { })

        setInterval(function () {
            this._getStatus(function () { })
        }.bind(this), this.pollInterval * 1000)

        return [this.informationService, this.service]
    }
}