import { Priority } from 'enums/priority';
import { Manager } from 'managers/manager';
import { RoomService } from 'services/room';

/**
 * The `TowerManager` class orchestrates the defensive tower structure behaviors of the bot.
 *
 * This class should be utilized whenever you need to control towers and their associated logic
 * for attacking or healing creeps, or repairing structures.
 */

export class TowerManager extends Manager {
  private roomService: RoomService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService) {
    super('TowerManager');
    this.roomService = roomService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Critical) {
      const normalRooms = this.roomService.getNormalRooms();
      for (const room of normalRooms) {
        this.controlTowers(room);
      }
    }
  }

  private controlTowers(room: Room) {
    const towersWithEnergy = room.find<StructureTower>(FIND_STRUCTURES, {
      filter: structure =>
        structure.structureType === STRUCTURE_TOWER && structure.store[RESOURCE_ENERGY] > TOWER_ENERGY_COST
    });

    // if attacked by hostile creeps but no towers have energy, activate safe mode
    if (
      towersWithEnergy.length === 0 &&
      room.find(FIND_HOSTILE_CREEPS, {
        filter: creep => creep.getActiveBodyparts(ATTACK) > 0 || creep.getActiveBodyparts(RANGED_ATTACK) > 0
      }).length > 0
    ) {
      room.controller?.activateSafeMode();
    }

    for (const tower of towersWithEnergy) {
      const closestHostile = tower.pos.findClosestByRange(FIND_HOSTILE_CREEPS);
      if (closestHostile) {
        tower.attack(closestHostile);
        continue;
      }
      const closestDamagedStructure = tower.pos.findClosestByRange(FIND_STRUCTURES, {
        filter: structure =>
          structure.structureType !== STRUCTURE_WALL &&
          structure.structureType !== STRUCTURE_RAMPART &&
          structure.hits < structure.hitsMax
      });
      if (closestDamagedStructure) {
        tower.repair(closestDamagedStructure);
        continue;
      }
      // wall repair
      const walls = room.find(FIND_STRUCTURES, {
        filter: structure =>
          (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) &&
          structure.hits < 100_000
      });
      const lowestWall = _.sortBy(walls, w => w.hits)[0];
      if (lowestWall) {
        tower.repair(lowestWall);
      }
    }
  }
}
