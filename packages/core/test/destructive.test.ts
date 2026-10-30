import { describe, expect, test } from "bun:test"
import { Destructive } from "@xudu/core/permission/destructive"

describe("Destructive.match", () => {
  const destructive = [
    "rm -rf build",
    "rm -r dist",
    "rm -fr /tmp/x",
    "rm -v -R node_modules",
    "rm --recursive old",
    "sudo rm -rf /var/www",
    "FOO=1 rm -rf out",
    "git push --force",
    "git push -f origin main",
    "git push origin +main",
    "git push --force-with-lease origin feature",
    "git reset --hard HEAD~3",
    "git clean -fd",
    "git branch -D feature",
    "git checkout -- .",
    "git restore src/app.ts",
    "git stash drop",
    "git stash clear",
    "dd if=/dev/zero of=/dev/sda",
    "mkfs.ext4 /dev/sdb1",
    "docker system prune -a",
    "docker volume rm data",
    "docker rm -f web",
    "kubectl delete pod api-1",
    "truncate -s 0 app.log",
  ]
  const harmless = [
    "rm build/old.txt",
    "rm -f cache.tmp",
    "ls -rf",
    "git push origin main",
    "git push --follow-tags",
    "git reset HEAD file.ts",
    "git reset --soft HEAD~1",
    "git clean -n",
    "git branch -d merged-feature",
    "git checkout main",
    "git checkout -b feature",
    "git restore --staged src/app.ts",
    "git stash list",
    "git stash pop",
    "docker ps -a",
    "docker rm web",
    "kubectl get pods",
    "echo rm -rf build",
    "grep -r 'reset --hard' docs",
  ]
  for (const command of destructive) test(`flags: ${command}`, () => expect(Destructive.match(command)).toBeDefined())
  for (const command of harmless) test(`allows: ${command}`, () => expect(Destructive.match(command)).toBeUndefined())
})
