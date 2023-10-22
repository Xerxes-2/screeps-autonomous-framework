/**
 * A creep role that defends a remote room.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { marchTo } from 'utils/pathfinder';

enum State {
  MoveToRoom = 1,
  DefendRoom = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.MoveToRoom);
  }

  switch (creep.memory.state) {
    case State.MoveToRoom:
      runMoveToRoom(creep);
      break;
    case State.DefendRoom:
      runDefendRoom(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.MoveToRoom);
      break;
  }
}

function runMoveToRoom(creep: Creep) {
  if (creep.memory.target && creep.room.name !== creep.memory.target) {
    marchTo(creep, creep.memory.target);
    return;
  }
  creep.setState(State.DefendRoom);
  runDefendRoom(creep);
}

function runDefendRoom(creep: Creep) {
  const target = creep.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
  if (target) {
    if (creep.attack(target) === ERR_NOT_IN_RANGE) {
      moveTo(creep, target);
    }
  }
}
