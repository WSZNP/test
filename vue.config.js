module.exports = {
  transpileDependencies: true,
  devServer: {
    proxy: {
      '/': {
        target: 'http://127.0.0.1:8888',
        changeOrigin: true,
      },
    },
    client: {
      webSocketURL: 'ws://192.168.0.103:8080/ws',
    },
  },
}
