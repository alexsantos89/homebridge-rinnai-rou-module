let Service, Characteristic
const packageJson = require('./package.json')
const { rinnaiApi } = require('./src/rinnai-api.js')
const ip = require('ip')

module.exports = function (homebridge) {
    Service = homebridge.hap.Service
    Characteristic = homebridge.hap.Characteristic
    homebridge.registerAccessory('homebridge-rinnai-thermostat', 'Thermostat', Thermostat)
}

function Thermostat(log, config) {
    this.log = log

    this.name = config.name
    this.pollInterval = config.pollInterval || 60
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
        this.log.debug('Identify requested!')
        callback()
    },

    _getStatus: function (callback) {
        this.log.debug('Updating device status- ip: %s', this.deviceIp)
        const deviceState = (isPoweredOn) => isPoweredOn ? 1 : 0
        this.rinnaiDevice.getState().then(
            parsedParams => {
                deviceTemp = parsedParams.targetTemperature
                deviceIsPoweredOn = parsedParams.isPoweredOn
                this.log.debug('Device response: %s', parsedParams)
                this.service.getCharacteristic(Characteristic.TargetTemperature).updateValue(deviceTemp)
                this.log.debug('Updated TargetTemperature to: %s', deviceTemp)
                this.service.getCharacteristic(Characteristic.CurrentTemperature).updateValue(deviceTemp)
                this.log.debug('Updated CurrentTemperature to: %s', deviceTemp)
                this.service.getCharacteristic(Characteristic.TargetHeatingCoolingState).updateValue(deviceState(deviceIsPoweredOn))
                this.log.debug('Updated TargetHeatingCoolingState to: %s', deviceState(deviceIsPoweredOn))
                this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(deviceState(deviceIsPoweredOn))
                this.log.debug('Updated CurrentHeatingCoolingState to: %s', deviceState(deviceIsPoweredOn))
                callback()
            }
        ).catch((error) => {
            this.log.debug('Error getting state: %s', error.message)
            this.service.getCharacteristic(Characteristic.CurrentHeatingCoolingState).updateValue(new Error('Polling failed'))
            callback(error)
        })
    },

    setTargetHeatingCoolingState: function (value, callback) {
        this.log('Setting targetHeatingCoolingState: %s', value)

        this.rinnaiDevice.setPowerState(value).then(() => {
            setTimeout(function () {
                this._getStatus(function () { })
            }.bind(this), this.checkupDelay)
            callback()
        }
        ).catch((error) => {
            this.log.debug('Error setting targetHeatingCoolingState: %s', error.message)
            callback(error)
        })
    },

    setTargetTemperature: function (value, callback) {
        this.log.debug('Setting targetTemperature: %s', value)
        value = value.toFixed(0)

        this.rinnaiDevice.setTemperature(value).then(() => {
            this.log('Set targetTemperature to: %s', value)
            setTimeout(function () {
                this._getStatus(function () { })
            }.bind(this), this.checkupDelay)
            callback()
        }).catch((error) => {
            this.log.debug('Error setting targetTemperature: %s', error.message)
            callback(error)
        })
    },

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

        this._getStatus(function () { })

        setInterval(function () {
            this._getStatus(function () { })
        }.bind(this), this.pollInterval * 1000)

        return [this.informationService, this.service]
    }
}