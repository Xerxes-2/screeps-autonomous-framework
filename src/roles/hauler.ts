/**
 * A creep role responsible for transporting energy.
 * @module
 */

import * as Actions from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';

enum State {
  HaulEnergy = 1,
  TransferEnergy = 2
}

export function run(creep: Creep) {
  if (!creep.hasState()) {
    creep.setState(State.HaulEnergy);
  }

  switch (creep.memory.state) {
    case undefined:
    case State.HaulEnergy:
      runHaulEnergy(creep);
      break;
    case State.TransferEnergy:
      runTransferEnergy(creep);
      break;
    default:
      logUnknownState(creep);
      creep.setState(State.HaulEnergy);
      break;
  }
}

function runHaulEnergy(creep: Creep) {
  if (creep.isFull) {
    creep.say('💫Transfer');
    creep.setState(State.TransferEnergy);
    runTransferEnergy(creep);
    return;
  }

  const sinks = creep.room.getAllSinks();
  const leastFreeSink = _.sortBy(sinks, s => s.store.getFreeCapacity()).shift();
  if (leastFreeSink) {
    if (creep.withdraw(leastFreeSink, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, leastFreeSink, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  return false;
}

function runTransferEnergy(creep: Creep) {
  if (!creep.store.getUsedCapacity()) {
    creep.say('💰Withdraw');
    creep.setState(State.HaulEnergy);
    runHaulEnergy(creep);
    return;
  }

  if (!Actions.transferEnergy(creep)) {
    // creep.say('💤Sleep');
    // creep.delState();
  }
}
