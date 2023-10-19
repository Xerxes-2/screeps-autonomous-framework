/**
 * A creep role responsible for transporting energy.
 * @module
 */

import * as Actions from 'roles/actions';
import { logUnknownState } from 'utils/creep';

enum State {
  WithdrawEnergy = 1,
  TransferEnergy = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.WithdrawEnergy);
  }

  switch (creep.memory.state) {
    case undefined:
    case State.WithdrawEnergy:
      runWithdrawEnergy(creep);
      break;
    case State.TransferEnergy:
      runTransferEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.WithdrawEnergy);
      break;
  }
}

function runWithdrawEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('💫Transfer');
    creep.setState(State.TransferEnergy);
    runTransferEnergy(creep);
    return;
  }

  Actions.withdrawEnergy(creep);
}

function runTransferEnergy(creep: Creep) {
  if (creep.store.getFreeCapacity()) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    Actions.withdrawEnergy(creep);
    return;
  }

  if (!Actions.transferEnergy(creep)) {
    // creep.say('💤Sleep');
    // creep.delState();
  }
}
