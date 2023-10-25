/**
 * A creep role that builds remote structures.
 * @module
 */

import { withdrawEnergy } from 'roles/actions';
import { moveTo } from 'screeps-cartographer';
import { logUnknownState } from 'utils/creep';
import { travelTo } from 'utils/pathfinder';

enum State {
  WithdrawEnergy = 1,
  BuildConstruction = 2,
  RepairStructure = 3
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
    case State.RepairStructure:
      runRepairStructure(creep);
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
  // go to homeroom
  if (withdrawEnergy(creep)) {
    return;
  }
  travelTo(creep, creep.memory.homeroom!);
}

function runBuildConstruction(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }
  // go to target room
  if (travelTo(creep, creep.memory.target!)) {
    return;
  }

  const constructionSite = creep.room.getConstructionSites()?.[0];
  if (constructionSite) {
    if (creep.build(constructionSite) === ERR_NOT_IN_RANGE) {
      moveTo(creep, constructionSite, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  } else {
    creep.say('🔧Repair');
    creep.setState(State.RepairStructure);
  }
}

function runRepairStructure(creep: Creep) {
  if (!creep.store[RESOURCE_ENERGY]) {
    creep.say('💰Withdraw');
    creep.setState(State.WithdrawEnergy);
    runWithdrawEnergy(creep);
    return;
  }
  if (travelTo(creep, creep.memory.target!)) {
    return;
  }
  const structure = creep.room.getContainers().find(c => c.hits < c.hitsMax);
  if (structure) {
    if (creep.repair(structure) === ERR_NOT_IN_RANGE) {
      moveTo(creep, structure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
  } else {
    creep.say('🔨Build');
    creep.setState(State.BuildConstruction);
  }
}
