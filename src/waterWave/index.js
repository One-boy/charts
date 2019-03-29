/*
 * @Author: hy
 * @Date: 2019-03-11 17:21:58
 * @Last Modified by: hy
 * @Last Modified time: 2019-03-29 10:45:37
 */


// 活动图的实现

import Animator from '../lib/animator'

class WaterChart {
  constructor(domId) {
    // 图表的容器
    if (domId instanceof HTMLElement) {
      this.containerDom = domId
    } else {
      this.containerDom = document.getElementById(domId)
    }

    if (!(this.containerDom instanceof HTMLElement)) {
      throw new TypeError(`${domId} is not a valid dom Id !`)
    }

    const devicePixelRatio = window.devicePixelRatio || 1
    // const boundingRect = this.containerDom.getBoundingClientRect()
    const boundingRect = {
      width: this.containerDom.offsetWidth,
      height: this.containerDom.offsetHeight,
    }

    this.width = boundingRect.width * devicePixelRatio
    this.height = boundingRect.height * devicePixelRatio

    // 创建canvas
    this.canvas = document.createElement('canvas')
    this.containerDom.appendChild(this.canvas)

    // canvas的宽高
    this.canvas.width = this.width
    this.canvas.height = this.height

    this.canvas.style.width = `${this.width}px`
    this.canvas.style.height = `${this.height}px`

    this.ctx = this.canvas.getContext('2d')


    // 动画运行时间(毫秒)
    this.animationTime = 3000

    // 动画缓动函数名
    this.easingName = 'quarticOut'

    // 圆心坐标
    this.centerPoint = { x: this.width / 2, y: this.height / 2 }
  }

  // 设置配置
  setOption(options) {
    if (typeof options !== 'object') {
      throw new TypeError('options is not an object !')
    }
    this.init()

    this.options = options
    // 环数据
    this.value = options.data.value
    this.name = options.data.name
    this.currentValue = 0
    // 文本样式
    this.textStyle = options.textStyle

    // 其它项目样式
    const {
      animationTime, // 动画时间
      wave, // 波浪样式
      innerCircle, // 内环样式
      outterCircle,  // 外环样式
    } = options.itemStyle

    this.wave = wave
    this.innerCircle = innerCircle
    this.outterCircle = outterCircle
    this.animationTime = animationTime
    this.waterCycle = this.wave.waterCycle // 单波宽，周期宽度
    this.waterWidth = this.innerCircle.radius * 2 // 总宽
    this.waterHeight = this.wave.waterHeight  // 波高

    this.waterStartX = this.centerPoint.x - this.innerCircle.radius // 波浪开始x位置

    let value = this.value > 100 ? 100 : this.value
    let y = (this.innerCircle.radius * 2 * value) / 100 // y轴方向应该到的位置

    this.waterStartY = (this.height / 2) + this.innerCircle.radius - y// 波浪开始y位置

    this.waterCurrentY = this.waterStartY + y  // 波浪当前的y位置

    this.waveOffsetX = 0// 波左右偏移距离
    this.waveOffsetRange = this.wave.waveOffsetRange // 每次偏移距离，频率

    this.start()
  }

  // 开始绘画
  start() {
    // 画帧
    this.drawFrame()
    // 动画
    this.startAnimation()
  }

  // 动画
  startAnimation() {
    const animator = new Animator({
      start: [this.currentValue, this.waterStartY], // 起始值
      end: [this.value, this.waterCurrentY], // 结束值
      life: this.animationTime, // 生命周期，毫秒
      easing: this.easingName,  // 缓动函数名
    })

    animator.onframe = (end, value) => {
      if (end[0] === value[0]) {
        this.currentValue = (value[0])
      } else {
        this.currentValue = Math.floor(value[0])
      }
      this.waterCurrentY = end[1] - value[1]
    }
    animator.start()
    this.animator = animator
  }

  // 画帧
  drawFrame() {
    this.clear()
    this.drawCircles()
    this.drawWave()
    this.drawText()
    this.requestNumber = window.requestAnimationFrame(this.drawFrame.bind(this))
  }

  log(...arg) {
    console.log('WaterChart LOG:', ...arg)
  }

  // 画圆环
  drawCircles() {
    // 画内环
    this.drawArc({
      lineWidth: this.innerCircle.width,
      centerPoint: this.centerPoint,
      r: this.innerCircle.radius,
      startAngle: 0,
      endAngle: Math.PI * 2,
      lineCap: 'butt',
      color: this.innerCircle.color,
      shadow: false,
    })
    // 画外环
    this.drawArc({
      lineWidth: this.outterCircle.width,
      centerPoint: this.centerPoint,
      r: this.outterCircle.radius,
      startAngle: 0,
      endAngle: Math.PI * 2,
      lineCap: 'butt',
      color: this.outterCircle.color,
      shadow: false,
    })
  }

