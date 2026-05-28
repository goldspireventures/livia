import { Router, type IRouter } from "express";
import { requireAuth, requireRole } from "../lib/auth";
import {
  addApplication,
  createHiringPost,
  listApplications,
  listHiringPosts,
} from "../services/hiring.service";

import { sendError } from "../lib/http-errors";
const router: IRouter = Router();
const bizId = (p: string | string[]) => (Array.isArray(p) ? p[0] : p);

router.get(
  "/businesses/:businessId/hiring/posts",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    res.json(await listHiringPosts(bizId(req.params.businessId)));
  },
);

router.post(
  "/businesses/:businessId/hiring/posts",
  requireAuth,
  requireRole("OWNER"),
  async (req, res) => {
    const { title, description, roleType } = req.body;
    if (!title) {
      sendError(res, req, 400, "title required");
      return;
    }
    const row = await createHiringPost(bizId(req.params.businessId), {
      title,
      description,
      roleType,
    });
    res.status(201).json(row);
  },
);

router.get(
  "/businesses/:businessId/hiring/posts/:postId/applications",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    res.json(await listApplications(bizId(req.params.postId)));
  },
);

router.post(
  "/businesses/:businessId/hiring/posts/:postId/applications",
  requireAuth,
  requireRole("ADMIN"),
  async (req, res) => {
    const { applicantName, applicantEmail, applicantPhone, note } = req.body;
    if (!applicantName) {
      sendError(res, req, 400, "applicantName required");
      return;
    }
    const row = await addApplication(bizId(req.params.postId), {
      applicantName,
      applicantEmail,
      applicantPhone,
      note,
    });
    res.status(201).json(row);
  },
);

export default router;
