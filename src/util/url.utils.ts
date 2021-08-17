export type UrlOptions = {
    queryParams?: { [key: string]: string | number };
    pathParams?: { [key: string]: string | number };
};

/**
 * @function buildUrl
 * @description Build url for react router or ajax.
 * @example "/client/:project/:id?" => "/client/test/1001?token=TOKEN&time=100000"
 * @param endpoint {string} Url template.
 * @param options {UrlOptions} options to build url.
 * @returns {string}
 */
export function buildUrl(endpoint: string, options: UrlOptions = {}): string {
    let url = endpoint;
    const { queryParams, pathParams } = options;
    if (pathParams) {
        // TODO update logic and add exception
        Object.getOwnPropertyNames(pathParams).forEach((key) => {
            url = url.replace(
                new RegExp(`({${key}})|(:${key}\?)|(:${key})`, 'g'),
                `${pathParams[key]}`,
            );
        });
    }
    url.replace(new RegExp('({.*})|(:.*?\\/)', 'g'), '');
    if (queryParams) {
        const queryUrl = Object.getOwnPropertyNames(queryParams)
            .map(
                (key) =>
                    `${encodeURIComponent(key)}=${encodeURIComponent(
                        `${queryParams[key]}`,
                    )}`,
            )
            .join('&');
        if (queryUrl) url += `?${queryUrl}`;
    }
    return url;
}
