<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# homebridge-rinnai-rou-module

[![npm](https://img.shields.io/npm/v/homebridge-rinnai-rou-module.svg)](https://www.npmjs.com/package/homebridge-rinnai-rou-module) [![npm](https://img.shields.io/npm/dt/homebridge-rinnai-rou-module.svg)](https://www.npmjs.com/package/homebridge-rinnai-rou-module)

</span>

## Description

This [homebridge](https://github.com/homebridge/homebridge) plugin exposes a Rinnai thermostat to Apple's [HomeKit](http://www.apple.com/ios/home/). <br>
The plugin allows you to set the thermostat mode and control the target temperature. It is based on local wifi communication between
homebridge server and Rinnai Wifi ROU003 module used by Rinnai Heaters mainly in Brazil.

## Installation

1. Install [homebridge](https://github.com/homebridge/homebridge#installation)
2. Install this plugin: `npm install -g homebridge-rinnai-rou-module`
3. Update your `config.json` file

## Configuration

```json
"accessories": [
     {
       "accessory": "Thermostat",
       "name": "RinnaiThermostat",
       "deviceIp": "192.168.0.100"
     }
]
```

### Core
| Key | Description | Default |
| --- | --- | --- |
| `accessory` | Must be `Thermostat` | N/A |
| `name` | Name to appear in the Home app | N/A |
| `deviceIp` | Local IP address used by Rinnai ROU003 module | N/A |

### Optional fields
| Key | Description | Default |
| --- | --- | --- |
| `maxTemp` | Upper bound for the temperature selector in the Home app | `46` |
| `minTemp` | Lower bound for the temperature selector in the Home app | `35` |
| `minStep` | Minimum increment value for the temperature selector in the Home app | `1` |

### Additional options
| Key | Description | Default |
| --- | --- | --- |
| `model` | Appears under the _Model_ field for the accessory | plugin |
| `serial` | Appears under the _Serial_ field for the accessory | deviceIp |
| `manufacturer` | Appears under the _Manufacturer_ field for the accessory | author |
| `firmware` | Appears under the _Firmware_ field for the accessory | version |

## Credits

The code was extensively based on other git repositories that were able to reverse engineer the Rinnai ROU003 wifi module
and implement a Thermostat via Homebridge

#### Credits

- [github.com/ale-jr/rinnai_br_homeassistant](https://github.com/ale-jr/rinnai_br_homeassistant)
- [github.com/phenotypic/homebridge-web-thermostat](https://github.com/phenotypic/homebridge-web-thermostat)

## License
This project is under the MIT License.

MIT © [alexsantos89]()