/*
 * @Author: hy
 * @Date: 2019-03-11 17:24:07
 * @Last Modified by: hy
 * @Last Modified time: 2019-04-12 16:48:03
 */

// 动画执行器

import Easing from '../easing'

class Animator {
  constructor({
    start = 0, // 起始值
    end = 1000, // 结束值
    life = 1000, // 生命周期，毫秒
    easing = 'linear',  // 缓动函数
  }) {
    this._life = life
    this._end = end
    this._start = start
    this._running = true // 是否运行
    this._current = this._start // 当前运行到的值
    this._easing = easing

    if (Array.isArray(this._start)) {
      this._diffValue = this._start.map((s, i) => this._end[i] - s)
    } else {
      this._diffValue = this._end - this._start
    }
  }

  // 开始动画
  start() {
    this._startTime = new Date().getTime()
    this._loop()
  }

  // loop
  _loop() {
    if (this._running) {
      window.requestAnimationFrame(this._loop.bind(this))
      this._update()
    }
  }

  // 更新
  _update() {
    const currentTime = new Date().getTime()
    const execTime = (currentTime - this._startTime) / this._life
    const percent = Math.min(execTime, 1)
    if (percent === 1) {
      // 生命周期执行完毕
      this._running = false
    }
    // 让percent通过缓动函数执行
    const newPercent = Easing[this._easing](percent)
    // 根据返回的百分比值，计算走了多少
    if (Array.isArray(this._start)) {
      this._current = []

      this._start.forEach((s, index) => {
        this._current[index] = (this._diffValue[index] * newPercent) + s
        if (this._diffValue[index] < 0.001 && this._diffValue[index] > -0.001) {
          this._current[index] = this._end[index]
        }
      })
    } else {
      this._current = (this._diffValue * newPercent) + this._start
      if (this._diffValue < 0.001 && this._diffValue > -0.001) {
        this._current = this._end
      }
    }

    // 通知
    this._fire('frame', this._current)
  }

  // 每帧的更新通知
  _fire(eventType, value) {
    const newEventType = `on${eventType}`
    if (this[newEventType]) {
      this[newEventType](this._end, value)
    }
  }

  // stop
  stop() {
    this._running = false
  }
}


export default Animator

