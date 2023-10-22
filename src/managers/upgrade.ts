import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Upgrader from 'roles/upgrader';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getHeavyWorkerBody, getMaxTierHeavyWorker } from 'utils/profile';

/**
 * The `UpgradeManager` class orchestrates the controller upgrading activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Upgrader creeps and their
 * associated tasks within the framework.
 */

export class UpgradeManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('UpgradeManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  run(pri: Priority) {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Upgrader, Upgrader.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const normalRooms = this.roomService.getNormalRooms();
        const inDevRooms = this.roomService.getInDevRooms();
        const rooms = normalRooms.concat(inDevRooms);
        this.organizeControllerUpgrading(rooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeControllerUpgrading(rooms: Room[]) {
    for (const room of rooms) {
      if (!room.controller) {
        continue;
      }
      this.orderUpgrader(room.controller);
    }
  }

  private orderUpgrader(controller: StructureController) {
    const room = controller.room;
    const active = this.creepService.getCreeps(Role.Upgrader, controller.id).length;
    const ordered = getCreepsInQueue(controller.room, Role.Upgrader, controller.id);

    let maxUpgraderCount = 1;
    const containers = room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    }).length;
    const containersFree = room.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER && s.store.getFreeCapacity(RESOURCE_ENERGY) > 0
    }).length;
    if (!containersFree && !room.storage && containers > 0) {
      maxUpgraderCount = Math.min(active + 1, 5);
    }
    if (active + ordered < maxUpgraderCount) {
      const order = new Order();
      const maxTier = getMaxTierHeavyWorker(room.energyCapacityAvailable);
      order.body = getHeavyWorkerBody(maxTier);
      order.priority = Priority.Standard;
      order.memory = {
        role: Role.Upgrader,
        target: controller.id,
        tier: maxTier
      };
      orderCreep(controller.room, order);
    }
  }
}
