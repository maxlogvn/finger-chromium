import { describe, it, expect, vi } from 'vitest'
import { sleep, createTimer, withTimeout, TimeoutError } from '@src/common/timer'

describe('sleep', () => {
  it('chờ đủ đúng thời gian chỉ định', async () => {
    const start = Date.now()
    await sleep(50)
    expect(Date.now() - start).toBeGreaterThanOrEqual(45)
  })

  it('trả về ngay lập tức với ms = 0', async () => {
    const start = Date.now()
    await sleep(0)
    expect(Date.now() - start).toBeLessThan(50)
  })
})

describe('createTimer', () => {
  it('tạo timer và resolve sau thời gian chỉ định', async () => {
    const timer = createTimer(50)
    await expect(timer.promise).resolves.toBeUndefined()
  })

  it('có thể hủy timer trước khi nó fire', async () => {
    const timer = createTimer(100)
    timer.clear()
    const spy = vi.fn()
    timer.promise.then(spy)
    await sleep(150)
    expect(spy).not.toHaveBeenCalled()
  })

  it('gọi clear nhiều lần không gây lỗi', () => {
    const timer = createTimer(100)
    timer.clear()
    timer.clear()
  })
})

describe('withTimeout', () => {
  it('trả về kết quả nếu promise hoàn thành trước timeout', async () => {
    const result = await withTimeout(Promise.resolve('ok'), 100)
    expect(result).toBe('ok')
  })

  it('ném TimeoutError nếu promise vượt quá timeout', async () => {
    const slow = new Promise(resolve => { /* never resolves */ })
    await expect(withTimeout(slow, 50)).rejects.toThrow(TimeoutError)
  })

  it('sử dụng message tùy chỉnh trong TimeoutError', async () => {
    const slow = new Promise(resolve => { /* never resolves */ })
    await expect(withTimeout(slow, 50, 'Quá thời gian')).rejects.toThrow('Quá thời gian')
  })

})
