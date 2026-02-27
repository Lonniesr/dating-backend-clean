import { Request, Response } from "express";

export const getAnalytics = (req: Request, res: Response) => {
  res.json({ ok: true, data: [] });
};

export const getUsers = (req: Request, res: Response) => {
  res.json({ ok: true, users: [] });
};

export const getUserById = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, user: { id } });
};

export const banUser = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, banned: id });
};

export const unbanUser = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, unbanned: id });
};

export const getLogs = (req: Request, res: Response) => {
  res.json({ ok: true, logs: [] });
};

export const getModerationQueue = (req: Request, res: Response) => {
  res.json({ ok: true, items: [] });
};

export const resolveModerationItem = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, resolved: id });
};

export const getFeatureRollouts = (req: Request, res: Response) => {
  res.json({ ok: true, features: [] });
};

export const updateFeatureRollout = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const getExperiments = (req: Request, res: Response) => {
  res.json({ ok: true, experiments: [] });
};

export const updateExperiment = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const getSystemTasks = (req: Request, res: Response) => {
  res.json({ ok: true, tasks: [] });
};

export const runSystemTask = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, ran: id });
};

export const getApiKeys = (req: Request, res: Response) => {
  res.json({ ok: true, keys: [] });
};

export const createApiKey = (req: Request, res: Response) => {
  res.json({ ok: true, created: true });
};

export const revokeApiKey = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, revoked: id });
};

export const getContentLibrary = (req: Request, res: Response) => {
  res.json({ ok: true, content: [] });
};

export const updateContentItem = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const getOnboardingFlows = (req: Request, res: Response) => {
  res.json({ ok: true, flows: [] });
};

export const updateOnboardingFlow = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const getInternalTools = (req: Request, res: Response) => {
  res.json({ ok: true, tools: [] });
};

export const runInternalTool = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, ran: id });
};

export const getNotificationTemplates = (req: Request, res: Response) => {
  res.json({ ok: true, templates: [] });
};

export const updateNotificationTemplate = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const sendTestNotification = (req: Request, res: Response) => {
  res.json({ ok: true, sent: true });
};

export const getEmailTemplates = (req: Request, res: Response) => {
  res.json({ ok: true, templates: [] });
};

export const updateEmailTemplate = (req: Request, res: Response) => {
  const id = Array.isArray(req.params.id)
    ? req.params.id[0]
    : req.params.id;

  res.json({ ok: true, updated: id });
};

export const sendTestEmail = (req: Request, res: Response) => {
  res.json({ ok: true, sent: true });
};