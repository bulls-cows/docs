import { parseEnvFiles, getDirname, joinPath } from "nsuite";

const __dirname = getDirname(import.meta.url);
export const PATH_ROOT = joinPath(__dirname, "../");

parseEnvFiles([
    joinPath(PATH_ROOT, ".env.local"),
    joinPath(PATH_ROOT, "../aimian/.env"),
]);
