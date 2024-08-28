import { Router } from 'express';

const router: Router = Router();

/**
 * GET endpoint to receive collection metadata and its stories information from client
 * Note: will throw only 500 to prevent braze from sending the email if call fails.
 */
router.get('/:userid', async (req, res, next) => {
  // const userid = req.params.userid;

  try {
    // Fetch data to build a users digest
    return res.json({ list: [] });
  } catch (err) {
    // Let Express handle any errors
    next(err);
  }
});

export default router;
