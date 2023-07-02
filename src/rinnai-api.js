const axios = require('axios')
const ip = require('ip')
const { parseTargetTemperatureToRange, parseRinnaiTemperature, delay, round } = require('./utils.js')

class rinnaiApi {
    constructor(log, deviceIp) {
        this.log = log
        this.preventUpdate = false
        this.localIp = ip.address() // config.get('localIp')
        this.deviceIp = deviceIp
        this.deviceApi = axios.create({
            baseURL: `http://${this.deviceIp}`,
            timeout: 5000 // 2 seconds
        })

    }

    setPriority = (requirePriority) => {
        const priority = requirePriority ? this.localIp : "null"
        this.log("[RINNAI API] set priority to", priority)
        return this.deviceApi(`ip:${priority}:pri`)
            .then(() => true)
            .catch(() => false)
    }

    parseStateParams = (stringifiedParams) => {
        const params = stringifiedParams.split(',')
        const targetTemperature = parseRinnaiTemperature(params[7])
        const isHeating = params[2] === '1'
        const priorityIp = params[6].split(":")[0]
        const isPoweredOn = params[0] !== "11"

        return {
            targetTemperature,
            isHeating,
            isPoweredOn,
            priorityIp
        }
    }

    getState = () => {
        this.log("[RINNAI API] fetching heater state")
        return this.deviceApi('/tela_')
            .then(response => this.parseStateParams(response.data))
            // .catch(this.log("Error getting Rinnai device state.")) // TODO alex - test without this
    }


    getPreventUpdate = () => this.preventUpdate
    startPreventingUpdates = () => this.preventUpdate = true
    stopPreventingUpdates = () => this.preventUpdate = false

    setTemperatureRecursive = async (target, lastTargetTemp = undefined, retries = 0) => {
        const localIp = this.localIp
        this.startPreventingUpdates()
        try {
            const targetTemperatureInRange = parseTargetTemperatureToRange(target)
            let currentTargetTemp = +lastTargetTemp
            if (!lastTargetTemp) {
                const { targetTemperature: stateTargetTemp, priorityIp } = await this.getState()
                currentTargetTemp = stateTargetTemp
                const otherDeviceHasPriority = priorityIp !== "null" && priorityIp !== localIp
                if (otherDeviceHasPriority) {
                    this.log("[RINNAI API] other device has priority")
                    this.stopPreventingUpdates()
                    return false
                }
                await this.setPriority(true)

            }

            if (targetTemperatureInRange === currentTargetTemp) {
                this.stopPreventingUpdates()
                await this.setPriority(false)
                return currentTargetTemp
            }

            const operation = currentTargetTemp > targetTemperatureInRange ? 'dec' : 'inc'
            const response = await this.deviceApi(operation)
            const parsedParams = this.parseStateParams(response.data)
            currentTargetTemp = parsedParams.targetTemperature

            const otherDeviceHasPriority = parsedParams.priorityIp !== "null" && parsedParams.priorityIp !== localIp
            if (otherDeviceHasPriority) {
                this.log("[RINNAI API] other device has priority")
                this.stopPreventingUpdates()
                await setPriority(false)
                return false
            }

            if (targetTemperatureInRange === currentTargetTemp) {
                this.stopPreventingUpdates()
                await this.setPriority(false)
                return currentTargetTemp
            }

            await delay(100)

            this.setTemperatureRecursive(target, currentTargetTemp, 0)
        }
        catch (e) {
            if (retries < 5)
                return this.setTemperatureRecursive(target, lastTargetTemp, retries + 1)
            this.log("[RINNAI API] set temperature error", e?.message || e)
            this.stopPreventingUpdates()
            await this.setPriority(false)
            return false
        }
    }

    setTemperature = async (target) => {
        await this.setTemperatureRecursive(target, undefined, 0)
    }

    setPowerState = async (turnOn) => {
        this.log(`SetPowerState - ${turnOn}`)
        turnOn = turnOn == 1 ? true : false
        const { isPoweredOn } = await this.getState()
        if (isPoweredOn === turnOn) return true
        const response = await this.deviceApi('/lig')
        return this.parseStateParams(response.data)
    }

}

module.exports = {
    rinnaiApi
}