/**
 * A creep role responsible for developing a new room.
 * @module
 */

import * as Action from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  HarvestEnergy = 1,
  Build = 2,
  Charge = 3,
  Upgrade = 4,
  Repair = 5
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HarvestEnergy);
  }

  switch (creep.memory.state) {
    case State.HarvestEnergy:
      runHarvestEnergy(creep);
      break;
    case State.Build:
      runBuild(creep);
      break;
    case State.Charge:
      runCharge(creep);
      break;
    case State.Upgrade:
      runUpgrade(creep);
      break;
    case State.Repair:
      runRepair(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HarvestEnergy);
      break;
  }
}

function runHarvestEnergy(creep: Creep) {
  if (!creep.memory.target) {
    creep.say('🚩No target');
    return;
  }
  const targetRoom = Game.rooms[creep.memory.target];
  if (!targetRoom) {
    creep.say('🚩No room');
    return;
  }
  if (creep.room !== targetRoom) {
    travelTo(creep, creep.memory.target);
    return;
  }
  if (creep.store.getFreeCapacity() === 0) {
    creep.setState(State.Charge);
    creep.say('⚡Charge');
    runCharge(creep);
    return;
  }
  const drop = creep.room.getDroppedEnergy();
  const largestDrop = _.sortBy(drop, d => d.amount).pop();
  if (largestDrop) {
    if (creep.pickup(largestDrop) === ERR_NOT_IN_RANGE) {
      moveTo(creep, largestDrop, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }
  const sources = creep.room.find(FIND_SOURCES_ACTIVE);
  if (sources.length === 0) {
    const containers = creep.room.getContainers();
    if (containers.length === 0) {
      creep.say('🚩No source');
      return;
    }
    const container = containers[0];
    if (creep.withdraw(container, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, container, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }
  const source = sources[0];
  if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
    moveTo(creep, source, { visualizePathStyle: { stroke: '#ffaa00' } });
  }
}

function runCharge(creep: Creep) {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  if (Action.transferEnergy(creep)) {
    return;
  }
  // repair
  creep.setState(State.Repair);
  creep.say('🔧Repair');
  runRepair(creep);
}

function runRepair(creep: Creep) {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  const structure = creep.room.find(FIND_STRUCTURES, {
    filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL
  })?.[0];
  if (structure) {
    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      moveTo(creep, structure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  } else {
    creep.setState(State.Build);
    creep.say('🚧Build');
    runBuild(creep);
  }
}

function runBuild(creep: Creep) {
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  const constructionSite = creep.room.getConstructionSites()?.[0];
  if (!constructionSite) {
    creep.setState(State.Upgrade);
    creep.say('⚡Upgrade');
    runUpgrade(creep);
    return;
  }
  if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
    moveTo(creep, constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}

function runUpgrade(creep: Creep) {
  const controller = creep.room.controller;
  if (!controller) {
    creep.say('🚩No controller');
    return;
  }
  if (creep.store[RESOURCE_ENERGY] === 0) {
    creep.setState(State.HarvestEnergy);
    creep.say('🔄Harvest');
    runHarvestEnergy(creep);
    return;
  }
  if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
    moveTo(creep, controller, { visualizePathStyle: { stroke: '#ffffff' } });
  }
}
