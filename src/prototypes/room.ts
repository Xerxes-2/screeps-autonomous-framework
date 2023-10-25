export {};

declare global {
  interface Room {
    /** Finds the first owned spawn in a room if available. */
    getMySpawn(): StructureSpawn | undefined;

    /** @private */
    _mySpawn?: StructureSpawn;

    /** Find the sinks for the source */
    getSourceSinks(source: Id<Source>): StructureContainer[];

    /** Find all sinks in room */
    getAllSinks(): StructureContainer[];

    /** @private */
    _sourceSinksMap?: { [source: Id<Source>]: StructureContainer[] };

    /** @private */
    _allSinks?: StructureContainer[];

    /** @private */
    _remoteRooms?: string[];

    /** Find all remote rooms */
    getRemoteRooms(): string[];

    _remoteSinks?: StructureContainer[];

    /** Find all remote sinks */
    getRemoteSinks(): StructureContainer[];

    /** @private */
    _storedEnergy?: number;

    /** Get stored energy */
    getStoredEnergy(): number;

    /** @private */
    _constructionSites?: ConstructionSite[];

    /** Get construction sites */
    getConstructionSites(): ConstructionSite[];

    /** @private */
    _containers?: StructureContainer[];

    /** Get all containers */
    getContainers(): StructureContainer[];

    /** @private */
    _nonSinkContainers?: StructureContainer[];

    /** Get all containers that are not sinks */
    getNonSinkContainers(): StructureContainer[];

    /** @private */
    _droppedEnergy?: Resource[];

    /** Get all dropped energy */
    getDroppedEnergy(): Resource[];

    /** Tell is the room in novice area */
    IsNovice(): boolean;
  }
}

Room.prototype.getMySpawn = function () {
  if (!this._mySpawn) {
    this._mySpawn = this.find(FIND_MY_SPAWNS)?.[0];
  }
  return this._mySpawn;
};

Room.prototype.getSourceSinks = function (sourceId: Id<Source>) {
  if (!this._sourceSinksMap) {
    this._sourceSinksMap = {};
  }
  if (!this._sourceSinksMap[sourceId]) {
    const source = Game.getObjectById(sourceId);
    if (!source) {
      return [];
    }
    this._sourceSinksMap[sourceId] = source.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
  }
  return this._sourceSinksMap[sourceId];
};

Room.prototype.getAllSinks = function () {
  if (!this._allSinks) {
    this._sourceSinksMap = {};
    for (const source of this.find(FIND_SOURCES)) {
      this.getSourceSinks(source.id);
    }
    this._allSinks = _.flatten(Object.values(this._sourceSinksMap));
  }
  return this._allSinks;
};

Room.prototype.getRemoteRooms = function () {
  if (!this._remoteRooms) {
    this._remoteRooms = [];
    for (const roomName of Object.values(Game.map.describeExits(this.name))) {
      if (roomName !== 'E5S38') this._remoteRooms.push(roomName);
    }
    // hard code remote rooms
    if (this.name === 'E5S37') {
      this._remoteRooms.push('E4S37');
    }
  }
  return this._remoteRooms;
};

Room.prototype.getRemoteSinks = function () {
  if (!this._remoteSinks) {
    this._remoteSinks = [];
    for (const roomName of this.getRemoteRooms()) {
      const room = Game.rooms[roomName];
      if (!room) {
        continue;
      }
      this._remoteSinks.push(...room.getAllSinks());
    }
  }
  return this._remoteSinks;
};

Room.prototype.getStoredEnergy = function () {
  if (!this._storedEnergy) {
    const drops = this.getDroppedEnergy();
    const containers = this.getContainers();
    const storage = this.storage;
    this._storedEnergy =
      _.sum(drops, d => d.amount) +
      _.sum(containers, c => c.store[RESOURCE_ENERGY]) +
      (storage ? storage.store[RESOURCE_ENERGY] : 0);
  }
  return this._storedEnergy;
};

Room.prototype.getConstructionSites = function () {
  if (!this._constructionSites) {
    this._constructionSites = this.find(FIND_MY_CONSTRUCTION_SITES);
  }
  return this._constructionSites;
};

Room.prototype.getContainers = function () {
  if (!this._containers) {
    this._containers = this.find(FIND_STRUCTURES, {
      filter: s => s.structureType === STRUCTURE_CONTAINER
    });
  }
  return this._containers;
};

Room.prototype.getNonSinkContainers = function () {
  if (!this._nonSinkContainers) {
    this._nonSinkContainers = this.getContainers().filter(c => !this.getAllSinks().includes(c));
  }
  return this._nonSinkContainers;
};

Room.prototype.getDroppedEnergy = function () {
  if (!this._droppedEnergy) {
    this._droppedEnergy = this.find(FIND_DROPPED_RESOURCES, {
      filter: r => r.resourceType === RESOURCE_ENERGY
    });
  }
  return this._droppedEnergy;
};

Room.prototype.IsNovice = function () {
  return Game.map.getRoomStatus(this.name).status === 'novice';
};
