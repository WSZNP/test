export function ParseFile(file, type = 'base64') {
  return new Promise(resovle => {
    let fileReader = new FileReader()
    if (type === 'base64') {
      fileReader.readAsDataURL(fileReader)
    } else if (type === 'buffer') {
      fileReader.readAsArrayBuffer(file)
    }
    fileReader.onload = e => {
      resovle(e.target.result)
    }
  })
}
