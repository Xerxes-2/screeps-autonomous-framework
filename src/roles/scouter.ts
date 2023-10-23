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
    creep.say('🚩Scouted');
    creep.setState(State.Stay);
    return;
  }
  const lifetime = creep.ticksToLive;
  if (lifetime && lifetime < 1300) {
    creep.say('🚩Stay');
    creep.setState(State.Stay);
    return;
  }
}
