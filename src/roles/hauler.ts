/**
 * A creep role responsible for transporting energy.
 * @module
 */

import * as Actions from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';

enum State {
  HaulEnergy = 1,
  TransferEnergy = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HaulEnergy);
  }

  switch (creep.memory.state) {
    case undefined:
    case State.HaulEnergy:
      runHaulEnergy(creep);
      break;
    case State.TransferEnergy:
      runTransferEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HaulEnergy);
      break;
  }
}

function runHaulEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('💫Transfer');
    creep.setState(State.TransferEnergy);
    runTransferEnergy(creep);
    return;
  }
  // energy on ground
  const drop = creep.pos.findClosestByRange(FIND_DROPPED_RESOURCES, {
    filter: resource => resource.resourceType === RESOURCE_ENERGY
  });
  if (drop) {
    if (creep.pickup(drop) === ERR_NOT_IN_RANGE) {
      moveTo(creep, drop, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }

  const sinks = creep.room.getAllSinks();
  let target: AnyStructure = sinks
    .filter(sink => sink.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity(RESOURCE_ENERGY))
    .sort((a, b) => {
      const aFree = a.store.getFreeCapacity(RESOURCE_ENERGY);
      const bFree = b.store.getFreeCapacity(RESOURCE_ENERGY);
      return aFree - bFree;
    })[0];

  target ??= creep.room.find(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_STORAGE &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity(RESOURCE_ENERGY)
  })[0];

  if (target) {
    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, target, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  return false;
}

function runTransferEnergy(creep: Creep) {
  if (!creep.store.getUsedCapacity()) {
    creep.say('💰Withdraw');
    creep.setState(State.HaulEnergy);
    runHaulEnergy(creep);
    return;
  }

  if (!Actions.transferEnergy(creep)) {
    // creep.say('💤Sleep');
    // creep.delState();
  }
}
