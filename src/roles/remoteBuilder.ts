/**
 * A creep role that builds remote structures.
 * @module
 */

import { withdrawEnergy } from 'roles/actions';
import { logUnknownState } from 'utils/creep';

enum State {
  WithdrawEnergy = 1,
  BuildConstruction = 2,
  RepairStructure = 3
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.WithdrawEnergy);
  }

  switch (creep.memory.state) {
    case State.WithdrawEnergy:
      runWithdrawEnergy(creep);
      break;
    case State.BuildConstruction:
      runBuildConstruction(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.WithdrawEnergy);
      break;
  }
}

function runWithdrawEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('🔨Build');
    creep.setState(State.BuildConstruction);
    runBuildConstruction(creep);
    return;
  }
  // go to homeroom
  if (creep.memory.homeroom && creep.room.name !== creep.memory.homeroom) {
    const exitDir = creep.room.findExitTo(creep.memory.homeroom);
    if (exitDir === ERR_NO_PATH) {
      creep.say('🚫NoPath');
      return;
    }
    if (exitDir === ERR_INVALID_ARGS) {
      creep.say('🚫InvalidArgs');
      return;
    }
    const exit = creep.pos.findClosestByRange(exitDir);
    if (!exit) {
      creep.say('🚫NoExit');
      return;
    }
    creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
    return;
  }
  // stop building when energy in base is not full
  if (creep.room.energyAvailable < creep.room.energyCapacityAvailable) {
    return;
  }
  withdrawEnergy(creep);
}

function runBuildConstruction(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }
  // go to target room
  if (creep.memory.target && creep.room.name !== creep.memory.target) {
    const exitDir = creep.room.findExitTo(creep.memory.target);
    if (exitDir === ERR_NO_PATH) {
      creep.say('🚫NoPath');
      return;
    }
    if (exitDir === ERR_INVALID_ARGS) {
      creep.say('🚫InvalidArgs');
      return;
    }
    const exit = creep.pos.findClosestByRange(exitDir);
    if (!exit) {
      creep.say('🚫NoExit');
      return;
    }
    creep.moveTo(exit, { visualizePathStyle: { stroke: '#ffffff' } });
    return;
  }

  const constructionSite = creep.room.find(FIND_CONSTRUCTION_SITES)?.[0];
  if (constructionSite) {
    if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      creep.moveTo(constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  } else {
    creep.say('🔧Repair');
    creep.setState(State.RepairStructure);
    runRepairStructure(creep);
  }
}

function runRepairStructure(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }

  const structure = creep.room.find(FIND_STRUCTURES, {
    filter: s => s.hits < s.hitsMax && (s.structureType === STRUCTURE_ROAD || s.structureType === STRUCTURE_CONTAINER)
  })?.[0];
  if (structure) {
    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      creep.moveTo(structure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}
