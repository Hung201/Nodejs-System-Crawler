const express = require('express');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();

// Placeholder routes - will be implemented later
router.get('/', auth, (req, res) => {
  res.json({ message: 'Sources route - to be implemented' });
});

router.post('/', auth, authorize('admin', 'editor'), (req, res) => {
  res.json({ message: 'Create source - to be implemented' });
});

router.get('/:id', auth, (req, res) => {
  res.json({ message: 'Get source by ID - to be implemented' });
});

router.put('/:id', auth, authorize('admin', 'editor'), (req, res) => {
  res.json({ message: 'Update source - to be implemented' });
});

router.delete('/:id', auth, authorize('admin'), (req, res) => {
  res.json({ message: 'Delete source - to be implemented' });
});

module.exports = router; 