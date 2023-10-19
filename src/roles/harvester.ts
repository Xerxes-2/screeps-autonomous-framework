/**
 * A creep role responsible for collecting energy.
 * @module
 */

import { logUnknownState } from 'utils/creep';

enum State {
  HarvestEnergy = 1,
  TransferEnergy = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HarvestEnergy);
  }

  switch (creep.memory.state) {
    case State.HarvestEnergy:
      runHarvestEnergy(creep);
      break;
    case State.TransferEnergy:
      runDischargeEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HarvestEnergy);
      break;
  }
}

function runHarvestEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('📥Discharge');
    creep.setState(State.TransferEnergy);
    runDischargeEnergy(creep);
    return;
  }

  const source = getTargetSource(creep);
  if (source) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      creep.moveTo(source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
  }
}

function runDischargeEnergy(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('⚡Harvest');
    creep.setState(State.HarvestEnergy);
    runHarvestEnergy(creep);
    return;
  }

  const targetStructure = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_CONTAINER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });

  if (targetStructure) {
    if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}

// function runTransferEnergy(creep: Creep) {
//   if (!creep.store[RESOURCE_ENERGY]) {
//     creep.say('⚡Harvest');
//     creep.setState(State.HarvestEnergy);
//     runHarvestEnergy(creep);
//     return;
//   }

//   const targetStructure = creep.room.find(FIND_STRUCTURES, {
//     filter: structure =>
//       (structure.structureType === STRUCTURE_EXTENSION ||
//         structure.structureType === STRUCTURE_SPAWN ||
//         structure.structureType === STRUCTURE_TOWER) &&
//       structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
//   })?.[0];

//   if (targetStructure) {
//     if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
//       creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
//     }
//   }
// }

function getTargetSource(creep: Creep) {
  if (!creep.memory.source && creep.memory.target) {
    creep.memory.source = creep.memory.target.split('-')[1] as Id<Source>;
  }
  if (!creep.memory.source) {
    return null;
  }
  return Game.getObjectById(creep.memory.source);
}
