import { observable, action, makeObservable } from 'mobx';
import { saveToArray } from '@source/util/object.utils';

/**
 * @interface ModuleId
 * @description ModuleId identify module in store.
 */
export interface ModuleId {
    /**
     * @field key
     * @description Unique key in context.
     */
    readonly key: string;
    /**
     * @field context
     * @description Unique context in application.
     * Used to select loader for module.
     */
    readonly context: string;
}

/**
 * @interface Module
 * @description Module instance in store.
 */
export interface Module<T = unknown> {
    /**
     * @field id
     * @description Unique pair of key and context.
     */
    readonly id: ModuleId;
    /**
     * @field data
     * @description Module data.
     */
    readonly body: T;
}

/**
 * @interface ModuleStoreState
 * @description Module store state.
 */
export interface ModuleStoreState {
    readonly modules: Module[];
}

/**
 * @interface ModuleStore
 * @description Store for modules.
 */
export interface ModuleStore extends ModuleStoreState {
    /**
     * @method setModules
     * @description Add or replace modules in store.
     * @param modules {Module[]} Modules to be added or replaced.
     */
    setModules(modules: Module[]): void;

    /**
     * @method findModuleById
     * @description Return module with same id.
     * @param id {ModuleId} Id used to find module in store.
     * @returns {Module<T>}
     */
    findModuleById<T>(id: ModuleId): Module<T>;

    /**
     * @method isModuleExist
     * @description Check is module with same id present in store.
     * @param id {ModuleId} Id used to check module present in store.
     * @returns {boolean}
     */
    isModuleExist(id: ModuleId): boolean;
}

/**
 * @class ModuleStoreImpl
 * @description Default realization of ModuleStore.
 * You can replace it after core instance created.
 */
export class ModuleStoreImpl implements ModuleStore {
    readonly modules: Module[] = [];

    constructor(modules: Module[] = []) {
        makeObservable(this, {
            modules: observable.shallow,
            setModules: action,
        });
        this.modules.push(...modules);
    }

    setModules(modules: Module[]): void {
        modules.forEach((module) =>
            saveToArray(this.modules, module, (existModule) =>
                isModulesIdsEqual(module.id, existModule.id),
            ),
        );
    }

    findModuleById<T>(id: ModuleId): Module<T> {
        return this.modules.find((module) =>
            isModulesIdsEqual(module.id, id),
        ) as Module<T>;
    }

    isModuleExist(id: ModuleId): boolean {
        return !!this.findModuleById(id);
    }
}

/**
 * @function isModulesIdsEqual
 * @description Check is modules ids is equals.
 * @param moduleId1 {ModuleId} First module id to check equals.
 * @param moduleId2 {ModuleId} Second module id to check equals.
 * @returns {boolean}
 */
export function isModulesIdsEqual(
    moduleId1: ModuleId,
    moduleId2: ModuleId,
): boolean {
    return (
        moduleId1.key === moduleId2.key &&
        moduleId1.context === moduleId2.context
    );
}
