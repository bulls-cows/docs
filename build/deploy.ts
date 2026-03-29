import { rm } from "node:fs/promises";
import {
  joinPath,
  joinPosixPath,
  getSSHClient,
  sshConnect,
  sshPutFile,
  zipFolder,
  sshExecCommand,
  logInfo,
} from "nsuite";
import { parseEnvFiles, getDirname } from "nsuite";
import { DOMAIN } from "./constant";

const __dirname = getDirname(import.meta.url);
export const PATH_ROOT = joinPath(__dirname, "../");

parseEnvFiles([
  joinPath(PATH_ROOT, ".env.local"),
  joinPath(PATH_ROOT, "../aimian/.env"),
]);

// 环境变量
const SSH_HOST = process.env.SSH_HOST || "";
const SSH_PORT = Number(process.env.SSH_PORT);
const SSH_USERNAME = process.env.SSH_USERNAME || "";
const SSH_PASSWORD = process.env.SSH_PASSWORD || "";

// 远程目录路径
const cwd = `/www/sites/${DOMAIN}/public/`;

logInfo(`Deploying docs`);

// 错误处理包装函数
const handleAsyncError = async <T>(
  fn: () => Promise<T>,
  errorMessage: string,
): Promise<T | undefined> => {
  try {
    return await fn();
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
};

// 部署到服务器
const deployToServer = async () => {
  const ssh = getSSHClient();

  await handleAsyncError(
    () =>
      sshConnect({
        ssh,
        host: SSH_HOST,
        port: SSH_PORT,
        username: SSH_USERNAME,
        password: SSH_PASSWORD,
      }),
    "Failed to connect to server",
  );

  const execCommand = async (command: string): Promise<void> => {
    await handleAsyncError(
      () => sshExecCommand({ ssh, cwd, command }),
      `Failed to execute command: ${command}`,
    );
  };

  // dist 目录路径（VitePress 构建产物在 ./dist）
  const pathDist = joinPath(PATH_ROOT, "dist");
  const zipFileName = `dist.zip`;
  const pathDistZip = joinPath(PATH_ROOT, zipFileName);

  // 打包 dist 目录
  await handleAsyncError(
    () =>
      zipFolder({
        pathFolder: pathDist,
        pathOutputFile: pathDistZip,
      }),
    "Failed to create zip file",
  );

  // 上传 zip 文件到服务器
  const pathRemoteZip = joinPosixPath(cwd, "dist.zip");

  await handleAsyncError(
    () =>
      sshPutFile({
        ssh,
        localFile: pathDistZip,
        remoteFile: pathRemoteZip,
      }),
    "Failed to upload zip file to server",
  );

  // 在服务器上解压并清理
  await execCommand("unzip -o dist.zip");
  await execCommand("rm dist.zip");

  // 清理本地 zip 文件
  await handleAsyncError(() => rm(pathDistZip), "Failed to remove local zip file");

  console.log(`Deployed successfully to: ${cwd}`);
};

// 主执行流程
const main = async () => {
  await deployToServer();
  console.log(`Deployment completed for docs`);
  console.log(`Homepage: https://${DOMAIN}`);
  process.exit(0);
};

main().catch((err) => {
  console.error("Deployment failed:", err);
  process.exit(1);
});
