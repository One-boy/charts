/*
 * @Author: hy
 * @Date: 2019-03-11 17:21:58
 * @Last Modified by: hy
 * @Last Modified time: 2019-03-22 10:33:12
 */


// 活动图的实现

import Animator from '../lib/animator'

class Activity {
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

    // 起始角度
    this.startAngle = 0

    //环开始画的起始弧度位置
    this.startRadian = 0

    // 动画运行时间(毫秒)
    this.animationTime = 1000

    // 动画缓动函数名
    this.easingName = 'quarticOut'

    // 圆环默认颜色
    this.baseColor = 'red'
    // 圆环底色
    this.bottomColor = '#ccc'

    // 圆心坐标
    this.centerPoint = { x: this.width / 2, y: this.height / 2 }

    // 当前轮播到的索引
    this.carouselIndex = -1

    // 是否暂停轮播
    this.isPauseCarousel = false

    // 轮播到该环时，增加的宽度
    this.addWidth = 8

    this.listen()
  }

  // 设置配置
  setOption(options) {
    if (typeof options !== 'object') {
      throw new TypeError('options is not an object !')
    }
    this.options = options
    // 环数据
    this.data = options.data
    // 文本样式
    this.textStyle = options.textStyle
    // 其它项目样式
    const {
      lineCap = 'round', // 线头形状
      arcGap = 12,  // 环间隙
      innerRadius = 50,  // 内环半径
      width = 32,         // 环的宽度
      bottomColor = '#eee', // 圆环底色
      animationTime = 1000, // 动画运行时间
      startAngle = 0,//起始绘画角度
    } = options.itemStyle

    this.lineCap = lineCap
    this.arcGap = arcGap
    this.innerRadius = innerRadius
    this.circleWidth = width
    this.bottomColor = bottomColor
    this.animationTime = animationTime
    this.startRadian = this.angleToRadian(startAngle)

    this.addWidth = Math.floor(this.arcGap / 2)

    // 颜色映射
    this.visualMap = options.visualMap

    // 格式化
    this.normalizeData()

    // 渲染
    this.render()

    // 监听鼠标
    this.listen()
  }

  // 格式化数据
  normalizeData() {
    if (!Array.isArray(this.data)) {
      throw new TypeError('data is not an Array !')
    }
    if (!Array.isArray(this.visualMap)) {
      throw new TypeError('visualMap is not an Array !')
    }

    this.data = this.data.map((d, index) => {
      if (!d.baseValue) {
        d.baseValue = 100
      }
      d.percent = (d.value / d.baseValue) * 100

      d.percent = parseFloat(d.percent.toFixed(2)) // 保留两位小数

      const vm = this.visualMap.find(v => (d.value >= v.min && d.value <= v.max))
      d.color = vm ? vm.color : this.baseColor // 环颜色
      d.endAngle = this.percentToAngle(d.percent) // 结束角度
      d.r = this.innerRadius + ((index + 1) * (this.circleWidth + this.arcGap)) // 半径
      d.animation = true // 默认是有渲染动画
      return d
    })
  }

  log(...arg) {
    console.log('ArcChart LOG:', ...arg)
  }

  // 监听鼠标移动
  listen() {
    this.canvas.addEventListener('mousemove', this.mouseMove.bind(this))
  }

  // 移除监听
  removeListen() {
    this.canvas.removeEventListener('mousemove', this.mouseMove.bind(this))
  }


  // 鼠标移动
  mouseMove(e) {
    this.data.forEach(d => {
      const isIn = this.isInCircle(d, e.offsetX, e.offsetY)

      if (isIn && !d.circleWidth) {
        d.circleWidth = this.circleWidth + (this.arcGap / 2)
        d.showText = true
        this.pauseCarousel()
        this.drawArcs(false)
      }
      if (!isIn && d.circleWidth) {
        d.showText = false
        d.circleWidth = 0
        this.drawArcs(false)
      }
    })
  }

  //判断一个点是否在圆环上
  isInCircle(data, x, y) {
    let canvas = document.createElement('canvas')
    canvas.width = this.width
    canvas.height = this.height
    let ctx = canvas.getContext('2d')

    ctx.beginPath()
    ctx.lineWidth = data.circleWidth || this.circleWidth
    ctx.lineCap = this.lineCap
    ctx.translate(this.centerPoint.x, this.centerPoint.y)
    ctx.rotate(this.startRadian)
    ctx.arc(0, 0, data.r, this.angleToRadian(this.startAngle), this.angleToRadian(data.endAngle), false)
    ctx.stroke()
    return ctx.isPointInStroke(x, y)
  }


  // 显示文字
  showText(data) {
    const titleStyle = {
      font: 'sans-serif',
      fontSize: 22,
      color: 'black',
      fontWeight: 'normal',
      ...this.textStyle.title,
    }

    const percentStyle = {
      font: 'sans-serif',
      fontSize: 32,
      color: data.color,
      fontWeight: 'bold',
      ...this.textStyle.subTitle,
    }

    if (percentStyle.color === 'auto') {
      percentStyle.color = data.color
    }

    let title = titleStyle.formatter
      .replace('{name}', data.name)
      .replace('{percent}', data.percent)
      .replace('{value}', data.value)
      .replace('{baseValue}', data.baseValue)

    let subTitle = percentStyle.formatter
      .replace('{name}', data.name)
      .replace('{percent}', data.percent)
      .replace('{value}', data.value)
      .replace('{baseValue}', data.baseValue)

    this.ctx.save()
    // title
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.translate(this.width / 2, (this.height / 2) - percentStyle.fontSize * 0.7)
    this.ctx.font = `${titleStyle.fontWeight} ${titleStyle.fontSize}px ${titleStyle.fontFamily}`
    this.ctx.fillStyle = titleStyle.color
    this.ctx.fillText(title, 0, 0)
    this.ctx.restore()

    this.ctx.save()
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.translate(this.width / 2, (this.height / 2) + percentStyle.fontSize * 0.7)
    this.ctx.font = `${percentStyle.fontWeight} ${percentStyle.fontSize}px ${percentStyle.fontFamily}`
    this.ctx.fillStyle = percentStyle.color
    this.ctx.fillText(subTitle, 0, 0)

    this.ctx.restore()
  }


  // 渲染
  render() {
    this.drawArcs(true)
  }

  // 画图
  drawArcs(animation = false) {
    this.data.forEach((item, index) => {
      if (!animation || !item.animation) {
        this.drawAll()
        return
      }

      const animator = new Animator({
        // start: this.startAngle, // 起始值
        // end: item.endAngle, // 结束值
        start: [this.startAngle, (item.circleWidth || this.circleWidth)], // 起始值
        end: [item.oldEndAngle ? item.oldEndAngle : item.endAngle, (item.circleWidth || this.circleWidth) + this.addWidth], // 结束值
        life: this.animationTime, // 生命周期，毫秒
        easing: this.easingName,  // 缓动函数名
      })
      //保存老的endAngle
      if (!item.oldEndAngle) {
        item.oldEndAngle = item.endAngle
      }
      animator.onframe = (end, value) => {
        item.endAngle = value[0]
        item.percent = this.angleToPercent(value[0])
        this.drawAll(value[1])
      }
      animator.start()
    })
  }

  // 画所有
  drawAll(width) {
    this.clear()
    this.data.forEach((d, index) => {
      let addWidth = 0
      if (!this.isPauseCarousel && index === this.carouselIndex) {
        addWidth = width
      }
      this.drawArc({
        lineWidth: (d.circleWidth || this.circleWidth) + addWidth,
        centerPoint: this.centerPoint,
        r: d.r,
        startAngle: 0,
        endAngle: this.angleToRadian(360),
        lineCap: this.lineCap,
        color: this.bottomColor,
      })
      this.drawArc({
        lineWidth: (d.circleWidth || this.circleWidth) + addWidth,
        centerPoint: this.centerPoint,
        r: d.r,
        startAngle: this.angleToRadian(this.startAngle),
        endAngle: this.angleToRadian(d.endAngle),
        lineCap: this.lineCap,
        color: d.color,
      })
      if (d.showText) {
        this.showText(d)
      }
    })
  }

  // 清除画布
  clear() {
    this.ctx.clearRect(0, 0, this.width, this.height)
  }

  // 画圆环
  drawArc({ lineWidth, centerPoint, r, startAngle, endAngle, lineCap = 'round', color }) {
    this.ctx.save()
    this.ctx.beginPath()

    this.ctx.lineWidth = lineWidth
    this.ctx.lineCap = lineCap
    this.ctx.translate(centerPoint.x, centerPoint.y)
    this.ctx.rotate(this.startRadian)
    this.ctx.arc(0, 0, r, startAngle, endAngle, false)
    this.ctx.strokeStyle = color
    this.ctx.stroke()
    this.ctx.restore()
  }

  // 角度转弧度
  angleToRadian(angle) {
    return (Math.PI * angle) / 180
  }

  // 弧度转角度
  radianToAngle(radian) {
    return (radian * 180) / Math.PI
  }

  // 百分比转角度
  percentToAngle(percent) {
    if (percent >= 100) {
      return 360
    }
    return (18 * percent) / 5
  }

  // 角度转百分比
  angleToPercent(angle) {
    return parseFloat(((5 * angle) / 18).toFixed(0))
  }

  // 轮播
  startCarousel(time = 2000) {
    this.log('启动轮播')
    this.stopCarousel()
    this.isPauseCarousel = false
    this.carouselId = setTimeout(() => {
      this.carouselIndex++
      if (this.carouselIndex >= this.data.length) {
        this.carouselIndex = 0
      }
      this.data = this.data.map((d, index) => {
        if (index === this.carouselIndex) {
          d.animation = true
          d.showText = true
        } else {
          d.animation = false
          d.showText = false
        }
        return d
      })
      this.drawArcs(true)

      this.startCarousel(time)
    }, time + this.animationTime)
  }

  // 暂停轮播
  pauseCarousel() {
    if (!this.isPauseCarousel && this.carouselId) {
      this.log('暂停轮播')
      this.isPauseCarousel = true
      clearTimeout(this.carouselId)
      clearTimeout(this.restartCarouselId)
      this.restartCarouselId = setTimeout(this.startCarousel.bind(this), 5000) // 2秒后重启轮播
    }
  }

  // 停止轮播
  stopCarousel() {
    this.isPauseCarousel = false
    clearTimeout(this.carouselId)
    clearTimeout(this.restartCarouselId)
  }

  // 缩放
  resize() {
    this.log('resize')
    const devicePixelRatio = window.devicePixelRatio || 1

    // const boundingRect = this.containerDom.getBoundingClientRect()
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

      if (this.options) {
        this.setOption(this.options)
      }
    }
  }

  // 销毁实例
  dispose() {
    if (this.restartCarouselId) {
      clearTimeout(this.restartCarouselId)
    }
    if (this.carouselId) {
      clearTimeout(this.carouselId)
    }
    this.removeListen()
  }

}

export default Activity
