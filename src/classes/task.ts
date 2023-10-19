import { Priority } from 'enums/priority';
import { Role } from 'enums/role';

/**
 * The `Task` class is used to represent a task that a creep should perform.
 */

export class Task {
  public priority: Priority;
  public bestRole: Role;
  public target: string;
  public homeroom: string;
}
