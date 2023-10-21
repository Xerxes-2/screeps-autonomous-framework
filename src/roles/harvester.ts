/**
 * A creep role responsible for collecting energy.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  HarvestEnergy = 1
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HarvestEnergy);
  }

  switch (creep.memory.state) {
    case State.HarvestEnergy:
      runHarvestEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HarvestEnergy);
      break;
  }
}

function runHarvestEnergy(creep: Creep) {
  const source = getTargetSource(creep);
  if (source) {
    if (creep.harvest(source) === ERR_NOT_IN_RANGE) {
      moveTo(creep, source, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return;
  }
  const room = getTargetRoom(creep);
  // go to target room
  if (room && creep.room.name !== room.name) {
    travelTo(creep, room.name);
    return;
  }
}

function getTargetRoom(creep: Creep) {
  if (!creep.memory.target) {
    return null;
  }
  const roomName = creep.memory.target.split('-')[0];
  return Game.rooms[roomName];
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