  // 画波浪
  drawWave() {
    this.initSin()
    this.drawSin()
  }

  // 初始化波浪
  initSin() {
    // 初始位置
    let wavePoints = []

    let offsetX = this.waveOffsetX
    this.waveOffsetX -= this.waveOffsetRange

    // this.log(this.waveOffsetX, this.waveOffsetRange)

    for (let i = 0; i < this.waterWidth; i++) {
      let xRadian = (Math.PI * 2 * i) / this.waterCycle
      let y = -Math.sin(xRadian + offsetX) * this.waterHeight
      wavePoints.push([i + this.waterStartX, y + this.waterCurrentY])
    }
    this.wavePoints = wavePoints
  }

  // 波浪
  drawSin() {
    this.ctx.save()
    this.ctx.beginPath()

    this.ctx.arc(this.centerPoint.x, this.centerPoint.y, this.innerCircle.radius - this.innerCircle.width / 2, 0, Math.PI * 2, false)
    this.ctx.clip()

    this.ctx.beginPath()
    // this.ctx.globalCompositeOperation = 'xor'
    this.ctx.moveTo(this.waterStartX, this.waterStartY)
    this.wavePoints.forEach(point => {
      this.ctx.lineTo(point[0], point[1])
    })
    // 画一个方形，回到起始点
    let maxY = this.wavePoints[this.wavePoints.length - 1][1] + (this.innerCircle.radius * 2)
    this.ctx.lineTo(this.wavePoints[this.wavePoints.length - 1][0], maxY)
    this.ctx.lineTo(this.waterStartX, maxY)
    this.ctx.fillStyle = this.wave.color
    this.ctx.shadowBlur = 8
    this.ctx.shadowColor = this.wave.color
    this.ctx.fill()

    this.ctx.restore()
  }


  // 画文字
  drawText() {
    this.ctx.save()
    this.ctx.beginPath()
    let textStyle = this.textStyle

    let title = textStyle.formatter
      .replace('{value}', this.currentValue)
      .replace('{name}', this.name)
    this.ctx.globalCompositeOperation = this.textStyle.globalCompositeOperation
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.translate(this.width / 2, this.height / 2)
    this.ctx.font = `${textStyle.fontWeight} ${textStyle.fontSize}px ${textStyle.fontFamily}`
    this.ctx.fillStyle = textStyle.color
    this.ctx.fillText(title, 0, 0)

    this.ctx.restore()
  }

  // 清除画布
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  // 画圆环
  drawArc({ lineWidth, centerPoint, r, startAngle, endAngle, lineCap = 'butt', color, shadow = false }) {
    this.ctx.save()
    this.ctx.beginPath()

    this.ctx.lineWidth = lineWidth
    this.ctx.lineCap = lineCap
    this.ctx.translate(centerPoint.x, centerPoint.y)
    this.ctx.rotate(this.startRadian)
    this.ctx.arc(0, 0, r, startAngle, endAngle, false)
    if (shadow) {
      this.ctx.shadowColor = color
      this.ctx.shadowBlur = 25
    }
    this.ctx.strokeStyle = color
    this.ctx.stroke()
    this.ctx.restore()
  }


  // 缩放
  resize() {
    this.log('resize')
    const devicePixelRatio = window.devicePixelRatio || 1

    const boundingRect = {
      width: this.containerDom.offsetWidth,
      height: this.containerDom.offsetHeight,
    }

    // 如果宽高变化，则缩放
    if (this.ctx.canvas.width !== boundingRect.width * devicePixelRatio || this.ctx.canvas.height !== boundingRect.height * devicePixelRatio) {
      this.ctx.canvas.style.width = `${boundingRect.width}px`
      this.ctx.canvas.style.height = `${boundingRect.height}px`

      this.ctx.canvas.width = boundingRect.width * devicePixelRatio
      this.ctx.canvas.height = boundingRect.height * devicePixelRatio
      this.width = boundingRect.width * devicePixelRatio
      this.height = boundingRect.height * devicePixelRatio

      // 圆心坐标
      this.centerPoint = { x: this.width / 2, y: this.height / 2 }
      this.init()
      this.setOption(this.options)
    }
  }

  // 初始化
  init() {
    if (this.requestNumber) {
      window.cancelAnimationFrame(this.requestNumber)
    }
    if (this.animator) {
      this.animator.stop()
      this.animator = null
    }
  }

  // 销毁实例
  dispose() {

  }
}

export default WaterChart

