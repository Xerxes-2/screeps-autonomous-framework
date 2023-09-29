import { Order } from 'classes/Order';
import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/_Manager';
import * as Builder from 'roles/Builder';
import { CreepService } from 'services/Creep';
import { RoomService } from 'services/Room';
import { getCreepsInQueue, orderCreep } from 'utils/order';
import { getMaxTierSimpleWorker, getSimpleWorkerBody } from 'utils/profile';

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
      this.creepService.runCreeps(Role.Builder, Builder.run);

      const lastRun = this.getValue(this.MEMORY_LASTRUN);
      if (!lastRun || lastRun + 20 < Game.time) {
        const rooms = this.roomService.getNormalRooms();
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
    const active = this.creepService.getCreeps(Role.Builder).length;
    const ordered = getCreepsInQueue(room, Role.Builder);

    if (active + ordered === 0) {
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
