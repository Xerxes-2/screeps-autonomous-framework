/**
 * A creep role that constructs structures.
 * @module
 */

import { withdrawEnergy } from 'roles/actions';
import { logUnknownState } from 'utils/creep';

enum State {
  WithdrawEnergy = 1,
  BuildConstruction = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.WithdrawEnergy);
  }

  switch (creep.memory.state) {
    case State.WithdrawEnergy:
      runWithdrawEnergy(creep);
      break;
    case State.BuildConstruction:
      runBuildConstruction(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.WithdrawEnergy);
      break;
  }
}

function runWithdrawEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('🔨Build');
    creep.setState(State.BuildConstruction);
    runBuildConstruction(creep);
    return;
  }

  withdrawEnergy(creep);
}

function runBuildConstruction(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }

  const constructionSite = creep.room.find(FIND_CONSTRUCTION_SITES)?.[0];
  if (constructionSite) {
    if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      creep.moveTo(constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}
