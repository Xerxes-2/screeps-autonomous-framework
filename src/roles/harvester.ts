/**
 * A creep role responsible for collecting energy.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

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
      runTransferEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HarvestEnergy);
      break;
  }
}

function runHarvestEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.setState(State.TransferEnergy);
    runTransferEnergy(creep);
    return;
  }
  const source = getTargetSource(creep);
  const room = getTargetRoomName(creep);
  if (room && travelTo(creep, room)) {
    return;
  }
  if (source && source.room === creep.room) {
    const container = source.pos.findInRange(FIND_STRUCTURES, 1, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    })[0] as StructureContainer;
    if (container && creep.pos.getRangeTo(container) > 0) {
      creep.moveTo(container);
      return;
    }
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      moveTo(creep, source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }
}

function runTransferEnergy(creep: Creep) {
  if (!creep.store.getUsedCapacity(RESOURCE_ENERGY)) {
    creep.setState(State.HarvestEnergy);
    runHarvestEnergy(creep);
    return;
  }
  const link = getTargetLink(creep);
  if (link) {
    creep.transfer(link, RESOURCE_ENERGY);
    return;
  }
  creep.say('No Link');
  // drop energy
  creep.drop(RESOURCE_ENERGY);
}

function getTargetRoomName(creep: Creep) {
  if (!creep.memory.target) {
    return null;
  }
  return creep.memory.target.split('-')[0];
}

function getTargetSource(creep: Creep) {
  if (!creep.memory.source && creep.memory.target) {
    creep.memory.source = creep.memory.target.split('-')[1] as Id<Source>;
  }
  if (!creep.memory.source) {
    return null;
  }
  return Game.getObjectById(creep.memory.source);
}

function getTargetLink(creep: Creep) {
  const room = getTargetRoomName(creep);
  const sourceId = creep.memory.source;
  if (!room || !sourceId) {
    return null;
  }
  const link = Game.rooms[room].getSourceTanks(sourceId).find(t => t.structureType === STRUCTURE_LINK);
  if (!link) {
    return null;
  }
  return link as StructureLink;
}
