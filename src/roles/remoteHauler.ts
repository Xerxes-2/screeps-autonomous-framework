/**
 * A creep role responsible for transporting energy.
 * @module
 */

import * as Actions from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  HaulEnergy = 1,
  TransferEnergy = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HaulEnergy);
  }

  switch (creep.memory.state) {
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
  const homeroomName = creep.memory.homeroom;
  if (!homeroomName) {
    creep.say('🚩No room');
    return;
  }
  const homeroom = Game.rooms[homeroomName];
  if (!homeroom) {
    creep.say('🚩No room');
    return;
  }
  // energy on ground
  const drops = creep.room.getDroppedEnergy();
  const drop = drops.filter(d => d.amount >= creep.store.getFreeCapacity(RESOURCE_ENERGY));
  const largestDrop = _.sortBy(drop, d => d.amount).pop();
  if (largestDrop) {
    if (creep.pickup(largestDrop) === OK) {
      return;
    }
  }

  const remoteSinks = homeroom.getRemoteTanks();
  let target: AnyStructure = remoteSinks
    .filter(sink => sink.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity(RESOURCE_ENERGY))
    .sort((a, b) => {
      const aFree = a.store.getFreeCapacity(RESOURCE_ENERGY);
      const bFree = b.store.getFreeCapacity(RESOURCE_ENERGY);
      return aFree - bFree;
    })[0];

  target ??= homeroom.find(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_STORAGE &&
      structure.store.getUsedCapacity(RESOURCE_ENERGY) >= creep.store.getFreeCapacity(RESOURCE_ENERGY) &&
      homeroom.energyAvailable < homeroom.energyCapacityAvailable
  })[0];

  if (target) {
    if (travelTo(creep, target.room.name)) {
      return;
    }
    if (creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(target, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}

function runTransferEnergy(creep: Creep) {
  if (!creep.store.getUsedCapacity()) {
    creep.say('💰Withdraw');
    creep.setState(State.HaulEnergy);
    runHaulEnergy(creep);
    return;
  }
  // go home
  if (travelTo(creep, creep.memory.homeroom!)) {
    return;
  }

  if (!Actions.transferEnergy(creep)) {
    // creep.say('💤Sleep');
    // creep.delState();
  }
}
