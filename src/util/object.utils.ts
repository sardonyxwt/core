export function deepFreeze<T>(obj: T): Readonly<T> {
    Object.getOwnPropertyNames(obj).forEach(function (key) {
        const prop = obj[key];
        if (typeof prop === 'object' && prop !== null) {
            deepFreeze(prop);
        }
    });
    return Object.freeze(obj);
}

export const saveToArray = <T>(
    array: T[],
    newEl: T,
    compareFn: (arrEl: T, newEl: T, index: number, arr: T[]) => boolean = (
        arrEl,
        newEl,
    ) => arrEl === newEl,
): T[] => {
    const oldElIndex = array.findIndex((arrEl, index, arr) =>
        compareFn(arrEl, newEl, index, arr),
    );
    if (oldElIndex === -1) {
        array.push(newEl);
        return array;
    }
    array[oldElIndex] = newEl;
    return array;
};

export const deleteFromArray = <T>(
    array: T[],
    compareFn: (arrEl: T, index: number, arr: T[]) => boolean,
): T[] => {
    const deleteElIndex = array.findIndex(compareFn);
    if (deleteElIndex === -1) {
        return array;
    }
    array.splice(deleteElIndex, 1);
    return array;
};
