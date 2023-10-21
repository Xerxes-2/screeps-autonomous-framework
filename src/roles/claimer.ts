/**
 * A creep role responsible for claiming a new room.
 * @module
 */

import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  Claim = 1
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.Claim);
  }

  switch (creep.memory.state) {
    case State.Claim:
      runClaim(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.Claim);
      break;
  }
}

function runClaim(creep: Creep) {
  if (!creep.memory.target) {
    creep.say('🚩No target');
    return;
  }
  const targetController = getTargetController(creep);
  if (targetController) {
    if (creep.claimController(targetController) === ERR_NOT_IN_RANGE) {
      moveTo(creep, targetController, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  } else {
    travelTo(creep, creep.memory.target);
  }
}

function getTargetController(creep: Creep) {
  if (creep.room.name !== creep.memory.target) {
    return null;
  }
  return creep.room.controller;
}
