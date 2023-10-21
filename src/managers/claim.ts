import { Order } from 'classes/order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Claimer from 'roles/claimer';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getClaimerBody, getMaxTierClaimer } from 'utils/profile';

/**
 * The `ClaimManager` class orchestrates the claiming of new rooms.
 *
 * This class should be utilized whenever you need to claim a new room.
 */

export class ClaimManager extends Manager {
  private creepService: CreepService;
  private roomService: RoomService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(creepService: CreepService, roomService: RoomService) {
    super('ClaimManager');
    this.creepService = creepService;
    this.roomService = roomService;
  }

  public run(pri: Priority) {
    if (pri === Priority.Low) {
      this.creepService.runCreepRoles(Role.Claimer, Claimer.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        this.organizeClaiming();
        this.setValue(this.MEMORY_LASTRUN, Game.time);
      }
    }
  }

  readonly claimList = ['E7S36'];

  private organizeClaiming() {
    for (const roomName of this.claimList) {
      if (Game.rooms[roomName]) {
        continue;
      }
      this.orderClaimer(roomName);
    }
  }

  private orderClaimer(roomName: string) {
    const spawn = Game.spawns.Spawn1;
    if (!spawn) {
      return;
    }

    const active = this.creepService.getCreeps(Role.Claimer, roomName).length;
    const ordered = getCreepsInQueue(spawn.room, Role.Claimer, roomName);
    if (active + ordered > 0) {
      return;
    }

    const maxTier = getMaxTierClaimer(spawn.room.energyCapacityAvailable);
    const body = getClaimerBody(maxTier);
    const order = new Order();
    order.body = body;
    order.priority = Priority.Standard;
    order.memory = {
      tier: maxTier,
      role: Role.Claimer,
      target: roomName
    };
    orderCreep(spawn.room, order);
  }
}
