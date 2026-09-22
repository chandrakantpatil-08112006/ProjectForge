import * as userService from '../services/user.service.js';
import { sendSuccess } from '../utils/apiResponse.js';

export async function updateMe(req, res) {
  const user = await userService.updateProfile(req.user, req.validated.body);
  sendSuccess(res, { user });
}
