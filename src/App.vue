<template>
  <div id="app">
    <el-upload
      class="upload-demo"
      drag
      action
      :auto-upload="false"
      :show-file-list="false"
      :on-change="changeFile"
      multiple
    >
      <i class="el-icon-upload"></i>
      <div class="el-upload__text">
        将文件拖到此处，或
        <em>点击上传</em>
      </div>
      <div class="el-upload__tip" slot="tip">只能上传jpg/png文件，且不超过500kb</div>
    </el-upload>

    <div class="progress">
      <span>上传进度：{{total|totalText}}%</span>
      <el-link type="primary" v-if="total>0 && total<100" @click="handleBtn">{{btn|btnText}}</el-link>
    </div>

    <!-- VIDEO -->
    <div class="uploadImg" v-if="img">
      <img :src="img" controls />
    </div>
  </div>
</template>
<script>
import { ParseFile } from './utils/ParseFile.js'
import SparkMd5 from 'spark-md5'
import axios from 'axios'
export default {
  data() {
    return {
      total: 0,
      img: null,
      btn: false,
    }
  },
  filters: {
    totalText(value) {
      return value > 100 ? 100 : value
    },
    btnText(value) {
      return value ? '继续' : '暂停'
    }
  },
  methods: {
    async changeFile(file) {
      // console.log(file)
      if (!file) return
      file = file.raw

      let { type } = file
      if (!/(png|jpg|jpeg|gif)/i.test(type)) {
        return this.$message('选择文件格式不正确!')
      }
      // 将文件转换为buffer格式
      let buffer = await ParseFile(file, 'buffer')
      // console.log(buffer)
      let spark = new SparkMd5.ArrayBuffer()
      let hash
      let suffix //上传文件后缀
      spark.append(buffer)
      hash = spark.end()//处理完成，获得hash值
      // console.log(hash);
      // 后缀
      suffix = /\.([0-9a-zA-Z]+)$/i.exec(file.name)[1]

      // 创建100个切片
      let fileList = []//文件切片列表
      let current = 0
      let partSize = file.size / 100

      for (let i = 0; i < 100; i++) {
        let item = {
          chunk: file.slice(current, current + partSize),
          filename: `${hash}_${i}.${suffix}`
        }
        current += partSize
        fileList.push(item)
      }
      this.fileList = fileList
      this.hash = hash
      this.requestSend()

    },
    async requestSend() {
      let requestList = []
      this.fileList.forEach((item, index) => {
        let fn = () => {
          let formDate = new FormData()
          formDate.append('chunk', item.chunk)
          formDate.append('filename', item.filename)
          return axios.post('/single3', formDate, { headers: { 'Content-Type': "multipart/form-data" } }).then(result => {
            result = result.data
            if (result.code === 0) {
              this.total += 1
              this.fileList.splice(index, 1)
            }
          })
        }
        requestList.push(fn)
      })

      // 串行发送
      let i = 0

      let complate = async () => {
        // console.log(this.hash);
        let res = await axios.get('/merge', {
          params: {
            hash: this.hash
          }
        })
        res = res.data
        if (res.code === 0) {
          this.img = res.path
        }
      }
      let send = async () => {
        if (this.abort) return
        if (i >= requestList.length) {
          complate()
          return
        }
        await requestList[i]()
        i++
        send()
      }
      send()
    },
    handleBtn() {
      if (this.btn) {
        this.abort = false
        this.btn = false
        this.requestSend()
        return
      }
      this.btn = true
      this.abort = true

    }
  }
}
</script>
<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
}
</style>
