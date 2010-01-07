import os, time
from subprocess import call

latestModified = 0
previousDirList = []

while True:
  currentLatestModified = 0
  dirList=os.listdir("src")
  for fname in dirList:
    (mode, ino, dev, nlink, uid, gid, size, atime, mtime, ctime) = os.stat("src/" + fname)
    currentLatestModified = max(currentLatestModified, mtime)

  time.sleep(0.5)

  if currentLatestModified > latestModified or dirList != previousDirList:
    latestModified = currentLatestModified
    previousDirList = dirList
    call(["ant", "deploy"])

