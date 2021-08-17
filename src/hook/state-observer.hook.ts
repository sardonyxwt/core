import { useState, useEffect } from 'react';
import { reaction } from 'mobx';

/**
 * @type StateObserverHook
 * @description Creates state of stores and subscribe to changes.
 * @param transformer Creates state of stores and later used to subscribe to changes.
 * @param deps If present, effect will only activate if the values in the list change.
 * @returns {T} Transformed state of stores
 */
export type StateObserverHook = <T>(transformer: () => T, deps: unknown[]) => T;

export const useStateObserver: StateObserverHook = <T>(
    transformer: () => T,
    deps: [],
): T => {
    const [state, setState] = useState<T>(transformer);

    useEffect(
        () => reaction(transformer, (state) => state && setState(() => state)),
        deps,
    );

    return state;
};
