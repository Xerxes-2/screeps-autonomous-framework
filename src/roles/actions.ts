/**
 * Common actions for different roles
 * @module
 */
import { Role } from 'enums/role';
import { moveTo } from 'screeps-cartographer';

export function transferEnergy(creep: Creep) {
  let targetStructure: AnyStructure | null | undefined = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_EXTENSION || structure.structureType === STRUCTURE_SPAWN) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  targetStructure ??= creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_TOWER && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 200
  });
  if (!targetStructure) {
    const nonSinkContainers = creep.room.getNonSinkContainers();
    const banks = nonSinkContainers.filter(
      c => c.store.getFreeCapacity(RESOURCE_ENERGY) > creep.store.getUsedCapacity()
    );
    targetStructure = _.sortBy(banks, b => b.store.getUsedCapacity()).shift();
  }
  if (!targetStructure) {
    const bank = creep.room.storage;
    if (bank && bank.store.getFreeCapacity(RESOURCE_ENERGY) > 0) {
      targetStructure = bank;
    }
  }
  if (!targetStructure) {
    // directly transfer to builder and upgrader
    // 3/4 chance to transfer to builder
    // 1/4 chance to transfer to upgrader
    const builder = creep.room
      .find(FIND_MY_CREEPS, {
        filter: c => c.memory.role === Role.Builder && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      })
      .shift();
    const upgrader = creep.room
      .find(FIND_MY_CREEPS, {
        filter: c => c.memory.role === Role.Upgrader && c.store.getFreeCapacity(RESOURCE_ENERGY) > 0
      })
      .shift();
    const rand = Game.time % 200;
    if (rand < 150) {
      if (builder) {
        if (creep.transfer(builder, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
          moveTo(creep, builder, { visualizePathStyle: { stroke: '#ffffff' } });
        }
        return true;
      }
    }
    if (upgrader) {
      if (creep.transfer(upgrader, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
        moveTo(creep, upgrader, { visualizePathStyle: { stroke: '#ffffff' } });
      }
      return true;
    }
  }

  if (targetStructure) {
    if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    return true;
  }
  return false;
}

export function withdrawEnergy(creep: Creep) {
  const containers = creep.room.getContainers();
  const sinks = creep.room.getAllSourceTanks();
  const banks = containers.filter(
    c => !sinks.includes(c) && c.store.getUsedCapacity(RESOURCE_ENERGY) > creep.store.getFreeCapacity()
  );
  let bank: StructureContainer | StructureStorage | undefined = banks.shift();
  bank ??= creep.room.storage;
  if (bank) {
    if (creep.withdraw(bank, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, bank, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  } else {
    const drops = creep.room.getDroppedEnergy();
    const drop = drops.filter(d => d.amount >= creep.store.getFreeCapacity(RESOURCE_ENERGY));
    const largestDrop = _.sortBy(drop, d => d.amount).pop();
    if (largestDrop) {
      if (creep.pickup(largestDrop) === ERR_NOT_IN_RANGE) {
        moveTo(creep, largestDrop, { visualizePathStyle: { stroke: '#ffaa00' } });
      }
      return true;
    }
  }
  return false;
}
