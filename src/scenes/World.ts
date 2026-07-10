import { EntityBase } from "../entities/EntityBase";

// The world's ground is conceptually an infinite plane at y = 0; not modeled as
// data here yet — that lands with physics/render implementation.
export class World
{
	private readonly entities: Map<string, EntityBase>;

	constructor()
	{
		this.entities = new Map();
	}

	addEntity(entity: EntityBase): void
	{
		if (this.entities.has(entity.id))
		{
			throw new Error(`World already has an entity with id "${entity.id}"`);
		}

		this.entities.set(entity.id, entity);
	}

	removeEntity(id: string): void
	{
		this.entities.delete(id);
	}

	getEntity(id: string): EntityBase | undefined
	{
		return this.entities.get(id);
	}

	getEntities(): EntityBase[]
	{
		return Array.from(this.entities.values());
	}
}
