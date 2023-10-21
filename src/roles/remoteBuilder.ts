/**
 * A creep role that builds remote structures.
 * @module
 */

import { withdrawEnergy } from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

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
    travelTo(creep, creep.memory.homeroom);
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
    travelTo(creep, creep.memory.target);
    return;
  }

  const constructionSite = creep.room.find(FIND_CONSTRUCTION_SITES)?.[0];
  if (constructionSite) {
    if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      moveTo(creep, constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
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
      moveTo(creep, structure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}
