export {};

declare global {
  interface Room {
    /** Finds the first owned spawn in a room if available. */
    getMySpawn(): StructureSpawn | undefined;

    /** @private */
    _mySpawn?: StructureSpawn;

    /** Find the sinks for the source */
    getSourceTanks(source: Id<Source | Mineral>): (StructureContainer | StructureLink)[];

    /** Find all sinks in room */
    getAllTanks(): (StructureContainer | StructureLink)[];

    /** @private */
    _sourceTanksMap?: Record<Id<Source | Mineral>, (StructureContainer | StructureLink)[]>;

    /** @private */
    _allTanks?: (StructureContainer | StructureLink)[];

    /** @private */
    _remoteRooms?: string[];

    /** Find all remote rooms */
    getRemoteRooms(): string[];

    _remoteTanks?: StructureContainer[];

    /** Find all remote sinks */
    getRemoteTanks(): StructureContainer[];

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

    /** @private */
    _storageLink?: StructureLink | null;
    getStorageLink(): StructureLink | null;

    /** @private */
    _mineral?: Mineral | null;

    getMineral(): Mineral | null;
  }
}

Room.prototype.getMySpawn = function () {
  if (!this._mySpawn) {
    this._mySpawn = this.find(FIND_MY_SPAWNS)?.[0];
  }
  return this._mySpawn;
};

Room.prototype.getSourceTanks = function (sourceId: Id<Source | Mineral>) {
  if (!this._sourceTanksMap) {
    this._sourceTanksMap = {};
  }
  if (!this._sourceTanksMap[sourceId]) {
    const source = Game.getObjectById(sourceId);
    if (!source) {
      return [];
    }
    this._sourceTanksMap[sourceId] = source.pos.findInRange(FIND_STRUCTURES, 2, {
      filter: s => s.structureType === STRUCTURE_CONTAINER || s.structureType === STRUCTURE_LINK
    });
  }
  return this._sourceTanksMap[sourceId];
};

Room.prototype.getAllTanks = function () {
  if (!this._allTanks) {
    this._sourceTanksMap = {};
    for (const source of this.find(FIND_SOURCES)) {
      this.getSourceTanks(source.id);
    }
    const minerals = this.getMineral();
    if (minerals) {
      this.getSourceTanks(minerals.id);
    }
    this._allTanks = _.flatten(Object.values(this._sourceTanksMap));
  }
  return this._allTanks;
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

Room.prototype.getRemoteTanks = function () {
  if (!this._remoteTanks) {
    this._remoteTanks = [];
    for (const roomName of this.getRemoteRooms()) {
      const room = Game.rooms[roomName];
      if (!room) {
        continue;
      }
      this._remoteTanks.push(...(room.getAllTanks() as StructureContainer[]));
    }
  }
  return this._remoteTanks;
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
    this._nonSinkContainers = this.getContainers().filter(c => !this.getAllTanks().includes(c));
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

Room.prototype.getStorageLink = function () {
  if (this._storageLink === undefined) {
    this._storageLink = null;
    const storage = this.storage;
    if (storage) {
      const link = storage.pos.findInRange(FIND_STRUCTURES, 2, {
        filter: s => s.structureType === STRUCTURE_LINK
      })[0] as StructureLink | undefined;
      if (link) {
        this._storageLink = link;
      }
    }
  }
  return this._storageLink;
};

Room.prototype.getMineral = function () {
  if (this._mineral) {
    return this._mineral;
  }
  this._mineral = null;
  const mineral = this.find(FIND_MINERALS)[0];
  if (!mineral) {
    return this._mineral;
  }
  const extractor = mineral.pos.findInRange(FIND_STRUCTURES, 1, {
    filter: s => s.structureType === STRUCTURE_EXTRACTOR
  })[0] as StructureExtractor | undefined;
  if (extractor) {
    this._mineral = mineral;
  }
  return this._mineral;
};
