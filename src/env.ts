interface Env {
    version: string;
}

export const env: Env = {
    version: process.env.VERSION,
};
