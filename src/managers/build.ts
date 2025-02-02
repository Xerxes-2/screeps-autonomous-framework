import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Builder from 'roles/builder';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getMaxTierSimpleWorker, getSimpleWorkerBody } from 'utils/profile';

/**
 * The `BuildManager` class orchestrates the build-related activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Builder creeps and their
 * associated tasks within the framework.
 */

export class BuildManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('BuildManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Builder, Builder.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const normalRooms = this.roomService.getNormalRooms();
        const inDevRooms = this.roomService.getInDevRooms();
        const rooms = normalRooms.concat(inDevRooms);
        this.organizeStructureBuilding(rooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeStructureBuilding(rooms: Room[]) {
    for (const room of rooms) {
      this.orderBuilder(room);
    }
  }

  private orderBuilder(room: Room) {
    const active = this.creepService.getCreeps(Role.Builder, null, room.name).length;
    const ordered = getCreepsInQueue(room, Role.Builder);
    const buildSites = room.getConstructionSites();

    const repairPoints = room
      .find(FIND_STRUCTURES, {
        filter: s => s.hits < s.hitsMax && s.structureType !== STRUCTURE_WALL && s.structureType !== STRUCTURE_RAMPART
      })
      .map(s => s.hitsMax - s.hits)
      .reduce((a, b) => a + b, 0);
    let max = Math.ceil(buildSites.length / 5);
    if (repairPoints > 100_000) {
      max += 1;
    }
    if (active + ordered < max) {
      const order = new Order();
      const maxTier = getMaxTierSimpleWorker(room.energyCapacityAvailable);
      order.body = getSimpleWorkerBody(maxTier);
      order.priority = Priority.Standard;
      order.memory = {
        role: Role.Builder,
        tier: maxTier
      };
      orderCreep(room, order);
    }
  }
}
