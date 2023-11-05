

const express = require('express');
const app = express();
const port = process.env.PORT || 5000;


app.get('/', (req, res) => {
    res.send('Online study group server is running successfully')
  })
  
  app.listen(port, () => {
    console.log(`Group study is listening on port ${port}`)
  })