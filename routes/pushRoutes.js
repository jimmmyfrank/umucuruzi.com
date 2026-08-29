// routes/userRoutes.js (or pushRoutes.js)
router.post('/push-token', auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Token required' });
    await User.update({ push_token: token }, { where: { id: req.user.id } });
    res.json({ message: 'Token saved' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});