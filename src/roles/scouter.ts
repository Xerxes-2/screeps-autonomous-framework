/**
 * A creep role that scouts a room.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  ScoutRoom = 1,
  Stay = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.ScoutRoom);
  }

  switch (creep.memory.state) {
    case State.ScoutRoom:
      runScoutRoom(creep);
      break;
    case State.Stay:
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.ScoutRoom);
      break;
  }
}

function runScoutRoom(creep: Creep) {
  const target = creep.memory.target;
  // go to target room
  if (target) {
    if (creep.room.name === target) {
      moveTo(creep, new RoomPosition(25, 25, target));
      creep.setState(State.Stay);
      creep.say('🚩Stay');
      return;
    }
    travelTo(creep, target);
    return;
  }
}
