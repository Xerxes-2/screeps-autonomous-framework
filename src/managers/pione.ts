import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Pioneer from 'roles/pioneer';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getMaxTierSimpleWorker, getSimpleWorkerBody } from 'utils/profile';

/**
 * The `PioneerManager` class orchestrates the pioneer-related activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Pioneer creeps and their
 * associated tasks within the framework.
 */

export class PioneerManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('PioneerManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Pioneer, Pioneer.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const rooms = this.roomService.getInDevRooms();
        this.organizePioneering(rooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizePioneering(rooms: Room[]) {
    for (const room of rooms) {
      this.orderPioneer(room);
    }
  }

  private orderPioneer(room: Room) {
    const spawnRoom = this.roomService.getNormalRooms()[0];
    const active = this.creepService.getCreeps(Role.Pioneer, room.name).length;
    const ordered = getCreepsInQueue(spawnRoom, Role.Pioneer, room.name);

    if (active + ordered < 3) {
      const order = new Order();
      const maxTier = getMaxTierSimpleWorker(spawnRoom.energyCapacityAvailable);
      order.body = getSimpleWorkerBody(maxTier);
      order.priority = Priority.Standard;
      order.memory = {
        tier: maxTier,
        role: Role.Pioneer,
        target: room.name
      };
      orderCreep(spawnRoom, order);
    }
  }
}
