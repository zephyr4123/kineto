// 某个进程是否已经退出：kill(pid, 0) 只探测、不发信号。
// 只有 ESRCH 才说明进程不在了；EPERM 是别的用户的活进程，和 lock.ts 的判据一致
import { isNodeError } from "./errors.ts";

export function processGone(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return false;
  } catch (err) {
    return isNodeError(err, "ESRCH");
  }
}
