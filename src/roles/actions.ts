/**
 * Common actions for different roles
 * @module
 */
import { Role } from 'enums/role';
import { moveTo } from 'screeps-cartographer';

export function transferEnergy(creep: Creep) {
  let targetStructure: AnyStructure | null | undefined = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_TOWER) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  });
  if (!targetStructure) {
    const banks: StructureContainer[] = creep.room.find(FIND_STRUCTURES, {
      filter: structure =>
        structure.structureType === STRUCTURE_CONTAINER &&
        !creep.room.getAllSinks().includes(structure) &&
        structure.store.getFreeCapacity() > 0
    });
    targetStructure = _.sortBy(banks, b => b.store.getUsedCapacity()).shift();
  }
  if (!targetStructure) {
    const banks: StructureStorage[] = creep.room.find(FIND_STRUCTURES, {
      filter: structure => structure.structureType === STRUCTURE_STORAGE && structure.store.getFreeCapacity() > 0
    });
    targetStructure = _.sortBy(banks, b => b.store.getUsedCapacity()).shift();
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
  const drops = creep.room.find(FIND_DROPPED_RESOURCES, {
    filter: resource => resource.resourceType === RESOURCE_ENERGY
  });
  const largestDrop = _.sortBy(drops, d => d.amount).pop();
  if (largestDrop) {
    if (creep.pickup(largestDrop) === ERR_NOT_IN_RANGE) {
      moveTo(creep, largestDrop, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  const banks: StructureContainer[] = creep.room.find(FIND_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0
  });
  const leastFreeBank = _.sortBy(banks, b => b.store.getFreeCapacity()).shift();
  if (leastFreeBank) {
    if (creep.withdraw(leastFreeBank, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      moveTo(creep, leastFreeBank, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  return false;
}
