import { useEffect, useState } from 'react';

/**
 * @type ReadyHook
 * @description Check is all deps ready and return ready status.
 * @param deps support any types.
 * @returns {boolean} Ready status of deps
 */
export type ReadyHook = (deps: unknown[]) => boolean;

export const useReady: ReadyHook = (deps: unknown[]): boolean => {
    const checkSyncDeps = (deps: unknown[]) => {
        if (!!deps.find((dep) => dep instanceof Promise)) {
            return false;
        }

        let isReady = true;

        for (let i = 0; i < deps.length; i++) {
            const arg = deps[i];
            if (arg === false || arg === undefined) {
                isReady = false;
                break;
            }
        }

        return isReady;
    };

    const [isReady, setIsReady] = useState(checkSyncDeps(deps));

    useEffect(() => {
        const promises: Promise<unknown>[] = [];
        const args: unknown[] = [];

        deps.forEach((dep) => {
            if (dep instanceof Promise) {
                promises.push(dep);
            } else {
                args.push(dep);
            }
        });

        const isReady = checkSyncDeps(args);

        if (promises.length === 0) {
            setIsReady(isReady);
            return;
        }

        setIsReady(false);

        Promise.all(promises).then(() => setIsReady(true));
    }, deps);

    return isReady;
};
