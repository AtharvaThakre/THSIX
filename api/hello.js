module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({ 
    ok: true,
    message: 'Hello from API!',
    timestamp: new Date().toISOString()
  });
}