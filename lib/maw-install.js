/**
 * maw 运行时依赖的检测与安装。
 *
 * maw 是插件的背景依赖：插件本身不打包二进制（18MB、分平台），而是在需要时
 * 按平台下载官方 release、校验 sha256、装到用户目录。
 *
 * 三条原则：
 *  1) 检测永远安全 —— 只读 PATH 与常见安装位置，不联网。
 *  2) 安装必须显式 —— 下载并执行外部二进制，只在用户点击或 agent 明确调用时发生。
 *  3) 安装可验证 —— 有 checksums.txt 就校验，装完再跑一次 `maw --version` 自证。
 */

import { execFile, execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { join } from 'node:path'

/** maw 的官方仓库。 */
export const MAW_REPO = 'kiwh77/maw'

/** maw 不在 PATH 时的候选安装位置。 */
const FALLBACK_PATHS = [
  join(homedir(), '.local', 'bin', 'maw'),
  '/opt/homebrew/bin/maw',
  '/usr/local/bin/maw',
  join(homedir(), 'go', 'bin', 'maw'),
]

/**
 * 平台与架构 → release 资产名里的平台段。
 * @param {string} [platform]
 * @param {string} [arch]
 * @returns {{os: string, cpu: string, ext: 'tar.gz'|'zip'}|null}
 */
export function releaseTarget(platform = process.platform, arch = process.arch) {
  const os = platform === 'darwin' ? 'darwin' : platform === 'linux' ? 'linux' : platform === 'win32' ? 'windows' : null
  const cpu = arch === 'arm64' ? 'arm64' : (arch === 'x64' || arch === 'amd64') ? 'amd64' : null
  if (os === null || cpu === null) return null
  return { os, cpu, ext: os === 'windows' ? 'zip' : 'tar.gz' }
}

/**
 * 计算 release 资产的下载地址与校验地址。
 * @param {string} version 形如 `v0.5.0`。
 * @param {{os: string, cpu: string, ext: string}} target
 * @returns {{asset: string, url: string, checksums: string, binary: string}}
 */
export function releaseUrls(version, target) {
  const bare = version.replace(/^v/u, '')
  const asset = `maw_${bare}_${target.os}_${target.cpu}.${target.ext}`
  const base = `https://github.com/${MAW_REPO}/releases/download/${version}`
  return {
    asset,
    url: `${base}/${asset}`,
    checksums: `${base}/checksums.txt`,
    binary: target.os === 'windows' ? 'maw.exe' : 'maw',
  }
}

/**
 * 检测本机 maw。
 * @param {string} [explicit] 配置里显式指定的路径。
 * @param {{only?: boolean}} [options] only：只验 explicit 这一个路径，不回退。
 *   安装后的自证要用它 —— 否则目标文件跑不起来时，回退会读到别处的旧 maw，
 *   把那个版本号当成「安装成功」报出来。
 * @returns {{found: boolean, path: string, version: string, source: string}}
 */
export function detectMaw(explicit, options = {}) {
  const candidates = []
  if (typeof explicit === 'string' && explicit !== '') candidates.push({ path: explicit, source: 'config' })
  if (options.only !== true) {
    for (const path of FALLBACK_PATHS) candidates.push({ path, source: 'common' })
    candidates.push({ path: 'maw', source: 'path' })
  }

  for (const candidate of candidates) {
    if (candidate.path !== 'maw' && !existsSync(candidate.path)) continue
    try {
      const out = execFileSync(candidate.path, ['--version'], { encoding: 'utf8', timeout: 10000, stdio: ['ignore', 'pipe', 'ignore'] })
      const version = (out.match(/version\s+(\S+)/iu)?.[1] ?? out.trim().split(/\s+/u).pop() ?? '').trim()
      return { found: true, path: candidate.path, version, source: candidate.source }
    } catch {
      // 该候选不可执行，继续下一个。
    }
  }
  return { found: false, path: '', version: '', source: 'none' }
}

/**
 * 把版本号解析成可比较的段。
 *
 * maw 的版本有两种形态：release 的 `v0.5.0`，以及本地 dev 构建的
 * `0.5.0-dev` / `0.4.1-darwin-arm64` 这类带后缀的串。后者比较时只看数字段，
 * 后缀（dev/rc 等）不参与大小判定 —— 这里要回答的是「要不要升」，不是
 * 严格语义化排序。
 * @param {string} value
 * @returns {{core: number[], prerelease: boolean}}
 */
export function parseVersion(value) {
  const text = String(value ?? '').trim().replace(/^v/iu, '')
  const match = text.match(/^(\d+(?:\.\d+)*)(?:[-+](.*))?$/u)
  if (match === null) return { core: [], prerelease: false }
  return {
    core: match[1].split('.').map(part => Number(part)),
    prerelease: typeof match[2] === 'string' && match[2] !== '',
  }
}

/**
 * 比较两个 maw 版本。
 *
 * 只比数字骨架：`0.5.0` 与 `v0.5.0` 相等，`0.5.0-dev` 与 `0.5.0` 视为同一个
 * 主次修订号（dev 构建不触发升级建议，免得把用户从 release 拽回开发版）。
 * @param {string} left
 * @param {string} right
 * @returns {number} left<right 为负，相等为 0，left>right 为正；任一侧解析不出时也给 0
 */
export function compareVersions(left, right) {
  const a = parseVersion(left)
  const b = parseVersion(right)
  if (a.core.length === 0 || b.core.length === 0) return 0
  const length = Math.max(a.core.length, b.core.length)
  for (let index = 0; index < length; index += 1) {
    const diff = (a.core[index] ?? 0) - (b.core[index] ?? 0)
    if (diff !== 0) return diff
  }
  return 0
}

/**
 * 判断当前装的 maw 是否落后于最新 release。
 *
 * 只回答「落后/持平/领先」，不发下载请求 —— 调用方自己决定要不要动。
 * @param {string} current 已安装版本（`maw --version` 读到的）
 * @param {string} latest 最新 release tag
 * @returns {'outdated'|'current'|'unknown'|'ahead'}
 */
export function versionStatus(current, latest) {
  if (current === '' || latest === '') return 'unknown'
  // 解析不出主版本号（脏输出、自定义构建的怪名字）时不判「已是最新」，
  // 否则一个读不懂的版本号会被显示成「无需升级」，把真升级挡在外面。
  if (parseVersion(current).core.length === 0 || parseVersion(latest).core.length === 0) return 'unknown'
  const diff = compareVersions(current, latest)
  if (diff < 0) return 'outdated'
  if (diff > 0) return 'ahead'
  return 'current'
}

/**
 * 取最新 release 的 tag。
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ok: true, tag: string} | {ok: false, error: string}>}
 */
export async function latestReleaseTag(signal) {
  try {
    const response = await fetch(`https://api.github.com/repos/${MAW_REPO}/releases/latest`, {
      headers: { accept: 'application/vnd.github+json', 'user-agent': 'dsh-maw' },
      signal,
    })
    if (!response.ok) return { ok: false, error: `GitHub API ${response.status}` }
    const body = await response.json()
    const tag = typeof body?.tag_name === 'string' ? body.tag_name : ''
    if (tag === '') return { ok: false, error: 'release 里没有 tag_name' }
    return { ok: true, tag }
  } catch (error) {
    return { ok: false, error: String(error?.message ?? error) }
  }
}

/**
 * 下载一个 URL 到文件。
 * @param {string} url
 * @param {string} file
 * @param {AbortSignal} [signal]
 * @returns {Promise<{ok: true, bytes: number} | {ok: false, error: string}>}
 */
async function download(url, file, signal) {
  try {
    const response = await fetch(url, { redirect: 'follow', signal, headers: { 'user-agent': 'dsh-maw' } })
    if (!response.ok) return { ok: false, error: `下载失败 HTTP ${response.status}：${url}` }
    const buffer = Buffer.from(await response.arrayBuffer())
    writeFileSync(file, buffer)
    return { ok: true, bytes: buffer.byteLength }
  } catch (error) {
    return { ok: false, error: String(error?.message ?? error) }
  }
}

/**
 * 从 checksums.txt 里取某个文件的 sha256。
 * @param {string} text
 * @param {string} asset
 * @returns {string}
 */
export function checksumFor(text, asset) {
  for (const line of String(text ?? '').split(/\r?\n/u)) {
    const match = line.trim().match(/^([0-9a-f]{64})\s+\*?(.+)$/iu)
    if (match !== null && match[2].trim() === asset) return match[1].toLowerCase()
  }
  return ''
}

/**
 * 校验文件 sha256。
 * @param {string} file
 * @returns {string}
 */
export function sha256File(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/**
 * 解包并取出可执行文件。
 * @param {string} archive
 * @param {string} dir 解包目录。
 * @param {string} binary 归档内文件名。
 * @param {string} ext
 * @returns {{ok: true, path: string} | {ok: false, error: string}}
 */
function extractBinary(archive, dir, binary, ext) {
  try {
    // 归档里的文件名不固定（官方包内是 maw_<ver>_<os>_<arch>，没有扩展名），
    // 所以先列清单再挑：优先精确名，其次以 maw 开头的那个。
    const listing = execFileSync('tar', ['-tf', archive], { encoding: 'utf8', timeout: 60000 })
    const entries = listing.split(/\r?\n/u).map(line => line.trim()).filter(line => line !== '' && !line.endsWith('/'))
    if (entries.length === 0) return { ok: false, error: `归档是空的（${ext}）` }
    const member = entries.find(entry => entry === binary || entry.endsWith(`/${binary}`))
      ?? entries.find(entry => /(^|\/)maw(\.exe)?$/u.test(entry))
      ?? entries.find(entry => /(^|\/)maw/u.test(entry))
      ?? (entries.length === 1 ? entries[0] : undefined)
    if (member === undefined) return { ok: false, error: `归档里找不到可执行文件，成员：${entries.slice(0, 5).join(', ')}` }

    // macOS / Linux 自带 bsdtar，Windows 10+ 的 tar 也能解 zip。
    execFileSync('tar', ['-xf', archive, '-C', dir, member], { timeout: 60000, stdio: 'ignore' })
    const extracted = join(dir, member)
    if (!existsSync(extracted)) return { ok: false, error: `解包后找不到 ${member}` }

    // 统一改名为目标二进制名，后续流程不关心归档里的名字。
    const path = join(dir, binary)
    if (extracted !== path) renameSync(extracted, path)
    return { ok: true, path }
  } catch (error) {
    return { ok: false, error: `解包失败：${String(error?.message ?? error)}` }
  }
}

/**
 * 安装 maw。
 *
 * 顺序：解析版本 → 下载资产 → 校验 sha256 → 解包 → 装到目标目录 → 跑 --version 自证。
 * @param {object} [options]
 * @param {string} [options.version] 指定 tag；空则取最新 release。
 * @param {string} [options.dir] 安装目录；默认 ~/.local/bin。
 * @param {AbortSignal} [options.signal]
 * @param {(line: string) => void} [options.log] 进度回调。
 * @returns {Promise<{ok: true, path: string, version: string, tag: string} | {ok: false, error: string}>}
 */
export async function installMaw(options = {}) {
  const { signal, log = () => {} } = options
  const dir = options.dir !== undefined && options.dir !== '' ? options.dir : join(homedir(), '.local', 'bin')

  const target = releaseTarget()
  if (target === null) {
    return { ok: false, error: `不支持的平台：${process.platform}/${process.arch}（可用 go install ${MAW_REPO}/cmd/maw@latest）` }
  }

  let tag = typeof options.version === 'string' ? options.version.trim() : ''
  if (tag === '' || tag === 'latest') {
    log('查询最新 release…')
    const latest = await latestReleaseTag(signal)
    if (!latest.ok) return { ok: false, error: `查不到最新版本：${latest.error}` }
    tag = latest.tag
  }

  const urls = releaseUrls(tag, target)
  log(`下载 ${urls.asset}…`)

  const work = mkdtempSync(join(tmpdir(), 'dsh-maw-install-'))
  const archive = join(work, urls.asset)
  try {
    const downloaded = await download(urls.url, archive, signal)
    if (!downloaded.ok) return { ok: false, error: downloaded.error }

    log('校验 sha256…')
    const sums = await download(urls.checksums, join(work, 'checksums.txt'), signal)
    let expected = ''
    if (sums.ok) {
      expected = checksumFor(readFileSync(join(work, 'checksums.txt'), 'utf8'), urls.asset)
    }
    if (expected === '') {
      // 没有校验和就拒绝安装：宁可让用户手工装，也不装一个无法验证的二进制。
      return { ok: false, error: `取不到 ${urls.asset} 的 sha256，已中止安装` }
    }
    const actual = sha256File(archive)
    if (actual !== expected) {
      return { ok: false, error: `sha256 不匹配（期望 ${expected}，实际 ${actual}），已中止安装` }
    }

    log('解包…')
    const extracted = extractBinary(archive, work, urls.binary, target.ext)
    if (!extracted.ok) return { ok: false, error: extracted.error }

    mkdirSync(dir, { recursive: true })
    const destination = join(dir, urls.binary)
    // 必须「先写新文件再原子 rename」，不能原地覆盖。
    // macOS 上原地覆盖一个正在被内核缓存过的可执行文件，会留下失效的代码签名
    // 缓存，之后每次执行都是 `Killed: 9`（换到新 inode 立刻正常）。
    // rename 产生新 inode，正好避开这个问题。
    const staging = `${destination}.new-${process.pid}`
    writeFileSync(staging, readFileSync(extracted.path))
    chmodSync(staging, 0o755)
    renameSync(staging, destination)

    log('验证安装…')
    // 只认目标文件本身：detectMaw 会回退到 PATH 与其他常见位置，
    // 若目标跑不起来而别处有个旧 maw，它会把那个旧版本号当成安装结果报出来。
    const check = detectMaw(destination, { only: destination })
    if (!check.found) return { ok: false, error: `装到 ${destination} 但跑不起来` }
    log(`已安装 ${check.version} → ${destination}`)
    return { ok: true, path: destination, version: check.version, tag }
  } finally {
    try {
      rmSync(work, { recursive: true, force: true })
    } catch {
      // 临时目录清不掉不影响安装结果。
    }
  }
}

/**
 * 用 go install 作为备选路径（需要 Go 工具链与网络）。
 * @param {object} [options]
 * @param {string} [options.version]
 * @param {string} [options.dir]
 * @returns {Promise<{ok: true, path: string, version: string} | {ok: false, error: string}>}
 */
export async function installMawWithGo(options = {}) {
  const dir = options.dir !== undefined && options.dir !== '' ? options.dir : join(homedir(), '.local', 'bin')
  const version = typeof options.version === 'string' && options.version !== '' && options.version !== 'latest'
    ? options.version
    : 'latest'
  return new Promise(resolve => {
    execFile('go', ['install', `${MAW_REPO}/cmd/maw@${version}`], {
      timeout: 300000,
      env: { ...process.env, GOBIN: dir },
    }, (error, _stdout, stderr) => {
      if (error !== null && error !== undefined) {
        resolve({ ok: false, error: `go install 失败：${(stderr || error.message || '').trim().slice(0, 400)}` })
        return
      }
      const check = detectMaw(join(dir, 'maw'))
      resolve(check.found
        ? { ok: true, path: join(dir, 'maw'), version: check.version }
        : { ok: false, error: 'go install 结束但找不到可执行文件' })
    })
  })
}
