const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const ctrl = require('../controllers/budgetsController');

router.use(auth);

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.post('/', ctrl.create);
router.put('/:id', ctrl.update);
router.patch('/:id/status', ctrl.changeStatus);
router.post('/:id/comments', ctrl.addComment);
router.get('/:id/timeline', ctrl.getTimeline);
router.delete('/:id', ctrl.remove);

module.exports = router;