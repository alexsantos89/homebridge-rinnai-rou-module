#!/usr/bin/env node

// Import required modules
const program = require('commander');
const config = require('config')
const {rinnaiApi}= require('./src/rinnai-api.js')

const rinnaiDevice = new rinnaiApi(console.log, config.get('ip'))

// Define your command-line tool
program
  .name('rinnai-util')
  .description('CLI to control Rinnai BR devices using ROU003')
  .version('1.0.0');

program.command('set-temperature')
  .description('Set the temperature for Rinnai device')
  .argument('<target>', 'the new target temperature to set')
  .action(rinnaiDevice.setTemperature);

program.command('set-power-state')
  .description('Set the power state for Rinnai device')
  .argument('<turnOn>', '1 - turn it on or 0 - turn it off')
  .action(rinnaiDevice.setPowerState);


program.parse(process.argv);