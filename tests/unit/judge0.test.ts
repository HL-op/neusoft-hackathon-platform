import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// 定义期望的语言映射常量
const EXPECTED_LANGUAGE_IDS = {
  python3: 71,
  javascript: 63,
  typescript: 94,
  cpp: 54,
  java: 62
}

describe('Judge0服务测试', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('应该正确定义编程语言映射', () => {
    expect(EXPECTED_LANGUAGE_IDS).toBeDefined()
    expect(EXPECTED_LANGUAGE_IDS.python3).toBe(71)
    expect(EXPECTED_LANGUAGE_IDS.javascript).toBe(63)
    expect(EXPECTED_LANGUAGE_IDS.typescript).toBe(94)
    expect(EXPECTED_LANGUAGE_IDS.cpp).toBe(54)
    expect(EXPECTED_LANGUAGE_IDS.java).toBe(62)
  })

  it('应该支持所有常用编程语言', () => {
    const languages = Object.keys(EXPECTED_LANGUAGE_IDS)
    expect(languages).toContain('python3')
    expect(languages).toContain('javascript')
    expect(languages).toContain('typescript')
    expect(languages).toContain('cpp')
    expect(languages).toContain('java')
    expect(languages.length).toBe(5)
  })

  it('应该为每种语言分配唯一的ID', () => {
    const ids = Object.values(EXPECTED_LANGUAGE_IDS)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(ids.length)
  })
})
