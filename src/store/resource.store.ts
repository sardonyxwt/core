import { observable, action, makeObservable } from 'mobx';
import { saveToArray } from '@source/util/object.utils';

/**
 * @interface ResourceId
 * @description ResourceId identify resource in store.
 */
export interface ResourceId {
    /**
     * @field key
     * @description Unique key in context.
     */
    readonly key: string;
    /**
     * @field context
     * @description Unique context in application.
     * Used to select loader for resource.
     */
    readonly context: string;
}

/**
 * @interface Resource
 * @description Resource instance in store.
 */
export interface Resource<T = unknown> {
    /**
     * @field id
     * @description Unique pair of key and context.
     */
    readonly id: ResourceId;
    /**
     * @field data
     * @description Resource data.
     */
    readonly data: T;
}

/**
 * @interface ResourceStoreState
 * @description Resource store state.
 */
export interface ResourceStoreState {
    readonly resources: Resource[];
}

/**
 * @interface ResourceStore
 * @description Store for resources.
 */
export interface ResourceStore extends ResourceStoreState {
    /**
     * @method setResources
     * @description Add or replace resources in store.
     * @param resources {Resource[]} Resources to be added or replaced.
     */
    setResources(resources: Resource[]): void;

    /**
     * @method findResourceById
     * @description Return resource with same id.
     * @param id {ResourceId} Id used to find resource in store.
     * @returns {Resource<T>}
     */
    findResourceById<T>(id: ResourceId): Resource<T>;

    /**
     * @method isResourceExist
     * @description Check is resource with same id present in store.
     * @param id {ResourceId} Id used to check resource present in store.
     * @returns {boolean}
     */
    isResourceExist(id: ResourceId): boolean;
}

/**
 * @class ResourceStoreImpl
 * @description Default realization of ResourceStore.
 * You can replace it after core instance created.
 */
export class ResourceStoreImpl implements ResourceStore {
    readonly resources: Resource[] = [];

    constructor(resources: Resource[] = []) {
        makeObservable(this, {
            resources: observable.shallow,
            setResources: action,
        });
        this.resources.push(...resources);
    }

    setResources(resources: Resource[]): void {
        resources.forEach((resource) =>
            saveToArray(this.resources, resource, (existResource) =>
                isResourcesIdsEqual(resource.id, existResource.id),
            ),
        );
    }

    findResourceById<T>(id: ResourceId): Resource<T> {
        return this.resources.find((resource) =>
            isResourcesIdsEqual(resource.id, id),
        ) as Resource<T>;
    }

    isResourceExist(id: ResourceId): boolean {
        return !!this.findResourceById(id);
    }
}

/**
 * @function isResourcesIdsEqual
 * @description Check is resources ids is equals.
 * @param resourceId1 {ResourceId} First resource id to check equals.
 * @param resourceId2 {ResourceId} Second resource id to check equals.
 * @returns {boolean}
 */
export function isResourcesIdsEqual(
    resourceId1: ResourceId,
    resourceId2: ResourceId,
): boolean {
    return (
        resourceId1.key === resourceId2.key &&
        resourceId1.context === resourceId2.context
    );
}
