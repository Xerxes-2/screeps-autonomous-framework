/**
 * Common actions for different roles
 * @module
 */

export function transferEnergy(creep: Creep) {
  const targetStructure = creep.room.find(FIND_STRUCTURES, {
    filter: structure =>
      (structure.structureType === STRUCTURE_EXTENSION ||
        structure.structureType === STRUCTURE_SPAWN ||
        structure.structureType === STRUCTURE_TOWER) &&
      structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
  })?.[0];

  if (targetStructure) {
    if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    return true;
  }
  return false;
}

export function withdrawEnergy(creep: Creep) {
  let bank = creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_CONTAINER && structure.store.getFreeCapacity() === 0
  });
  bank ??= creep.pos.findClosestByRange(FIND_STRUCTURES, {
    filter: structure =>
      structure.structureType === STRUCTURE_CONTAINER &&
      structure.store.getUsedCapacity() > creep.store.getFreeCapacity()
  });
  if (bank) {
    if (creep.withdraw(bank, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(bank, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  return false;
}
