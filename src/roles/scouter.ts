/**
 * A creep role that scouts a room.
 * @module
 */

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
      runStay(creep);
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
  if (target && !travelTo(creep, target)) {
    const center = new RoomPosition(25, 25, target);
    creep.move(creep.pos.getDirectionTo(center));
    creep.say('🚩Scouted');
    creep.setState(State.Stay);
    return;
  }
}

function runStay(creep: Creep) {
  // stay in target room
  const target = creep.memory.target;
  if (target && creep.room.name !== target) {
    creep.say('🚩Scouting');
    creep.setState(State.ScoutRoom);
    return;
  }
}
