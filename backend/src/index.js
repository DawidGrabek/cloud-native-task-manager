const express = require('express')

const app = express()
const port = process.env.PORT || 3000

// Middleware to parse JSON
app.use(express.json())

// Basic route
app.get('/', (req, res) => {
  res.send('Hello, world!')
})

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`)
})
