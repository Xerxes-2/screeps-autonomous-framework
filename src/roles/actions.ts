/**
 * Common actions for different roles
 * @module
 */

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

  if (targetStructure) {
    if (creep.transfer(targetStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(targetStructure, { visualizePathStyle: { stroke: '#ffffff' } });
    }
    return true;
  }
  return false;
}

export function withdrawEnergy(creep: Creep) {
  const banks: StructureContainer[] = creep.room.find(FIND_STRUCTURES, {
    filter: structure => structure.structureType === STRUCTURE_CONTAINER && structure.store.getUsedCapacity() > 0
  });
  const leastFreeBank = _.sortBy(banks, b => b.store.getFreeCapacity()).shift();
  if (leastFreeBank) {
    if (creep.withdraw(leastFreeBank, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
      creep.moveTo(leastFreeBank, { visualizePathStyle: { stroke: '#ffaa00' } });
    }
    return true;
  }
  return false;
}
