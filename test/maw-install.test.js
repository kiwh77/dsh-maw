/**
 * maw-install.js 的单元测试：平台选择、地址拼装、校验和解析、检测。
 *
 * 真正的下载安装不在单测里跑（要联网、要写用户目录），
 * 只在 maw 存在时验证检测能读到版本。
 */

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

import {
  MAW_REPO, releaseTarget, releaseUrls, checksumFor, sha256File, detectMaw,
} from '../lib/maw-install.js'

test('平台与架构映射到 release 资产段', () => {
  assert.deepEqual(releaseTarget('darwin', 'arm64'), { os: 'darwin', cpu: 'arm64', ext: 'tar.gz' })
  assert.deepEqual(releaseTarget('darwin', 'x64'), { os: 'darwin', cpu: 'amd64', ext: 'tar.gz' })
  assert.deepEqual(releaseTarget('linux', 'x64'), { os: 'linux', cpu: 'amd64', ext: 'tar.gz' })
  assert.deepEqual(releaseTarget('win32', 'arm64'), { os: 'windows', cpu: 'arm64', ext: 'zip' })
})

test('不支持的平台返回 null', () => {
  assert.equal(releaseTarget('freebsd', 'x64'), null)
  assert.equal(releaseTarget('darwin', 'ia32'), null)
})

test('地址拼装与官方发布结构一致', () => {
  const urls = releaseUrls('v0.4.0', releaseTarget('darwin', 'arm64'))
  assert.equal(urls.asset, 'maw_0.4.0_darwin_arm64.tar.gz')
  assert.equal(urls.url, `https://github.com/${MAW_REPO}/releases/download/v0.4.0/maw_0.4.0_darwin_arm64.tar.gz`)
  assert.ok(urls.checksums.endsWith('/v0.4.0/checksums.txt'))
  assert.equal(urls.binary, 'maw')
})

test('版本号带不带 v 都能拼对', () => {
  assert.equal(releaseUrls('0.4.0', releaseTarget('linux', 'x64')).asset, 'maw_0.4.0_linux_amd64.tar.gz')
})

test('Windows 用 zip 且二进制带扩展名', () => {
  const urls = releaseUrls('v0.4.0', releaseTarget('win32', 'x64'))
  assert.ok(urls.asset.endsWith('.zip'))
  assert.equal(urls.binary, 'maw.exe')
})

test('checksums.txt 解析', () => {
  const text = [
    'db7952c2255316600812c5861e68b620623b987e6fccb6c196e27087947c7e59  maw_0.4.0_darwin_amd64.tar.gz',
    '265fc5cc0c09f4007856be769efeb53717df9ed6f5a6f44e1b86238f9065be1a *maw_0.4.0_darwin_arm64.tar.gz',
    '',
  ].join('\n')
  assert.equal(
    checksumFor(text, 'maw_0.4.0_darwin_arm64.tar.gz'),
    '265fc5cc0c09f4007856be769efeb53717df9ed6f5a6f44e1b86238f9065be1a',
  )
  assert.equal(checksumFor(text, 'missing.tar.gz'), '')
  assert.equal(checksumFor('', 'x'), '')
})

test('sha256File 与 Node 自带实现一致', () => {
  const file = join(tmpdir(), `dsh-maw-sha-${process.pid}.bin`)
  writeFileSync(file, 'maw')
  assert.equal(sha256File(file), createHash('sha256').update('maw').digest('hex'))
})

test('检测：显式路径优先，跑不起来就当没找到', () => {
  const found = detectMaw()
  if (found.found) {
    assert.ok(found.version !== '', '应读到版本号')
    assert.ok(found.path !== '')
  }
  // 指向一个不存在的路径时，应回退到常见位置而不是直接报错。
  const withBogus = detectMaw('/nonexistent/maw')
  assert.equal(typeof withBogus.found, 'boolean')
})
