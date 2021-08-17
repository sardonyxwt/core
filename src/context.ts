import Container from 'bottlejs';
import { Eventbus, createEventBus } from './eventbus';

/**
 * @interface Context
 * @description Root of core.
 * Contains ioc container and event bus.
 */
export interface Context {
    readonly bottle: Container;
    readonly eventBus: Eventbus;
}

export const createContext = (
    name: string,
    bottle: Container = new Container(name),
): Context => {
    return Object.freeze({
        bottle,
        eventBus: createEventBus({ name }),
    });
};
