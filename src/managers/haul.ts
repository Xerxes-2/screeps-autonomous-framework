import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Porter from 'roles/hauler';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getHaulerBody, getMaxTierHauler } from 'utils/profile';

/**
 * The `PortManager` class orchestrates the energy transferring activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Porter creeps and their
 * associated tasks within the framework.
 */

export class HaulManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(roomService: RoomService, creepService: CreepService) {
    super('HauleManager');
    this.roomService = roomService;
    this.creepService = creepService;
  }

  public run(pri: Priority): void {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Hauler, Porter.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const rooms = this.roomService.getNormalRooms();
        this.organizeEnergyTransfer(rooms);
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  private organizeEnergyTransfer(rooms: Room[]): void {
    for (const room of rooms) {
      this.orderHauler(room);
    }
  }

  private orderHauler(room: Room): void {
    const active = this.creepService.getCreeps(Role.Hauler).length;
    const ordered = getCreepsInQueue(room, Role.Hauler);

    const rcl = room.controller?.level || 0;
    const max = rcl < 3 ? 1 : 2;

    if (active + ordered < max) {
      const order = new Order();
      const maxTier = getMaxTierHauler(room.energyCapacityAvailable);
      order.body = getHaulerBody(maxTier);
      order.priority = Priority.Standard;
      order.memory = {
        role: Role.Hauler,
        tier: maxTier
      };

      orderCreep(room, order);
    }
  }
}
