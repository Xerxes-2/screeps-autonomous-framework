import { Priority } from 'enums/priority';
import { Role } from 'enums/role';
import { Manager } from 'managers/manager';
import * as Upgrader from 'roles/upgrader';
import { CreepService } from 'services/creep';
import { RoomService } from 'services/room';

/**
 * The `IdleManager` class orchestrates the idle activities and behaviors of the bot.
 *
 * This class should be utilized whenever you need to control and manage Idle creeps and their
 * associated tasks within the framework.
 */

export class IdleManager extends Manager {
  private roomService: RoomService;
  private creepService: CreepService;

  readonly MEMORY_LASTRUN = 'lastRun';

  constructor(creepService: CreepService) {
    super('IdleManager');
    this.creepService = creepService;
  }

  run(pri: Priority) {
    if (pri === Priority.Trivial) {
      let idleCreeps = this.creepService.getCreeps(null, null, null, false);
      idleCreeps = idleCreeps.filter(c => c.memory.role !== Role.Harvester);
      this.creepService.runCreeps(idleCreeps, Upgrader.run);
    }
  }
}
