/**
 * A creep role that works on upgrading the controller.
 * @module
 */

import { withdrawEnergy } from 'roles/actions';
import { logUnknownState } from 'utils/creep';

enum State {
  WithdrawEnergy = 1,
  UpgradeController = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.WithdrawEnergy);
  }

  switch (creep.memory.state) {
    case State.WithdrawEnergy:
      runWithdrawEnergy(creep);
      break;
    case State.UpgradeController:
      runUpgradeController(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.WithdrawEnergy);
      break;
  }
}

function runWithdrawEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('🙏Upgrade');
    creep.setState(State.UpgradeController);
    runUpgradeController(creep);
    return;
  }

  withdrawEnergy(creep);
}

function runUpgradeController(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }

  const { controller } = creep.room;
  if (controller) {
    if (creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
      creep.moveTo(controller, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  }
}
