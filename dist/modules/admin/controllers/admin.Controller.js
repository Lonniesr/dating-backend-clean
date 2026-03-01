"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestEmail = exports.updateEmailTemplate = exports.getEmailTemplates = exports.sendTestNotification = exports.updateNotificationTemplate = exports.getNotificationTemplates = exports.runInternalTool = exports.getInternalTools = exports.updateOnboardingFlow = exports.getOnboardingFlows = exports.updateContentItem = exports.getContentLibrary = exports.revokeApiKey = exports.createApiKey = exports.getApiKeys = exports.runSystemTask = exports.getSystemTasks = exports.updateExperiment = exports.getExperiments = exports.updateFeatureRollout = exports.getFeatureRollouts = exports.resolveModerationItem = exports.getModerationQueue = exports.getLogs = exports.unbanUser = exports.banUser = exports.getUserById = exports.getUsers = exports.getAnalytics = void 0;
const getAnalytics = (req, res) => {
    res.json({ ok: true, data: [] });
};
exports.getAnalytics = getAnalytics;
const getUsers = (req, res) => {
    res.json({ ok: true, users: [] });
};
exports.getUsers = getUsers;
const getUserById = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, user: { id } });
};
exports.getUserById = getUserById;
const banUser = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, banned: id });
};
exports.banUser = banUser;
const unbanUser = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, unbanned: id });
};
exports.unbanUser = unbanUser;
const getLogs = (req, res) => {
    res.json({ ok: true, logs: [] });
};
exports.getLogs = getLogs;
const getModerationQueue = (req, res) => {
    res.json({ ok: true, items: [] });
};
exports.getModerationQueue = getModerationQueue;
const resolveModerationItem = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, resolved: id });
};
exports.resolveModerationItem = resolveModerationItem;
const getFeatureRollouts = (req, res) => {
    res.json({ ok: true, features: [] });
};
exports.getFeatureRollouts = getFeatureRollouts;
const updateFeatureRollout = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateFeatureRollout = updateFeatureRollout;
const getExperiments = (req, res) => {
    res.json({ ok: true, experiments: [] });
};
exports.getExperiments = getExperiments;
const updateExperiment = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateExperiment = updateExperiment;
const getSystemTasks = (req, res) => {
    res.json({ ok: true, tasks: [] });
};
exports.getSystemTasks = getSystemTasks;
const runSystemTask = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, ran: id });
};
exports.runSystemTask = runSystemTask;
const getApiKeys = (req, res) => {
    res.json({ ok: true, keys: [] });
};
exports.getApiKeys = getApiKeys;
const createApiKey = (req, res) => {
    res.json({ ok: true, created: true });
};
exports.createApiKey = createApiKey;
const revokeApiKey = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, revoked: id });
};
exports.revokeApiKey = revokeApiKey;
const getContentLibrary = (req, res) => {
    res.json({ ok: true, content: [] });
};
exports.getContentLibrary = getContentLibrary;
const updateContentItem = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateContentItem = updateContentItem;
const getOnboardingFlows = (req, res) => {
    res.json({ ok: true, flows: [] });
};
exports.getOnboardingFlows = getOnboardingFlows;
const updateOnboardingFlow = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateOnboardingFlow = updateOnboardingFlow;
const getInternalTools = (req, res) => {
    res.json({ ok: true, tools: [] });
};
exports.getInternalTools = getInternalTools;
const runInternalTool = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, ran: id });
};
exports.runInternalTool = runInternalTool;
const getNotificationTemplates = (req, res) => {
    res.json({ ok: true, templates: [] });
};
exports.getNotificationTemplates = getNotificationTemplates;
const updateNotificationTemplate = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateNotificationTemplate = updateNotificationTemplate;
const sendTestNotification = (req, res) => {
    res.json({ ok: true, sent: true });
};
exports.sendTestNotification = sendTestNotification;
const getEmailTemplates = (req, res) => {
    res.json({ ok: true, templates: [] });
};
exports.getEmailTemplates = getEmailTemplates;
const updateEmailTemplate = (req, res) => {
    const id = Array.isArray(req.params.id)
        ? req.params.id[0]
        : req.params.id;
    res.json({ ok: true, updated: id });
};
exports.updateEmailTemplate = updateEmailTemplate;
const sendTestEmail = (req, res) => {
    res.json({ ok: true, sent: true });
};
exports.sendTestEmail = sendTestEmail;
